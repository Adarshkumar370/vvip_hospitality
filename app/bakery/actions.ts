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
import { adminSessionOptions, type AdminSessionData, staffSessionOptions, type StaffSessionData, userSessionOptions, type UserSessionData } from "@/lib/session";
import Razorpay from "razorpay";
import * as crypto from "crypto";

// ---------------------------------------------------------------------------
// Shared Zod Schemas
// ---------------------------------------------------------------------------
const phoneSchema = z.string().regex(/^\d{10}$/, "Must be a 10-digit mobile number");

const productSchema = z.object({
    name: z.string().min(1).max(100).trim(),
    category: z.string().min(1).max(100).trim(),
    price: z.coerce.number().positive(),
    image: z.string().min(1),
    description: z.string().max(1000).trim(),
    unit: z.string().min(1).max(30).trim(),
    max_daily_limit: z.coerce.number().nonnegative().default(100),
});

const ORDER_STATUSES = ["payment_pending", "payment_failed", "placed", "confirmed", "preparing", "ready_for_pickup", "out_for_delivery", "completed", "cancelled"] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

const LEGACY_TO_DB_ORDER_STATUS: Record<string, OrderStatus> = {
    pending: "placed",
    placed: "placed",
    confirmed: "confirmed",
    preparing: "preparing",
    prepared: "ready_for_pickup",
    ready_for_pickup: "ready_for_pickup",
    "in transit": "out_for_delivery",
    out_for_delivery: "out_for_delivery",
    delivered: "completed",
    completed: "completed",
    cancelled: "cancelled",
    payment_pending: "payment_pending",
    payment_failed: "payment_failed",
};

const STAFF_ROLES = ["baker", "manager", "admin", "accountant", "delivery"] as const;
type StaffRole = typeof STAFF_ROLES[number];
type StaffDesignation = "accountant" | "baker_chef" | "delivery_person" | "admin";

