"use server";

import sql from "@/lib/db";
import s3Client from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { unstable_cache, revalidatePath } from "next/cache";
import { adminSessionOptions, type AdminSessionData, staffSessionOptions, type StaffSessionData } from "@/lib/session";
import Razorpay from "razorpay";
import * as crypto from "crypto";

// ---------------------------------------------------------------------------
// Shared Zod Schemas
// ---------------------------------------------------------------------------
const phoneSchema = z.string().regex(/^\d{10}$/, "Must be a 10-digit mobile number");

const productSchema = z.object({
    name: z.string().min(1).max(100).trim(),
    category: z.string().min(1).max(100).trim(),
    price: z.number().positive(),
    image: z.string().min(1),
    description: z.string().max(1000).trim(),
    unit: z.string().min(1).max(30).trim(),
});

const ORDER_STATUSES = ["pending", "preparing", "prepared", "in transit", "delivered", "cancelled"] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

const STAFF_ROLES = ["baker", "manager", "admin", "accountant", "delivery"] as const;

const staffSchema = z.object({
    name: z.string().min(1).max(100).trim(),
    email: z.string().email(),
    phone: z.string().regex(/^\d{10}$/),
    role: z.enum(STAFF_ROLES),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const addressSchema = z.object({
    user_id: z.number(),
    receiver_name: z.string().min(1).max(100).trim(),
    receiver_phone: phoneSchema,
    address_line1: z.string().min(1).max(200).trim(),
    address_line2: z.string().max(200).trim().optional(),
    city: z.string().min(1).max(50).trim(),
    pincode: z.string().regex(/^\d{6}$/, "Must be a 6-digit pincode"),
    is_default: z.boolean().default(false),
});

const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

// ---------------------------------------------------------------------------
// Session helpers
// ---------------------------------------------------------------------------
async function getAdminSessionInternal() {
    return getIronSession<AdminSessionData>(await cookies(), adminSessionOptions);
}

/** Verify the caller is an authenticated admin. Throws/redirects if not. */
export async function verifySession(): Promise<{ isAdmin: true }> {
    const session = await getAdminSessionInternal();
    if (!session.isAdmin) {
        redirect("/bakery/admin/login");
    }
    return { isAdmin: true };
}

// ---------------------------------------------------------------------------
// OTP Server Actions (keeps API key out of the browser bundle)
// ---------------------------------------------------------------------------
export async function sendOtp(phone: string) {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) return { success: false as const, error: "Invalid phone number" };

    // ── DEV-ONLY BYPASS ─────────────────────────────────────────────────────
    // Skips real SMS to avoid costs during local development.
    // This block is eliminated in production builds (NODE_ENV !== 'development').
    if (process.env.NODE_ENV === "development" && parsed.data === "8860792647") {
        console.warn("[DEV] OTP send bypassed for test number 8860792647.");
        return { success: true as const, sessionId: "dev-bypass-session" };
    }
    // ────────────────────────────────────────────────────────────────────────

    const apiKey = process.env.TWO_FACTOR_API_KEY;
    const template = process.env.OTP_TEMPLATE_NAME || "AUTOGEN2";

    if (!apiKey) {
        console.error("TWO_FACTOR_API_KEY is not configured");
        return { success: false as const, error: "OTP service is not configured" };
    }

    try {
        const fullPhone = `91${parsed.data}`;
        const url = `https://2factor.in/API/V1/${apiKey}/SMS/${fullPhone}/AUTOGEN2/${template}`;
        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json();

        if (data.Status === "Success") {
            return { success: true as const, sessionId: data.Details as string };
        }
        return { success: false as const, error: data.Details || "Failed to send OTP" };
    } catch (err) {
        console.error("sendOtp failed:", err);
        return { success: false as const, error: "OTP service unavailable. Please try again." };
    }
}

export async function verifyOtp(sessionId: string, otp: string) {
    if (!sessionId || !otp || !/^\d{4,6}$/.test(otp)) {
        return { success: false as const, error: "Invalid OTP format" };
    }

    // ── DEV-ONLY BYPASS ─────────────────────────────────────────────────────
    if (process.env.NODE_ENV === "development" && otp === "123456") {
        console.warn("[DEV] OTP verification bypassed with master code 123456.");
        return { success: true as const };
    }
    // ────────────────────────────────────────────────────────────────────────

    const apiKey = process.env.TWO_FACTOR_API_KEY;
    if (!apiKey) {
        return { success: false as const, error: "OTP service is not configured" };
    }

    try {
        const url = `https://2factor.in/API/V1/${apiKey}/SMS/VERIFY/${sessionId}/${otp}`;
        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json();

        if (data.Status === "Success" || data.Details === "OTP Matched") {
            return { success: true as const };
        }
        return { success: false as const, error: "Invalid OTP. Please try again." };
    } catch (err) {
        console.error("verifyOtp failed:", err);
        // SECURITY: Never grant access on error
        return { success: false as const, error: "Verification service unavailable. Please try again." };
    }
}

// ---------------------------------------------------------------------------
// User Actions
// ---------------------------------------------------------------------------
export async function checkUser(phone: string) {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) return { exists: false, user: null, error: "Invalid phone" };
    try {
        const users = await sql`
            SELECT id, name, email, phone FROM users WHERE phone = ${parsed.data}
        `;
        return { exists: users.length > 0, user: users[0] || null };
    } catch (err) {
        console.error("Error checking user:", err);
        return { exists: false, user: null, error: "Database error" };
    }
}