const staffSchema = z.object({
    name: z.string().min(1).max(100).trim(),
    email: z.string().email(),
    phone: z.string().regex(/^\d{10}$/),
    role: z.enum(STAFF_ROLES),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const addressSchema = z.object({
    user_id: z.union([z.string().uuid(), z.number()]),
    receiver_name: z.string().min(1).max(100).trim(),
    receiver_phone: phoneSchema,
    address_line1: z.string().min(1).max(200).trim(),
    address_line2: z.string().max(200).trim().optional(),
    city: z.string().min(1).max(50).trim(),
    pincode: z.string().regex(/^\d{6}$/, "Must be a 6-digit pincode"),
    is_default: z.boolean().default(false),
});

const uuidOrNumericId = z.union([z.string().uuid(), z.number()]);
const uuidId = z.string().uuid();

function isUuid(value: unknown): value is string {
    return typeof value === "string" && uuidId.safeParse(value).success;
}

function normalizeMobileNo(phone: string) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
    if (phone.startsWith("+")) return phone;
    return phone;
}

function denormalizeMobileNo(mobileNo: string | null | undefined) {
    if (!mobileNo) return "";
    return mobileNo.startsWith("+91") && mobileNo.length === 13 ? mobileNo.slice(3) : mobileNo.replace(/^\+/, "");
}

function splitName(name: string) {
    const parts = name.trim().split(/\s+/);
    const firstName = parts.shift() || name.trim();
    const lastName = parts.length > 0 ? parts.join(" ") : null;
    return { firstName, lastName };
}

function combineName(firstName: string, lastName?: string | null) {
    return [firstName, lastName].filter(Boolean).join(" ").trim();
}

function toUserView(user: any) {
    return {
        id: user.id,
        name: user.name || combineName(user.first_name, user.last_name),
        email: user.email,
        phone: user.phone || denormalizeMobileNo(user.mobile_no),
        mobile_no: user.mobile_no,
        created_at: user.created_at,
    };
}

async function findUserFromSessionIdentity(user: { id?: string | number, email?: string, phone?: string } | undefined | null) {
    if (!user) return null;

    if (isUuid(user.id)) {
        const rows = await sql`
            SELECT id, first_name, last_name, email, mobile_no, created_at
            FROM app_users
            WHERE id = ${user.id}
        `;
        if (rows[0]) return toUserView(rows[0]);
    }

    if (user.phone) {
        const rows = await sql`
            SELECT id, first_name, last_name, email, mobile_no, created_at
            FROM app_users
            WHERE mobile_no = ${normalizeMobileNo(user.phone)}
        `;
        if (rows[0]) return toUserView(rows[0]);
    }

    if (user.email) {
        const rows = await sql`
            SELECT id, first_name, last_name, email, mobile_no, created_at
            FROM app_users
            WHERE email = ${user.email}
        `;
        if (rows[0]) return toUserView(rows[0]);
    }

    return null;
}

function toStaffDesignation(role: string): StaffDesignation {
    if (role === "baker") return "baker_chef";
    if (role === "delivery") return "delivery_person";
    if (role === "accountant") return "accountant";
    return "admin";
}

function toStaffRole(designation: string): StaffRole {
    if (designation === "baker_chef") return "baker";
    if (designation === "delivery_person") return "delivery";
    if (designation === "accountant") return "accountant";
    return "admin";
}

function slugify(value: string) {
    const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    return slug || `item-${Date.now()}`;
}

function normalizeUnitCode(unit: string) {
    const clean = unit.toLowerCase().trim();
    if (["pc", "pcs", "piece", "pieces", "per piece"].includes(clean)) return "piece";
    if (["kg", "kilogram", "kilograms", "per kg"].includes(clean)) return "kilogram";
    if (["g", "gram", "grams"].includes(clean)) return "gram";
    if (["box", "per box"].includes(clean)) return "box";
    if (["slice", "per slice"].includes(clean)) return "slice";
    if (["dozen", "dz"].includes(clean)) return "dozen";
    return slugify(unit).replace(/-/g, "_").slice(0, 30);
}

function toProductView(product: any) {
    return {
        ...product,
        category: product.category || product.category_name,
        unit: product.unit || product.unit_symbol || product.unit_code,
        image: product.image || product.image_url || "/images/bakery/sourdough.png",
        description: product.description || product.short_description || product.long_description || "",
        price: Number(product.price),
        max_daily_limit: product.max_daily_limit === null ? 0 : Number(product.max_daily_limit),
        is_available: product.status !== "hidden",
    };
}

function toDbOrderStatus(status: string): OrderStatus | null {
    return LEGACY_TO_DB_ORDER_STATUS[status] || null;
}

function toLegacyOrderStatus(status: string) {
    switch (status) {
        case "payment_pending":
        case "placed":
        case "confirmed":
            return "pending";
        case "ready_for_pickup":
            return "prepared";
        case "out_for_delivery":
            return "in transit";
        case "completed":
            return "delivered";
        default:
            return status;
    }
}

function toOrderView(order: any) {
    return {
        ...order,
        status: toLegacyOrderStatus(order.order_status || order.status),
        total_price: Number(order.total_amount ?? order.total_price ?? 0),
        payment_status: order.payment_status || "pending",
        items: (order.items || []).map((item: any) => ({
            ...item,
            quantity: Number(item.quantity),
            price_at_time: Number(item.price_at_time ?? item.unit_price ?? 0),
        })),
    };
}

function toAddressView(address: any) {
    return {
        ...address,
        receiver_name: address.receiver_name || address.recipient_name,
        receiver_phone: address.receiver_phone || denormalizeMobileNo(address.recipient_mobile_no),
        address_line1: address.address_line1 || address.line1,
        address_line2: address.address_line2 || address.line2,
        pincode: address.pincode || address.postal_code,
    };
}

function toStaffView(staff: any) {
    const role = toStaffRole(staff.designation || staff.role);
    return {
        ...staff,
        name: staff.name || staff.staff_name,
        phone: staff.phone || denormalizeMobileNo(staff.mobile_no),
        role,
        designation: staff.designation || toStaffDesignation(role),
    };
}

function defaultPermissionCodesForRole(role: StaffRole) {
    if (role === "baker") return ["mark_order_preparing", "mark_order_ready"];
    if (role === "delivery") return ["mark_order_out_for_delivery", "mark_order_completed"];
    if (role === "accountant") return ["manage_payments", "issue_invoice", "issue_receipt", "view_reports"];
    if (role === "manager") return ["place_order_on_behalf", "assign_work_orders", "complete_work_orders", "mark_order_confirmed", "mark_order_preparing", "mark_order_ready", "mark_order_out_for_delivery", "mark_order_completed", "cancel_order", "view_reports"];
    return [];
}

async function grantDefaultStaffPermissions(db: any, staffId: string, role: StaffRole) {
    const permissionCodes = defaultPermissionCodesForRole(role);
    if (permissionCodes.length === 0) return;

    await db`
        INSERT INTO staff_permissions (staff_id, permission_id, grant_reason)
        SELECT ${staffId}, p.id, 'Default permission for staff role'
        FROM permissions p
        WHERE p.permission_code = ANY(${permissionCodes})
        ON CONFLICT (staff_id, permission_id) WHERE revoked_at IS NULL DO NOTHING
    `;
}

async function ensureCategory(db: any, name: string) {
    const [category] = await db`
        INSERT INTO product_categories (name, slug, status)
        VALUES (${name}, ${slugify(name)}, 'show')
        ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name,
            status = 'show'
        RETURNING id, name, slug
    `;
    return category;
}

async function ensureUnit(db: any, unit: string) {
    const code = normalizeUnitCode(unit);
    const symbol = unit.trim();
    const [unitRow] = await db`
        INSERT INTO measurement_units (code, display_name, symbol, allows_fractional, decimal_precision)
        VALUES (${code}, ${unit.trim()}, ${symbol}, true, 3)
        ON CONFLICT (code) DO UPDATE
        SET display_name = EXCLUDED.display_name,
            symbol = EXCLUDED.symbol,
            is_active = true
        RETURNING id, code, symbol
    `;
    return unitRow;
}

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

export async function getUserSession() {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.user) return undefined;

    const hydratedUser = await findUserFromSessionIdentity(session.user);
    if (hydratedUser) {
        return hydratedUser;
    }

    if (!isUuid(session.user.id)) {
        return undefined;
    }

    return session.user;
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
// OTP Server Actions — Firebase Phone Auth token verification
// ---------------------------------------------------------------------------
export async function verifyFirebaseToken(idToken: string, phone: string) {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) return { success: false as const, error: "Invalid phone number" };

    if (!idToken) return { success: false as const, error: "Missing authentication token" };

    try {
        const { verifyFirebaseIdToken } = await import("@/lib/firebase/verify");
        const decoded = await verifyFirebaseIdToken(idToken);

        const firebasePhone = decoded.phone_number;
        const expectedPhone = normalizeMobileNo(parsed.data);
        const normalizedFirebasePhone = firebasePhone ? normalizeMobileNo(firebasePhone) : null;

        console.info("Firebase token verification:", {
            uid: decoded.uid,
            expectedPhone,
            firebasePhone,
            normalizedFirebasePhone,
        });

        if (!normalizedFirebasePhone || normalizedFirebasePhone !== expectedPhone) {
            return { success: false as const, error: "Phone number mismatch. Please try again." };
        }

        return { success: true as const };
    } catch (err: any) {
        console.error("Firebase token verification failed:", err?.code, err?.message, err);
        return { success: false as const, error: "Verification failed. Please try again." };
    }
}

// ---------------------------------------------------------------------------
// User Actions
// ---------------------------------------------------------------------------
export async function checkUser(phone: string) {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) return { exists: false, user: null, error: "Invalid phone" };
    try {
        const mobileNo = normalizeMobileNo(parsed.data);
        const users = await sql`
            SELECT id, first_name, last_name, email, mobile_no, created_at
            FROM app_users
            WHERE mobile_no = ${mobileNo}
        `;
        return { exists: users.length > 0, user: users[0] ? toUserView(users[0]) : null };
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
        const { firstName, lastName } = splitName(parsed.data.name);
        const mobileNo = normalizeMobileNo(parsed.data.phone);
        const user = await sql.begin(async (tx: any) => {
            const [upserted] = await tx`
                INSERT INTO app_users (
                    mobile_no, first_name, last_name, email, mobile_verified_at, email_verified_at
                )
                VALUES (${mobileNo}, ${firstName}, ${lastName}, ${parsed.data.email}, now(), now())
                ON CONFLICT (mobile_no) DO UPDATE
                SET first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    email = EXCLUDED.email
                RETURNING id
            `;

            const [verified] = await tx`
                UPDATE app_users
                SET mobile_verified_at = COALESCE(mobile_verified_at, now()),
                    email_verified_at = COALESCE(email_verified_at, now())
                WHERE id = ${upserted.id}
                RETURNING id, first_name, last_name, email, mobile_no, created_at
            `;
            return toUserView(verified);
        });
        
        const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
        session.user = user as any;
        await session.save();

        return { success: true as const, user };
    } catch (err) {
        console.error("Error registering user:", err);
        return { success: false as const, error: "Failed to register user. Email or phone may already be in use." };
    }
}