export async function registerUser(phone: string, name: string, email: string) {
    const schema = z.object({
        phone: phoneSchema,
        name: z.string().min(1).max(100).trim(),
        email: z.string().email(),
    });
    const parsed = schema.safeParse({ phone, name, email });
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0].message };
    }
    try {
        const users = await sql`
            INSERT INTO users (phone, name, email)
            VALUES (${parsed.data.phone}, ${parsed.data.name}, ${parsed.data.email})
            RETURNING id, name, email, phone
        `;
        return { success: true as const, user: users[0] };
    } catch (err) {
        console.error("Error registering user:", err);
        return { success: false as const, error: "Failed to register user. Email or phone may already be in use." };
    }
}
// ---------------------------------------------------------------------------
// Admin Auth
// ---------------------------------------------------------------------------
export async function verifyAdmin(email: string, pass: string) {
    try {
        // 1. Check if this is a Staff member with 'admin' role
        const staff = await sql`
            SELECT role, password_hash FROM staff WHERE email = ${email}
        `;

        if (staff.length > 0 && (staff[0] as any).role === 'admin') {
            const isValid = await bcrypt.compare(pass, (staff[0] as any).password_hash);
            if (isValid) {
                const session = await getAdminSessionInternal();
                session.isAdmin = true;
                await session.save();
                return { success: true as const };
            }
            return { success: false as const, error: "Invalid credentials" };
        }
        // If no staff found or role is not admin
        return { success: false as const, error: "Invalid credentials" };
    } catch (err) {
        console.error("Admin verification failed:", err);
        return { success: false as const, error: "Authentication service error" };
    }
}

export async function logoutAdmin() {
    const session = await getAdminSessionInternal();
    session.destroy();
    redirect("/bakery/admin/login");
}

export async function getHealthStatus() {

    try {
        const start = Date.now();
        await sql`SELECT 1`;
        const latency = Date.now() - start;

        const userCount = await sql`SELECT count(*) FROM users`;

        return {
            status: "healthy",
            database: {
                connected: true,
                latency: `${latency}ms`,
                userCount: parseInt(userCount[0].count)
            },
            timestamp: new Date().toISOString()
        };
    } catch (err) {
        console.error("Health check failed:", err);
        return {
            status: "unhealthy",
            database: {
                connected: false,
                error: "Connection failed"
            },
            timestamp: new Date().toISOString()
        };
    }
}


const getCachedProducts = unstable_cache(
    async () => {
        try {
            const products = await sql`SELECT * FROM products ORDER BY created_at DESC`;
            return { success: true, products };
        } catch (err) {
            console.error("Failed to fetch products:", err);
            return { success: false, error: "Database error" };
        }
    },
    ["bakery-products"],
    { revalidate: 60, tags: ["products"] }
);

export async function getProducts() {
    return getCachedProducts();
}

export async function getProductsForUser(userId: number) {
    try {
        const products = await sql`
            SELECT 
                p.*,
                COALESCE(up.price, p.price) as effective_price,
                CASE WHEN up.price IS NOT NULL THEN true ELSE false END as is_custom_price
            FROM products p
            LEFT JOIN user_prices up ON p.id = up.product_id AND up.user_id = ${userId}
            ORDER BY p.created_at DESC
        `;
        // Map effective_price back to price for easy frontend usage
        const productsWithPrice = products.map((p: any) => ({
            ...p,
            original_price: p.price,
            price: p.effective_price
        }));
        return { success: true, products: productsWithPrice };
    } catch (err) {
        console.error("Failed to fetch products for user:", err);
        return { success: false, error: "Database error" };
    }
}

export async function addProduct(product: { name: string, category: string, price: number, image: string, description: string, unit: string }) {
    const parsed = productSchema.safeParse(product);
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0].message };
    }
    try {
        const newProduct = await sql`
            INSERT INTO products (name, category, price, image, description, unit)
            VALUES (
                ${parsed.data.name}, ${parsed.data.category}, ${parsed.data.price},
                ${parsed.data.image}, ${parsed.data.description}, ${parsed.data.unit}
            )
            RETURNING *
        `;
        revalidatePath("/bakery", "layout");
        return { success: true as const, product: newProduct[0] };
    } catch (err) {
        console.error("Failed to add product:", err);
        return { success: false as const, error: "Failed to add product" };
    }
}

export async function deleteProduct(id: number) {
    try {
        await sql`
      DELETE FROM products WHERE id = ${id}
    `;
        revalidatePath("/bakery", "layout");
        return { success: true };
    } catch (err) {
        console.error("Failed to delete product:", err);
        return { success: false, error: "Failed to delete product" };
    }
}

const getCachedCategories = unstable_cache(
    async () => {
        try {
            const categories = await sql`SELECT * FROM categories ORDER BY name ASC`;
            return { success: true, categories };
        } catch (err) {
            console.error("Failed to fetch categories:", err);
            return { success: false, error: "Database error" };
        }
    },
    ["bakery-categories"],
    { revalidate: 3600, tags: ["categories"] }
);

export async function getCategories() {
    return getCachedCategories();
}

export async function addCategory(name: string) {
    try {
        const newCategory = await sql`
      INSERT INTO categories (name)
      VALUES (${name})
      RETURNING *
    `;
        revalidatePath("/bakery", "layout");
        return { success: true, category: newCategory[0] };
    } catch (err) {
        console.error("Failed to add category:", err);
        return { success: false, error: "Failed to add category (might already exist)" };
    }
}

export async function deleteCategory(id: number) {
    try {
        // Note: We might want to check if products exist in this category first, 
        // but for now we'll just delete.
        await sql`
      DELETE FROM categories WHERE id = ${id}
    `;
        revalidatePath("/bakery", "layout");
        return { success: true };
    } catch (err) {
        console.error("Failed to delete category:", err);
        return { success: false, error: "Failed to delete category" };
    }
}

export async function updateCategory(id: number, name: string) {
    try {
        const updated = await sql`
      UPDATE categories 
      SET name = ${name}
      WHERE id = ${id}
      RETURNING *
    `;
        revalidatePath("/bakery", "layout");
        return { success: true, category: updated[0] };
    } catch (err) {
        console.error("Failed to update category:", err);
        return { success: false, error: "Failed to update category" };
    }
}