export async function loginUser(phone: string) {
    const result = await checkUser(phone);
    if (result.exists && result.user) {
        const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
        session.user = result.user as any;
        await session.save();
        return { success: true, user: result.user };
    }
    return { success: false, error: "User not found" };
}

export async function syncUserSession(user: { id: string | number, name: string, email: string, phone: string }) {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    const hydratedUser = await findUserFromSessionIdentity(user);
    if (hydratedUser) {
        session.user = hydratedUser as any;
        await session.save();
        return { success: true, user: hydratedUser };
    }

    if (!isUuid(user.id)) {
        session.destroy();
        return { success: false, error: "Session user is no longer valid. Please sign in again." };
    }

    if (!session.user) {
        session.user = user as any;
        await session.save();
        return { success: true, user };
    }
    return { success: false, alreadySynced: true, user: session.user };
}

export async function logoutUser() {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    session.destroy();
}
// ---------------------------------------------------------------------------
// Admin Auth
// ---------------------------------------------------------------------------
export async function verifyAdmin(email: string, pass: string) {
    try {
        const staff = await sql`
            SELECT designation, password_hash
            FROM staff_members
            WHERE email = ${email} AND status = 'active'
        `;

        if (staff.length > 0 && (staff[0] as any).designation === 'admin' && (staff[0] as any).password_hash) {
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

        const userCount = await sql`SELECT count(*) FROM app_users`;

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
            const products = await sql`
                SELECT
                    p.id,
                    p.name,
                    pc.name AS category,
                    p.price,
                    p.image_url AS image,
                    COALESCE(p.short_description, p.long_description, '') AS description,
                    mu.symbol AS unit,
                    p.max_daily_limit,
                    p.status,
                    p.created_at
                FROM products p
                JOIN product_categories pc ON pc.id = p.category_id
                JOIN measurement_units mu ON mu.id = p.unit_id
                ORDER BY p.created_at DESC
            `;
            return { success: true, products: products.map(toProductView) };
        } catch (err) {
            console.error("Failed to fetch products:", err);
            return { success: false, error: "Database error" };
        }
    },
    ["bakery-products-v2"],
    { revalidate: 60, tags: ["products"] }
);

export async function getProducts() {
    return getCachedProducts();
}

export async function getProductsForUser(userId: string | number) {
    if (!isUuid(userId)) {
        return getProducts();
    }

    const fetcher = unstable_cache(
        async (uId: string) => {
            try {
                const products = await sql`
                    SELECT 
                        p.id,
                        p.name,
                        pc.name AS category,
                        COALESCE(upp.price, p.price) AS price,
                        p.price AS original_price,
                        p.image_url AS image,
                        COALESCE(p.short_description, p.long_description, '') AS description,
                        mu.symbol AS unit,
                        p.max_daily_limit,
                        p.status,
                        CASE WHEN upp.price IS NOT NULL THEN true ELSE false END AS is_custom_price
                    FROM products p
                    JOIN product_categories pc ON pc.id = p.category_id
                    JOIN measurement_units mu ON mu.id = p.unit_id
                    LEFT JOIN user_product_prices upp
                        ON p.id = upp.product_id
                       AND upp.user_id = ${uId}
                       AND upp.is_active = true
                    WHERE p.status = 'show'
                      AND pc.status = 'show'
                    ORDER BY pc.name ASC, p.name ASC
                `;
                return { 
                    success: true, 
                    products: products.map(toProductView)
                };
            } catch (err) {
                console.error("Failed to fetch products for user:", err);
                return { success: false, error: "Database error" };
            }
        },
        [`user-products-v2-${userId}`],
        { revalidate: 300, tags: ["products", `user-products-${userId}`] }
    );
    return fetcher(userId);
}

export async function addProduct(product: { name: string, category: string, price: number, image: string, description: string, unit: string, max_daily_limit: number }) {
    const parsed = productSchema.safeParse(product);
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0].message };
    }
    try {
        const newProduct = await sql.begin(async (tx: any) => {
            const category = await ensureCategory(tx, parsed.data.category);
            const unit = await ensureUnit(tx, parsed.data.unit);
            const [created] = await tx`
                INSERT INTO products (
                    name, slug, category_id, unit_id, image_url, price,
                    short_description, max_daily_limit, status
                )
                VALUES (
                    ${parsed.data.name}, ${slugify(parsed.data.name)}, ${category.id}, ${unit.id},
                    ${parsed.data.image}, ${parsed.data.price}, ${parsed.data.description},
                    ${parsed.data.max_daily_limit}, 'show'
                )
                RETURNING *
            `;
            return {
                ...created,
                category: category.name,
                unit: unit.symbol,
                image: created.image_url,
                description: created.short_description,
            };
        });
        revalidatePath("/bakery", "layout");
        return { success: true as const, product: toProductView(newProduct) };
    } catch (err) {
        console.error("Failed to add product:", err);
        return { success: false as const, error: "Failed to add product" };
    }
}