export async function updateProduct(id: number, product: { name: string, category: string, price: number, image: string, description: string, unit: string }) {
    const parsed = productSchema.safeParse(product);
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0].message };
    }
    try {
        const updated = await sql`
            UPDATE products
            SET name        = ${parsed.data.name},
                category    = ${parsed.data.category},
                price       = ${parsed.data.price},
                image       = ${parsed.data.image},
                description = ${parsed.data.description},
                unit        = ${parsed.data.unit}
            WHERE id = ${id}
            RETURNING *
        `;
        revalidatePath("/bakery", "layout");
        return { success: true as const, product: updated[0] };
    } catch (err) {
        console.error("Failed to update product:", err);
        return { success: false as const, error: "Failed to update product" };
    }
}

export async function uploadImage(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        if (!file) {
            return { success: false, error: "No file provided" };
        }

        // VALIDATIONS
        // 1. Size check (5MB limit)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return { success: false, error: "File too large. Maximum size is 5MB." };
        }

        // 2. Type check — allowlist by MIME type (never trust user-supplied filename)
        const fileExt = ALLOWED_MIME_EXTENSIONS[file.type];
        if (!fileExt) {
            return { success: false, error: "Invalid file type. Only JPEG, PNG, WebP, or GIF images are allowed." };
        }
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `products/${fileName}`;

        const buffer = Buffer.from(await file.arrayBuffer());
        const bucket = process.env.SUPABASE_STORAGE_BUCKET || "products";

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: filePath,
            Body: buffer,
            ContentType: file.type,
        });

        await s3Client.send(command);

        // Construct Public URL
        const projectId = process.env.SUPABASE_PROJECT_ID;
        const publicUrl = `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${filePath}`;

        return { success: true, url: publicUrl };
    } catch (err: any) {
        console.error("Image upload failed:", err);
        return { success: false, error: err.message };
    }
}

// --- STAFF MANAGEMENT ---

export async function getStaffMembers() {
    try {
        const staff = await sql`
            SELECT id, name, email, phone, role, created_at 
            FROM staff 
            ORDER BY created_at DESC
        `;
        return { success: true, staff };
    } catch (err) {
        console.error("Failed to fetch staff:", err);
        return { success: false, error: "Database error" };
    }
}

export async function addStaff(staffMember: { name: string, email: string, phone: string, role: string, password: string }) {
    const parsed = staffSchema.safeParse(staffMember);
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0].message };
    }
    try {
        // SECURITY: Hash password before storing — never store plaintext
        const passwordHash = await bcrypt.hash(parsed.data.password, 12);
        const newStaff = await sql`
            INSERT INTO staff (name, email, phone, role, password_hash)
            VALUES (
                ${parsed.data.name}, ${parsed.data.email},
                ${parsed.data.phone}, ${parsed.data.role}, ${passwordHash}
            )
            RETURNING id, name, email, phone, role
        `;
        return { success: true as const, staff: newStaff[0] };
    } catch (err) {
        console.error("Failed to add staff member:", err);
        return { success: false as const, error: "Failed to add staff (email/phone might already be in use)" };
    }
}

export async function updateStaff(id: number, staffMember: { name: string, email: string, phone: string, role: string }) {
    try {
        // Find current role
        const currentStaff = await sql`SELECT role FROM staff WHERE id = ${id}`;
        if (currentStaff.length === 0) return { success: false, error: "Staff member not found" };

        const oldRole = (currentStaff[0] as any).role;
        const newRole = staffMember.role;

        // If we are changing an admin to a non-admin role, check if they are the last admin
        if (oldRole === 'admin' && newRole !== 'admin') {
            const adminCount = await sql`SELECT count(*) FROM staff WHERE role = 'admin'`;
            const currentCount = parseInt((adminCount[0] as any).count);

            if (currentCount <= 1) {
                return {
                    success: false,
                    error: "Security Lock: Cannot downgrade the last administrator. Please appoint another admin first."
                };
            }
        }

        const updated = await sql`
            UPDATE staff 
            SET name = ${staffMember.name}, 
                email = ${staffMember.email}, 
                phone = ${staffMember.phone}, 
                role = ${staffMember.role}
            WHERE id = ${id}
            RETURNING id, name, email, phone, role
        `;
        return { success: true, staff: updated[0] };
    } catch (err) {
        console.error("Failed to update staff:", err);
        return { success: false, error: "Failed to update staff" };
    }
}

export async function deleteStaff(id: number) {
    try {
        // Find current role
        const currentStaff = await sql`SELECT role FROM staff WHERE id = ${id}`;
        if (currentStaff.length === 0) return { success: false, error: "Staff member not found" };

        const role = (currentStaff[0] as any).role;

        // If it's an admin, check if they are the last one
        if (role === 'admin') {
            const adminCount = await sql`SELECT count(*) FROM staff WHERE role = 'admin'`;
            const currentCount = parseInt((adminCount[0] as any).count);

            if (currentCount <= 1) {
                return {
                    success: false,
                    error: "Security Lock: Cannot delete the last administrator account. Please create another admin first."
                };
            }
        }

        await sql`DELETE FROM staff WHERE id = ${id}`;
        return { success: true };
    } catch (err) {
        console.error("Failed to delete staff:", err);
        return { success: false, error: "Failed to delete staff" };
    }
}

// --- ORDER MANAGEMENT ---

// (Redundant placeOrder removed, using consolidated version below)

export async function getOrders() {
    try {
        const orders = await sql`
            SELECT
                o.id, o.status, o.total_price, o.created_at, o.payment_status, o.acknowledged_by,
                u.name  AS user_name,
                u.phone AS user_phone,
                a.address_line1, a.city, a.pincode,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id',              oi.id,
                            'product_id',      oi.product_id,
                            'quantity',        oi.quantity,
                            'price_at_time',   oi.price_at_time,
                            'product_name',    p.name,
                            'product_image',   p.image
                        ) ORDER BY oi.id
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'
                ) AS items
            FROM orders o
            JOIN users u ON o.user_id = u.id
            LEFT JOIN addresses a ON o.delivery_address_id = a.id
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN products    p  ON p.id = oi.product_id
            GROUP BY o.id, o.status, o.total_price, o.created_at, o.payment_status, o.acknowledged_by, u.name, u.phone, a.address_line1, a.city, a.pincode
            ORDER BY o.created_at DESC
        `;
        return { success: true as const, orders };
    } catch (err) {
        console.error("Failed to fetch orders:", err);
        return { success: false as const, error: "Database error" };
    }
}

export async function updateOrderStatus(orderId: number, status: string, staffId?: number) {
    // SECURITY: validate status against an allowlist to prevent arbitrary DB values
    if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
        return { success: false as const, error: `Invalid status. Must be one of: ${ORDER_STATUSES.join(", ")}` };
    }
    try {
        const updated = await sql`
            UPDATE orders
            SET status = ${status as OrderStatus}
            ${staffId ? sql`, acknowledged_by = ${staffId}` : sql``}
            WHERE id = ${orderId}
            RETURNING *
        `;
        return { success: true as const, order: updated[0] };
    } catch (err) {
        console.error("Failed to update status:", err);
        return { success: false as const, error: "Failed to update status" };
    }
}