export async function deleteProduct(id: string | number) {
    try {
        await sql`
      UPDATE products SET status = 'hidden' WHERE id = ${id}
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
            const categories = await sql`
                SELECT id, name, short_description, status, created_at
                FROM product_categories
                WHERE status = 'show'
                ORDER BY display_order ASC, name ASC
            `;
            return { success: true, categories };
        } catch (err) {
            console.error("Failed to fetch categories:", err);
            return { success: false, error: "Database error" };
        }
    },
    ["bakery-categories-v4"],
    { revalidate: 300, tags: ["categories"] }
);

export async function getCategories() {
    return getCachedCategories();
}

export async function addCategory(name: string) {
    try {
        const newCategory = await sql`
      INSERT INTO product_categories (name, slug, status)
      VALUES (${name}, ${slugify(name)}, 'show')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, status = 'show'
      RETURNING *
    `;
        revalidatePath("/bakery", "layout");
        return { success: true, category: newCategory[0] };
    } catch (err) {
        console.error("Failed to add category:", err);
        return { success: false, error: "Failed to add category (might already exist)" };
    }
}

export async function deleteCategory(id: string | number) {
    try {
        await sql`
      UPDATE product_categories SET status = 'hidden' WHERE id = ${id}
    `;
        revalidatePath("/bakery", "layout");
        return { success: true };
    } catch (err) {
        console.error("Failed to delete category:", err);
        return { success: false, error: "Failed to delete category" };
    }
}

export async function updateCategory(id: string | number, name: string) {
    try {
        const updated = await sql`
      UPDATE product_categories 
      SET name = ${name}, slug = ${slugify(name)}
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

export async function updateProduct(id: string | number, product: { name: string, category: string, price: number, image: string, description: string, unit: string, max_daily_limit: number }) {
    const parsed = productSchema.safeParse(product);
    if (!parsed.success) {
        console.error("Product validation failed:", parsed.error.format());
        return { success: false as const, error: parsed.error.issues[0].message };
    }
    try {
        const updated = await sql.begin(async (tx: any) => {
            const category = await ensureCategory(tx, parsed.data.category);
            const unit = await ensureUnit(tx, parsed.data.unit);
            const [row] = await tx`
                UPDATE products
                SET name = ${parsed.data.name},
                    slug = ${slugify(parsed.data.name)},
                    category_id = ${category.id},
                    unit_id = ${unit.id},
                    price = ${parsed.data.price},
                    image_url = ${parsed.data.image},
                    short_description = ${parsed.data.description},
                    max_daily_limit = ${parsed.data.max_daily_limit}
                WHERE id = ${id}
                RETURNING *
            `;
            return row ? {
                ...row,
                category: category.name,
                unit: unit.symbol,
                image: row.image_url,
                description: row.short_description,
            } : null;
        });
        revalidatePath("/bakery", "layout");
        return { success: true as const, product: toProductView(updated) };
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
            SELECT id, staff_name, email, mobile_no, designation, status, created_at
            FROM staff_members
            WHERE status = 'active'
            ORDER BY created_at DESC
        `;
        return { success: true, staff: staff.map(toStaffView) };
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
        const createdStaff = await sql.begin(async (tx: any) => {
            const [created] = await tx`
                INSERT INTO staff_members (staff_name, email, mobile_no, designation, password_hash, status)
                VALUES (
                    ${parsed.data.name}, ${parsed.data.email},
                    ${normalizeMobileNo(parsed.data.phone)}, ${toStaffDesignation(parsed.data.role)},
                    ${passwordHash}, 'active'
                )
                RETURNING id, staff_name, email, mobile_no, designation, status, created_at
            `;
            await grantDefaultStaffPermissions(tx, created.id, parsed.data.role);
            return toStaffView(created);
        });
        return { success: true as const, staff: createdStaff };
    } catch (err) {
        console.error("Failed to add staff member:", err);
        return { success: false as const, error: "Failed to add staff (email/phone might already be in use)" };
    }
}

export async function updateStaff(id: string | number, staffMember: { name: string, email: string, phone: string, role: string }) {
    try {
        // Find current role
        const currentStaff = await sql`SELECT designation FROM staff_members WHERE id = ${id} AND status = 'active'`;
        if (currentStaff.length === 0) return { success: false, error: "Staff member not found" };

        const oldRole = toStaffRole((currentStaff[0] as any).designation);
        const newRole = staffMember.role as StaffRole;
        const newDesignation = toStaffDesignation(newRole);

        // If we are changing an admin to a non-admin role, check if they are the last admin
        if (oldRole === 'admin' && newRole !== 'admin') {
            const adminCount = await sql`SELECT count(*) FROM staff_members WHERE designation = 'admin' AND status = 'active'`;
            const currentCount = parseInt((adminCount[0] as any).count);

            if (currentCount <= 1) {
                return {
                    success: false,
                    error: "Security Lock: Cannot downgrade the last administrator. Please appoint another admin first."
                };
            }
        }

        const updatedStaff = await sql.begin(async (tx: any) => {
            const [updated] = await tx`
                UPDATE staff_members
                SET staff_name = ${staffMember.name},
                    email = ${staffMember.email},
                    mobile_no = ${normalizeMobileNo(staffMember.phone)},
                    designation = ${newDesignation}
                WHERE id = ${id}
                RETURNING id, staff_name, email, mobile_no, designation, status, created_at
            `;
            if (updated) await grantDefaultStaffPermissions(tx, updated.id, newRole);
            return updated ? toStaffView(updated) : null;
        });
        if (!updatedStaff) return { success: false, error: "Staff member not found" };
        return { success: true, staff: updatedStaff };
    } catch (err) {
        console.error("Failed to update staff:", err);
        return { success: false, error: "Failed to update staff" };
    }
}

export async function deleteStaff(id: string | number) {
    try {
        // Find current role
        const currentStaff = await sql`SELECT designation FROM staff_members WHERE id = ${id} AND status = 'active'`;
        if (currentStaff.length === 0) return { success: false, error: "Staff member not found" };

        const role = toStaffRole((currentStaff[0] as any).designation);

        // If it's an admin, check if they are the last one
        if (role === 'admin') {
            const adminCount = await sql`SELECT count(*) FROM staff_members WHERE designation = 'admin' AND status = 'active'`;
            const currentCount = parseInt((adminCount[0] as any).count);

            if (currentCount <= 1) {
                return {
                    success: false,
                    error: "Security Lock: Cannot delete the last administrator account. Please create another admin first."
                };
            }
        }

        await sql`UPDATE staff_members SET status = 'inactive' WHERE id = ${id}`;
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
                o.id,
                o.order_number,
                o.order_status,
                o.total_amount,
                o.created_at,
                o.placed_by,
                o.placed_by_staff_id,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM payments pay
                        WHERE pay.order_id = o.id AND pay.payment_status = 'succeeded'
                    ) OR o.payment_type_snapshot = 'postpaid_user' THEN 'paid'
                    WHEN o.order_status = 'payment_failed'
                      OR EXISTS (
                        SELECT 1 FROM payments pay
                        WHERE pay.order_id = o.id AND pay.payment_status = 'failed'
                      ) THEN 'failed'
                    ELSE 'pending'
                END AS payment_status,
                (
                    SELECT COALESCE(wo.assigned_staff_id, wo.completed_by_staff_id)
                    FROM work_orders wo
                    WHERE wo.order_id = o.id
                      AND wo.task_type = CASE
                          WHEN o.order_status IN ('preparing', 'ready_for_pickup') THEN 'baking'::work_order_task_type
                          WHEN o.order_status IN ('out_for_delivery', 'completed') THEN 'delivery'::work_order_task_type
                          ELSE wo.task_type
                      END
                    ORDER BY wo.updated_at DESC
                    LIMIT 1
                ) AS acknowledged_by,
                o.customer_name AS user_name,
                o.customer_mobile_no AS user_phone,
                o.delivery_address_snapshot ->> 'line1' AS address_line1,
                o.delivery_address_snapshot ->> 'city' AS city,
                o.delivery_address_snapshot ->> 'postal_code' AS pincode,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id',              oi.id,
                            'product_id',      oi.product_id,
                            'quantity',        oi.quantity,
                            'price_at_time',   oi.unit_price,
                            'product_name',    oi.product_name_snapshot,
                            'product_image',   COALESCE(p.image_url, '/images/bakery/sourdough.png')
                        ) ORDER BY oi.line_number
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'
                ) AS items
            FROM orders o
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN products    p  ON p.id = oi.product_id
            GROUP BY o.id
            ORDER BY o.created_at DESC
        `;
        return { success: true as const, orders: orders.map(toOrderView) };
    } catch (err) {
        console.error("Failed to fetch orders:", err);
        return { success: false as const, error: "Database error" };
    }
}

export async function updateOrderStatus(orderId: string | number, status: string, staffId?: string | number) {
    const dbStatus = toDbOrderStatus(status);
    if (!dbStatus) {
        return { success: false as const, error: `Invalid status. Must be one of: ${Object.keys(LEGACY_TO_DB_ORDER_STATUS).join(", ")}` };
    }

    try {
        const updated = await sql.begin(async (tx: any) => {
            if (staffId) {
                await tx`SELECT set_config('app.actor_type', 'employee', true)`;
                await tx`SELECT set_config('app.actor_id', ${String(staffId)}, true)`;
                await tx`SELECT set_config('app.order_status_reason', ${`Staff panel changed status to ${status}`}, true)`;
            }

            const [order] = await tx`
                UPDATE orders
                SET order_status = ${dbStatus}
                WHERE id = ${orderId}
                RETURNING *
            `;

            if (order && staffId) {
                if (dbStatus === "preparing") {
                    const [existing] = await tx`
                        SELECT id
                        FROM work_orders
                        WHERE order_id = ${orderId}
                          AND task_type = 'baking'
                          AND work_status <> 'cancelled'
                        ORDER BY created_at DESC
                        LIMIT 1
                    `;
                    if (existing) {
                        await tx`
                            UPDATE work_orders
                            SET assigned_staff_id = ${staffId},
                                work_status = 'in_progress'
                            WHERE id = ${existing.id}
                        `;
                    } else {
                        await tx`
                            INSERT INTO work_orders (
                                order_id, task_type, work_status, assigned_designation,
                                assigned_staff_id, title
                            )
                            VALUES (
                                ${orderId}, 'baking', 'in_progress', 'baker_chef',
                                ${staffId}, ${`Prepare ${order.order_number}`}
                            )
                        `;
                    }
                } else if (dbStatus === "ready_for_pickup") {
                    const work = await tx`
                        UPDATE work_orders
                        SET work_status = 'completed',
                            completed_by_staff_id = ${staffId}
                        WHERE order_id = ${orderId}
                          AND task_type = 'baking'
                          AND work_status <> 'completed'
                        RETURNING id
                    `;
                    if (work.length === 0) {
                        await tx`
                            INSERT INTO work_orders (
                                order_id, task_type, work_status, assigned_designation,
                                assigned_staff_id, completed_by_staff_id, title
                            )
                            VALUES (
                                ${orderId}, 'baking', 'completed', 'baker_chef',
                                ${staffId}, ${staffId}, ${`Prepare ${order.order_number}`}
                            )
                        `;
                    }
                } else if (dbStatus === "out_for_delivery") {
                    const [existing] = await tx`
                        SELECT id
                        FROM work_orders
                        WHERE order_id = ${orderId}
                          AND task_type = 'delivery'
                          AND work_status <> 'cancelled'
                        ORDER BY created_at DESC
                        LIMIT 1
                    `;
                    if (existing) {
                        await tx`
                            UPDATE work_orders
                            SET assigned_staff_id = ${staffId},
                                work_status = 'in_progress'
                            WHERE id = ${existing.id}
                        `;
                    } else {
                        await tx`
                            INSERT INTO work_orders (
                                order_id, task_type, work_status, assigned_designation,
                                assigned_staff_id, title
                            )
                            VALUES (
                                ${orderId}, 'delivery', 'in_progress', 'delivery_person',
                                ${staffId}, ${`Deliver ${order.order_number}`}
                            )
                        `;
                    }
                } else if (dbStatus === "completed") {
                    const work = await tx`
                        UPDATE work_orders
                        SET work_status = 'completed',
                            completed_by_staff_id = ${staffId}
                        WHERE order_id = ${orderId}
                          AND task_type = 'delivery'
                          AND work_status <> 'completed'
                        RETURNING id
                    `;
                    if (work.length === 0) {
                        await tx`
                            INSERT INTO work_orders (
                                order_id, task_type, work_status, assigned_designation,
                                assigned_staff_id, completed_by_staff_id, title
                            )
                            VALUES (
                                ${orderId}, 'delivery', 'completed', 'delivery_person',
                                ${staffId}, ${staffId}, ${`Deliver ${order.order_number}`}
                            )
                        `;
                    }
                }
            }

            return order;
        });

        return { success: true as const, order: updated };
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
            SELECT id, staff_name, email, mobile_no, designation, password_hash
            FROM staff_members
            WHERE email = ${parsed.data.email}
              AND status = 'active'
        `;

        if (staff.length === 0 || !(staff[0] as any).password_hash) {
            // Return same error regardless of whether email exists (prevents user enumeration)
            return { success: false as const, error: "Invalid credentials" };
        }

        const isValid = await bcrypt.compare(parsed.data.pass, (staff[0] as any).password_hash);
        if (!isValid) {
            return { success: false as const, error: "Invalid credentials" };
        }

        const { password_hash, ...staffRecord } = staff[0] as any;
        const staffWithoutHash = toStaffView(staffRecord);

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

export async function updateUserDetails(id: string | number, name: string, email: string) {
    if (!isUuid(id)) {
        return { success: false, error: "Session user is no longer valid. Please sign in again." };
    }

    try {
        const { firstName, lastName } = splitName(name);
        const updatedUser = await sql.begin(async (tx: any) => {
            const [updated] = await tx`
                UPDATE app_users
                SET first_name = ${firstName},
                    last_name = ${lastName},
                    email = ${email.trim()}
                WHERE id = ${id}
                RETURNING id
            `;
            if (!updated) return null;

            const [verified] = await tx`
                UPDATE app_users
                SET email_verified_at = COALESCE(email_verified_at, now())
                WHERE id = ${id}
                RETURNING id, first_name, last_name, email, mobile_no, created_at
            `;
            return toUserView(verified);
        });
        if (!updatedUser) return { success: false, error: "User not found" };
        return { success: true, user: updatedUser };
    } catch (err) {
        console.error("Failed to update user details:", err);
        return { success: false, error: "Email already in use or database error" };
    }
}

export async function getAddresses(userId: string | number) {
    if (!isUuid(userId)) {
        return { success: false, error: "Session user is no longer valid. Please sign in again.", addresses: [] };
    }

    try {
        const addresses = await sql`
            SELECT *
            FROM user_addresses
            WHERE user_id = ${userId}
              AND is_active = true
            ORDER BY is_default DESC, created_at DESC
        `;
        return { success: true, addresses: addresses.map(toAddressView) };
    } catch (err) {
        console.error("Failed to fetch addresses:", err);
        return { success: false, error: "Database error" };
    }
}

export async function addAddress(address: z.infer<typeof addressSchema>) {
    const parsed = addressSchema.safeParse(address);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
    if (!isUuid(parsed.data.user_id)) {
        return { success: false, error: "Session user is no longer valid. Please sign in again." };
    }

    try {
        return await sql.begin(async (tx: any) => {
            if (parsed.data.is_default) {
                await tx`UPDATE user_addresses SET is_default = false WHERE user_id = ${parsed.data.user_id}`;
            }

            const [newAddress] = await tx`
                INSERT INTO user_addresses (
                    user_id, recipient_name, recipient_mobile_no,
                    line1, line2, city, postal_code, is_default
                ) VALUES (
                    ${parsed.data.user_id}, ${parsed.data.receiver_name}, ${normalizeMobileNo(parsed.data.receiver_phone)},
                    ${parsed.data.address_line1}, ${parsed.data.address_line2 || null},
                    ${parsed.data.city}, ${parsed.data.pincode}, ${parsed.data.is_default}
                ) RETURNING *
            `;
            return { success: true, address: toAddressView(newAddress) };
        });
    } catch (err) {
        console.error("Failed to add address:", err);
        return { success: false, error: "Database error" };
    }
}

export async function updateAddress(id: string | number, userId: string | number, address: Partial<z.infer<typeof addressSchema>>) {
    if (!isUuid(id) || !isUuid(userId)) {
        return { success: false, error: "Session user is no longer valid. Please sign in again." };
    }

    try {
        return await sql.begin(async (tx: any) => {
            if (address.is_default) {
                await tx`UPDATE user_addresses SET is_default = false WHERE user_id = ${userId}`;
            }

            const updated = await tx`
                UPDATE user_addresses
                SET
                    recipient_name = COALESCE(${address.receiver_name ?? null}, recipient_name),
                    recipient_mobile_no = COALESCE(${address.receiver_phone ? normalizeMobileNo(address.receiver_phone) : null}, recipient_mobile_no),
                    line1 = COALESCE(${address.address_line1 ?? null}, line1),
                    line2 = ${address.address_line2 ?? null},
                    city = COALESCE(${address.city ?? null}, city),
                    postal_code = COALESCE(${address.pincode ?? null}, postal_code),
                    is_default = COALESCE(${address.is_default ?? null}, is_default)
                WHERE id = ${id} AND user_id = ${userId}
                RETURNING *
            `;
            if (updated.length === 0) return { success: false, error: "Address not found" };
            return { success: true, address: toAddressView(updated[0]) };
        });
    } catch (err) {
        console.error("Failed to update address:", err);
        return { success: false, error: "Database error" };
    }
}

export async function deleteAddress(id: string | number, userId: string | number) {
    if (!isUuid(id) || !isUuid(userId)) {
        return { success: false, error: "Session user is no longer valid. Please sign in again." };
    }

    try {
        await sql`
            UPDATE user_addresses
            SET is_active = false
            WHERE id = ${id} AND user_id = ${userId}
        `;
        return { success: true };
    } catch (err) {
        console.error("Failed to delete address:", err);
        return { success: false, error: "Database error" };
    }
}

// --- USER ORDERS ---

export async function getUserOrders(userId: string | number) {
    if (!isUuid(userId)) {
        return { success: false, error: "Session user is no longer valid. Please sign in again.", orders: [] };
    }

    try {
        const orders = await sql`
            SELECT
                o.id,
                o.order_number,
                o.order_status,
                o.total_amount,
                o.created_at,
                inv.invoice_number,
                inv.invoice_pdf_url,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM payments pay
                        WHERE pay.order_id = o.id AND pay.payment_status = 'succeeded'
                    ) OR o.payment_type_snapshot = 'postpaid_user' THEN 'paid'
                    WHEN o.order_status = 'payment_failed'
                      OR EXISTS (
                        SELECT 1 FROM payments pay
                        WHERE pay.order_id = o.id AND pay.payment_status = 'failed'
                      ) THEN 'failed'
                    ELSE 'pending'
                END AS payment_status,
                COALESCE(
                    JSON_AGG(
                        JSON_BUILD_OBJECT(
                            'id',              oi.id,
                            'product_id',      oi.product_id,
                            'quantity',        oi.quantity,
                            'price_at_time',   oi.unit_price,
                            'product_name',    oi.product_name_snapshot,
                            'product_image',   COALESCE(p.image_url, '/images/bakery/sourdough.png')
                        ) ORDER BY oi.line_number
                    ) FILTER (WHERE oi.id IS NOT NULL),
                    '[]'
                ) AS items
            FROM orders o
            LEFT JOIN LATERAL (
                SELECT invoice_number, invoice_pdf_url
                FROM invoices
                WHERE order_id = o.id
                ORDER BY created_at DESC
                LIMIT 1
            ) inv ON true
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN products    p  ON p.id = oi.product_id
            WHERE o.user_id = ${userId}
            GROUP BY o.id, inv.invoice_number, inv.invoice_pdf_url
            ORDER BY o.created_at DESC
        `;
        return { success: true, orders: orders.map(toOrderView) };
    } catch (err) {
        console.error("Failed to fetch user orders:", err);
        return { success: false, error: "Database error" };
    }
}

// --- Checkout & Payments ---

let razorpayInstance: any = null;

function getRazorpay() {
    if (razorpayInstance) return razorpayInstance;

    const key_id = resolveRazorpayKeyId();
    const key_secret = resolveRazorpayKeySecret();

    if (!key_id || !key_secret) {
        console.warn("Razorpay keys are missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in production.");
        return null;
    }

    const RazorpayAny = Razorpay as any;
    razorpayInstance = new (RazorpayAny.default || RazorpayAny)({
        key_id,
        key_secret,
    });
    return razorpayInstance;
}

function resolveRazorpayKeyId() {
    return (
        process.env.RAZORPAY_KEY_ID ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        process.env.RAZORPAY_PUBLIC_KEY_ID ||
        ""
    );
}

function resolveRazorpayKeySecret() {
    return (
        process.env.RAZORPAY_KEY_SECRET ||
        process.env.RAZORPAY_SECRET ||
        process.env.RAZORPAY_API_SECRET ||
        ""
    );
}

export async function createRazorpayOrder(amount: number, localOrderId?: string | number) {
    try {
        let amountToCharge = amount;
        let localOrder: any = null;
        if (localOrderId) {
            const orders = await sql`
                SELECT id, user_id, total_amount
                FROM orders
                WHERE id = ${localOrderId}
            `;
            localOrder = orders[0];
            if (!localOrder) return { success: false, error: "Order not found" };
            amountToCharge = Number(localOrder.total_amount);
        }

        const options = {
            amount: Math.round(amountToCharge * 100), // Razorpay expects paise
            currency: "INR",
            receipt: localOrderId ? `ord_${String(localOrderId).slice(0, 24)}` : `rcpt_${Date.now()}`,
        };
        const rzp = getRazorpay();
        if (!rzp) return { success: false, error: "Payment system is not configured." };

        const order = await rzp.orders.create(options);
        if (localOrder) {
            await sql`
                INSERT INTO payments (
                    user_id, order_id, amount, currency_code, payment_method,
                    payment_status, payment_provider, provider_order_id,
                    provider_status, idempotency_key
                )
                VALUES (
                    ${localOrder.user_id}, ${localOrder.id}, ${amountToCharge}, 'INR', 'online_gateway',
                    'pending', 'razorpay', ${order.id}, ${order.status || 'created'},
                    ${`razorpay_order:${order.id}`}
                )
                ON CONFLICT (payment_provider, idempotency_key)
                    WHERE payment_provider IS NOT NULL AND idempotency_key IS NOT NULL
                DO UPDATE SET
                    amount = EXCLUDED.amount,
                    provider_order_id = EXCLUDED.provider_order_id,
                    provider_status = EXCLUDED.provider_status,
                    payment_status = 'pending'
            `;
        }
        return { success: true, orderId: order.id, amount: order.amount, keyId: resolveRazorpayKeyId() };
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
            await sql.begin(async (tx: any) => {
                const [order] = await tx`
                    SELECT id, user_id, total_amount
                    FROM orders
                    WHERE id = ${orderId}
                `;
                if (!order) throw new Error("Order not found");

                const [existingPayment] = await tx`
                    SELECT id
                    FROM payments
                    WHERE order_id = ${orderId}
                      AND payment_provider = 'razorpay'
                      AND provider_order_id = ${razorpayOrderId}
                    ORDER BY created_at DESC
                    LIMIT 1
                `;

                const [payment] = existingPayment
                    ? await tx`
                        UPDATE payments
                        SET payment_status = 'succeeded',
                            payment_method = 'online_gateway',
                            provider_payment_id = ${razorpayPaymentId},
                            provider_order_id = ${razorpayOrderId},
                            provider_status = 'captured',
                            provider_status_message = 'Razorpay signature verified',
                            idempotency_key = ${`razorpay_payment:${razorpayPaymentId}`}
                        WHERE id = ${existingPayment.id}
                        RETURNING id
                    `
                    : await tx`
                        INSERT INTO payments (
                            user_id, order_id, amount, currency_code, payment_method,
                            payment_status, payment_provider, provider_payment_id,
                            provider_order_id, provider_status, provider_status_message,
                            idempotency_key
                        )
                        VALUES (
                            ${order.user_id}, ${order.id}, ${order.total_amount}, 'INR', 'online_gateway',
                            'succeeded', 'razorpay', ${razorpayPaymentId},
                            ${razorpayOrderId}, 'captured', 'Razorpay signature verified',
                            ${`razorpay_payment:${razorpayPaymentId}`}
                        )
                        ON CONFLICT (payment_provider, provider_payment_id)
                            WHERE payment_provider IS NOT NULL AND provider_payment_id IS NOT NULL
                        DO UPDATE SET
                            payment_status = 'succeeded',
                            provider_order_id = EXCLUDED.provider_order_id,
                            provider_status = EXCLUDED.provider_status,
                            provider_status_message = EXCLUDED.provider_status_message
                        RETURNING id
                    `;

                await tx`
                    INSERT INTO receipts (payment_id, user_id, amount, notes)
                    VALUES (${payment.id}, ${order.user_id}, ${order.total_amount}, 'Auto-issued after Razorpay payment verification')
                    ON CONFLICT (payment_id) DO NOTHING
                `;
            });

            try {
                const { generateAndUploadInvoicePdfForOrder } = await import("@/lib/invoice-service");
                const invoice = await generateAndUploadInvoicePdfForOrder(sql, orderId);
                return { success: true, invoice };
            } catch (invoiceErr) {
                console.error("Invoice PDF upload failed after successful payment:", invoiceErr);
                return { success: true, invoiceError: "Payment captured, but invoice PDF upload failed." };
            }
        }

        const [order] = await sql`
            SELECT id, user_id, total_amount
            FROM orders
            WHERE id = ${orderId}
        `;
        if (order) {
            await sql`
                INSERT INTO payments (
                    user_id, order_id, amount, currency_code, payment_method,
                    payment_status, payment_provider, provider_payment_id,
                    provider_order_id, provider_status, failure_code, failure_message,
                    idempotency_key
                )
                VALUES (
                    ${order.user_id}, ${order.id}, ${order.total_amount}, 'INR', 'online_gateway',
                    'failed', 'razorpay', ${razorpayPaymentId},
                    ${razorpayOrderId}, 'signature_failed', 'signature_mismatch', 'Invalid Razorpay signature',
                    ${`razorpay_failed:${razorpayPaymentId}`}
                )
                ON CONFLICT (payment_provider, idempotency_key)
                    WHERE payment_provider IS NOT NULL AND idempotency_key IS NOT NULL
                DO UPDATE SET
                    payment_status = 'failed',
                    failure_code = EXCLUDED.failure_code,
                    failure_message = EXCLUDED.failure_message
            `;
        }
        return { success: false, error: "Invalid signature" };
    } catch (err) {
        console.error("Payment Verification Failed:", err);
        return { success: false, error: "Verification error" };
    }
}


const placeOrderSchema = z.object({
    userId: uuidId,
    items: z.array(z.object({
        id: uuidId,
        quantity: z.number().positive(),
    })).min(1),
    addressId: uuidId,
});

export async function placeOrder(userId: string | number, items: { id: string | number, quantity: number }[], frontendTotal: number, addressId: string | number) {
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
        const finalItems: { product_id: string | number, quantity: number }[] = [];

        for (const item of validData.items) {
            const product = availableProducts.find((p: any) => String(p.id) === String(item.id));
            if (!product) {
                return { success: false, error: `Product ID ${item.id} not found` };
            }

            // ── STOCK / DAILY LIMIT VALIDATION ─────────────────────────────────────
            if (product.max_daily_limit > 0) {
                const dailyTotalRes = await sql`
                    SELECT COALESCE(SUM(oi.quantity), 0) as total
                    FROM order_items oi
                    JOIN orders o ON oi.order_id = o.id
                    WHERE oi.product_id = ${product.id}
                      AND o.created_at >= CURRENT_DATE
                      AND o.order_status != 'cancelled'
                `;
                const currentDailyTotal = parseFloat(dailyTotalRes[0].total);
                if (currentDailyTotal + item.quantity > product.max_daily_limit) {
                    const remaining = Math.max(0, product.max_daily_limit - currentDailyTotal);
                    return { 
                        success: false, 
                        error: `Limit exceeded for ${product.name}. Only ${remaining} ${product.unit} remaining for today.` 
                    };
                }
            }
            // ────────────────────────────────────────────────────────────────────────

            const itemTotal = product.price * item.quantity;
            calculatedTotal += itemTotal;
            finalItems.push({
                product_id: product.id,
                quantity: item.quantity
            });
        }

        if (Math.abs(calculatedTotal - Number(frontendTotal)) > 0.5) {
            console.warn("Frontend total mismatch", { frontendTotal, calculatedTotal });
        }

        // 4. Execute Transaction
        return await sql.begin(async (tx: any) => {
            const [order] = await tx`
                INSERT INTO orders (
                    user_id, delivery_address_id, fulfillment_type,
                    order_source, placed_by, order_status
                )
                VALUES (${validData.userId}, ${validData.addressId}, 'delivery', 'web', 'self', 'payment_pending')
                RETURNING id
            `;

            for (const [index, item] of finalItems.entries()) {
                await tx`
                    INSERT INTO order_items (order_id, product_id, quantity, line_number)
                    VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${index + 1})
                `;
            }

            const [savedOrder] = await tx`
                SELECT id, total_amount
                FROM orders
                WHERE id = ${order.id}
            `;

            return { success: true, orderId: savedOrder.id, total: Number(savedOrder.total_amount) };
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
            SELECT id, first_name, last_name, email, mobile_no, created_at
            FROM app_users
            ORDER BY created_at DESC
        `;
        return { success: true, users: users.map(toUserView) };
    } catch (err) {
        console.error("Failed to fetch users:", err);
        return { success: false, error: "Database error" };
    }
}