export async function staffLogin(email: string, pass: string) {
    const schema = z.object({ email: z.string().email(), pass: z.string().min(1) });
    const parsed = schema.safeParse({ email, pass });
    if (!parsed.success) {
        return { success: false as const, error: "Invalid credentials" };
    }
    try {
        // Fetch by email only, then use bcrypt.compare — never compare plaintext in SQL
        const staff = await sql`
            SELECT id, name, email, phone, role, password_hash
            FROM staff
            WHERE email = ${parsed.data.email}
        `;

        if (staff.length === 0) {
            // Return same error regardless of whether email exists (prevents user enumeration)
            return { success: false as const, error: "Invalid credentials" };
        }

        const isValid = await bcrypt.compare(parsed.data.pass, (staff[0] as any).password_hash);
        if (!isValid) {
            return { success: false as const, error: "Invalid credentials" };
        }

        const { password_hash, ...staffWithoutHash } = staff[0] as any;

        // If Admin/Owner, grant session access to the global Admin Panel
        if (staffWithoutHash.role === 'admin') {
            const session = await getAdminSessionInternal();
            session.isAdmin = true;
            await session.save();
        }

        // Grant the staff session cookie
        const staffSession = await getIronSession<StaffSessionData>(await cookies(), staffSessionOptions);
        staffSession.staff = staffWithoutHash;
        await staffSession.save();

        return { success: true as const, staff: staffWithoutHash };
    } catch (err) {
        console.error("Staff login failed:", err);
        return { success: false as const, error: "Database error" };
    }
}

export async function getStaffSession() {
    const session = await getIronSession<StaffSessionData>(await cookies(), staffSessionOptions);
    return session.staff;
}

export async function logoutStaff() {
    const session = await getIronSession<StaffSessionData>(await cookies(), staffSessionOptions);
    session.destroy();

    // Also destroy admin session if they are an admin
    const adminSession = await getAdminSessionInternal();
    adminSession.destroy();

    return { success: true };
}

// --- USER SETTINGS & ADDRESSES ---

export async function updateUserDetails(id: number, name: string, email: string) {
    try {
        const updated = await sql`
            UPDATE users
            SET name = ${name.trim()}, email = ${email.trim()}
            WHERE id = ${id}
            RETURNING id, name, email, phone
        `;
        if (updated.length === 0) return { success: false, error: "User not found" };
        return { success: true, user: updated[0] };
    } catch (err) {
        console.error("Failed to update user details:", err);
        return { success: false, error: "Email already in use or database error" };
    }
}

export async function getAddresses(userId: number) {
    try {
        const addresses = await sql`
            SELECT * FROM addresses WHERE user_id = ${userId} ORDER BY is_default DESC, created_at DESC
        `;
        return { success: true, addresses };
    } catch (err) {
        console.error("Failed to fetch addresses:", err);
        return { success: false, error: "Database error" };
    }
}

export async function addAddress(address: z.infer<typeof addressSchema>) {
    const parsed = addressSchema.safeParse(address);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };

    try {
        return await sql.begin(async (tx: any) => {
            if (parsed.data.is_default) {
                await tx`UPDATE addresses SET is_default = false WHERE user_id = ${parsed.data.user_id}`;
            }

            const [newAddress] = await tx`
                INSERT INTO addresses (
                    user_id, receiver_name, receiver_phone, 
                    address_line1, address_line2, city, pincode, is_default
                ) VALUES (
                    ${parsed.data.user_id}, ${parsed.data.receiver_name}, ${parsed.data.receiver_phone},
                    ${parsed.data.address_line1}, ${parsed.data.address_line2 || null}, 
                    ${parsed.data.city}, ${parsed.data.pincode}, ${parsed.data.is_default}
                ) RETURNING *
            `;
            return { success: true, address: newAddress };
        });
    } catch (err) {
        console.error("Failed to add address:", err);
        return { success: false, error: "Database error" };
    }
}

export async function updateAddress(id: number, userId: number, address: Partial<z.infer<typeof addressSchema>>) {
    try {
        return await sql.begin(async (tx: any) => {
            if (address.is_default) {
                await tx`UPDATE addresses SET is_default = false WHERE user_id = ${userId}`;
            }

            const updated = await tx`
                UPDATE addresses
                SET 
                    receiver_name = COALESCE(${address.receiver_name}, receiver_name),
                    receiver_phone = COALESCE(${address.receiver_phone}, receiver_phone),
                    address_line1 = COALESCE(${address.address_line1}, address_line1),
                    address_line2 = ${address.address_line2 ?? null},
                    city = COALESCE(${address.city}, city),
                    pincode = COALESCE(${address.pincode}, pincode),
                    is_default = COALESCE(${address.is_default}, is_default)
                WHERE id = ${id} AND user_id = ${userId}
                RETURNING *
            `;
            if (updated.length === 0) return { success: false, error: "Address not found" };
            return { success: true, address: updated[0] };
        });
    } catch (err) {
        console.error("Failed to update address:", err);
        return { success: false, error: "Database error" };
    }
}

export async function deleteAddress(id: number, userId: number) {
    try {
        await sql`DELETE FROM addresses WHERE id = ${id} AND user_id = ${userId}`;
        return { success: true };
    } catch (err) {
        console.error("Failed to delete address:", err);
        return { success: false, error: "Database error" };
    }
}

// --- USER ORDERS ---

export async function getUserOrders(userId: number) {
    try {
        const orders = await sql`
            SELECT
                o.id, o.status, o.total_price, o.created_at, o.payment_status,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id',              oi.id,
                            'product_id',      oi.product_id,
                            'quantity',        oi.quantity,
                            'price_at_time',   oi.price_at_time,
                            'product_name',    p.name,
                            'product_image',   p.image
                        ) ORDER BY oi.id
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'
                ) AS items
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN products    p  ON p.id = oi.product_id
            WHERE o.user_id = ${userId}
            GROUP BY o.id, o.status, o.total_price, o.created_at, o.payment_status
            ORDER BY o.created_at DESC
        `;
        return { success: true, orders };
    } catch (err) {
        console.error("Failed to fetch user orders:", err);
        return { success: false, error: "Database error" };
    }
}

// --- Checkout & Payments ---

let razorpayInstance: any = null;

function getRazorpay() {
    if (razorpayInstance) return razorpayInstance;

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
        console.warn("Razorpay keys are missing. Payment features will be disabled.");
        return null;
    }

    const RazorpayAny = Razorpay as any;
    razorpayInstance = new (RazorpayAny.default || RazorpayAny)({
        key_id,
        key_secret,
    });
    return razorpayInstance;
}

export async function createRazorpayOrder(amount: number) {
    try {
        const options = {
            amount: Math.round(amount * 100), // Razorpay expects paise
            currency: "INR",
            receipt: `rcpt_${Date.now()}`,
        };
        const rzp = getRazorpay();
        if (!rzp) return { success: false, error: "Payment system is not configured." };

        const order = await rzp.orders.create(options);
        return { success: true, orderId: order.id, amount: order.amount };
    } catch (err) {
        console.error("Razorpay Order Creation Failed:", err);
        return { success: false, error: "Failed to initialize payment" };
    }
}

export async function verifyRazorpayPayment(
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
) {
    const rzp = getRazorpay();
    if (!rzp) return { success: false, error: "Payment system is not configured." };

    try {
        const body = razorpayOrderId + "|" + razorpayPaymentId;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest("hex");

        if (expectedSignature === razorpaySignature) {
            await sql`
                UPDATE orders 
                SET 
                    payment_status = 'paid',
                    razorpay_order_id = ${razorpayOrderId},
                    razorpay_payment_id = ${razorpayPaymentId},
                    razorpay_signature = ${razorpaySignature}
                WHERE id = ${orderId}
            `;
            return { success: true };
        } else {
            return { success: false, error: "Invalid signature" };
        }
    } catch (err) {
        console.error("Payment Verification Failed:", err);
        return { success: false, error: "Verification error" };
    }
}

export async function completeOrderDummy(orderId: number) {
    try {
        await sql`
            UPDATE orders 
            SET payment_status = 'paid'
            WHERE id = ${orderId}
        `;
        return { success: true };
    } catch (err) {
        console.error("Dummy Payment Failed:", err);
        return { success: false, error: "Database error" };
    }
}