export async function getUserPrices(userId: string | number) {
    if (!isUuid(userId)) {
        return { success: false, error: "Session user is no longer valid. Please sign in again.", prices: [] };
    }

    try {
        const prices = await sql`
            SELECT product_id, price
            FROM user_product_prices
            WHERE user_id = ${userId}
              AND is_active = true
        `;
        return { success: true, prices };
    } catch (err) {
        console.error("Failed to fetch user prices:", err);
        return { success: false, error: "Database error" };
    }
}

export async function setUserPrice(userId: string | number, productId: string | number, price: number) {
    if (!isUuid(userId) || !isUuid(productId)) {
        return { success: false, error: "Invalid user or product id" };
    }

    try {
        if (price === 0 || isNaN(price)) {
            // Deactivate if price is 0 or invalid. This keeps an audit trail and resets to base price.
            await sql`
                UPDATE user_product_prices
                SET is_active = false
                WHERE user_id = ${userId} AND product_id = ${productId}
            `;
        } else {
            await sql`
                INSERT INTO user_product_prices (user_id, product_id, price, is_active, reason)
                VALUES (${userId}, ${productId}, ${price}, true, 'Admin custom price')
                ON CONFLICT (user_id, product_id)
                DO UPDATE SET price = EXCLUDED.price,
                    is_active = true,
                    reason = EXCLUDED.reason
            `;
        }
        return { success: true };
    } catch (err) {
        console.error("Failed to set user price:", err);
        return { success: false, error: "Database error" };
    }
}