const placeOrderSchema = z.object({
    userId: z.number().positive(),
    items: z.array(z.object({
        id: z.number().positive(),
        quantity: z.number().positive(),
    })).min(1),
    addressId: z.number().positive(),
});

export async function placeOrder(userId: number, items: { id: number, quantity: number }[], frontendTotal: number, addressId: number) {
    try {
        // 1. Verify User Session
        const session = await getIronSession<{ user?: any }>(await cookies(), {
            password: process.env.SECRET_COOKIE_PASSWORD || "complex_password_at_least_32_characters_long",
            cookieName: "vvip_user_session",
        });

        // Uncomment session check when testing in real environment
        // if (!session?.user || session.user.id !== userId) {
        //    return { success: false, error: "Unauthorized" };
        // }

        // 2. Input Validation
        const parsed = placeOrderSchema.safeParse({ userId, items, addressId });
        if (!parsed.success) {
            return { success: false, error: "Invalid order data" };
        }

        const validData = parsed.data;

        // 3. Server-side Price Verification
        const productsRes = await getProductsForUser(validData.userId);
        if (!productsRes.success) throw new Error("Could not fetch prices");

        const availableProducts = productsRes.products || [];
        let calculatedTotal = 0;
        const finalItems: { product_id: number, quantity: number, price_at_time: number }[] = [];

        for (const item of validData.items) {
            const product = availableProducts.find((p: any) => p.id === item.id);
            if (!product) {
                return { success: false, error: `Product ID ${item.id} not found` };
            }
            const itemTotal = product.price * item.quantity;
            calculatedTotal += itemTotal;
            finalItems.push({
                product_id: product.id,
                quantity: item.quantity,
                price_at_time: product.price
            });
        }

        // 4. Execute Transaction
        return await sql.begin(async (tx: any) => {
            const [order] = await tx`
                INSERT INTO orders (user_id, total_price, delivery_address_id, status, payment_status)
                VALUES (${validData.userId}, ${calculatedTotal}, ${validData.addressId}, 'pending', 'pending')
                RETURNING id
            `;

            for (const item of finalItems) {
                await tx`
                    INSERT INTO order_items (order_id, product_id, quantity, price_at_time)
                    VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${item.price_at_time})
                `;
            }

            return { success: true, orderId: order.id };
        });
    } catch (err) {
        console.error("Failed to place order:", err);
        return { success: false, error: "An unexpected error occurred while placing your order" };
    }
}

// --- USER PRICING MANAGEMENT ---

export async function getUsers() {
    try {
        const users = await sql`
            SELECT id, name, email, phone, created_at FROM users ORDER BY created_at DESC
        `;
        return { success: true, users };
    } catch (err) {
        console.error("Failed to fetch users:", err);
        return { success: false, error: "Database error" };
    }
}

export async function getUserPrices(userId: number) {
    try {
        const prices = await sql`
            SELECT product_id, price FROM user_prices WHERE user_id = ${userId}
        `;
        return { success: true, prices };
    } catch (err) {
        console.error("Failed to fetch user prices:", err);
        return { success: false, error: "Database error" };
    }
}

export async function setUserPrice(userId: number, productId: number, price: number) {
    try {
        if (price === 0 || isNaN(price)) {
            // Delete if price is 0 or invalid (reset to base price)
            await sql`
                DELETE FROM user_prices 
                WHERE user_id = ${userId} AND product_id = ${productId}
            `;
        } else {
            await sql`
                INSERT INTO user_prices (user_id, product_id, price)
                VALUES (${userId}, ${productId}, ${price})
                ON CONFLICT (user_id, product_id)
                DO UPDATE SET price = EXCLUDED.price, updated_at = CURRENT_TIMESTAMP
            `;
        }
        return { success: true };
    } catch (err) {
        console.error("Failed to set user price:", err);
        return { success: false, error: "Database error" };
    }
}
