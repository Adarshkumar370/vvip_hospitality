"use server";

import { cache } from "react";
import sql from "@/lib/db";
import s3Client, { buildStorageIdentifierUrl, getPresignedObjectUrl, stripPresignQuery, toSignedUrl } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getIronSession } from "iron-session";
import { cookies, headers } from "next/headers";
import { unstable_cache, revalidatePath } from "next/cache";
import { staffSessionOptions, type StaffSessionData, userSessionOptions, type UserSessionData } from "@/lib/session";
import { EXTERNAL_API_TIMEOUT_MS, INVOICE_API_TIMEOUT_MS, getSafeErrorMessage, isTimeoutError, withTimeout } from "@/lib/timeout";
import Razorpay from "razorpay";
import * as crypto from "crypto";
import { canRoleUpdateOrderStatus, requireSameUserId } from "@/lib/bakery-security";
import {
    MAX_CART_ITEM_QUANTITY,
    hasAllowedImageSignature,
    sanitizeLoginEmail,
    validateCheckoutIdempotencyKey,
} from "@/lib/security-validation";

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

type OrderStatus = "payment_pending" | "payment_failed" | "placed" | "confirmed" | "preparing" | "ready_for_pickup" | "out_for_delivery" | "completed" | "cancelled";
const ORDERING_TIME_ZONE = "Asia/Kolkata";
const ORDERING_CLOSED_START_HOUR = 22;
const ORDERING_OPEN_HOUR = 8;
const ORDERING_CLOSED_ERROR = "Online ordering is available from 8:00 AM to 10:00 PM IST. Please place your order during business hours.";
const VERIFIED_PHONE_TTL_MS = 10 * 60 * 1000;
type OrderPaymentMode = "prepaid" | "postpaid";
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const AUTH_RATE_LIMIT_MAX = 8;
const authRateLimit = new Map<string, { count: number; resetAt: number }>();

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
type StaffDesignation = "accountant" | "baker_chef" | "delivery_person" | "manager" | "admin";

const staffSchema = z.object({
    name: z.string().min(1).max(100).trim(),
    email: z.string().email(),
    phone: z.string().regex(/^\d{10}$/),
    role: z.enum(STAFF_ROLES),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const staffUpdateSchema = z.object({
    name: z.string().min(1).max(100).trim(),
    email: z.string().email(),
    phone: z.string().regex(/^\d{10}$/),
    role: z.enum(STAFF_ROLES),
    password: z.union([z.string().min(8, "Password must be at least 8 characters"), z.literal("")]).optional(),
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

const orderIssueTypes = ["quality", "missing_item", "wrong_item", "delivery", "payment", "other"] as const;

const orderIssueSchema = z.object({
    orderId: z.string().uuid(),
    issueType: z.enum(orderIssueTypes),
    description: z.string().min(3).max(2000).trim(),
});

type ServerUploadFile = {
    name: string;
    type: string;
    size: number;
    arrayBuffer: () => Promise<ArrayBuffer>;
};

const uuidId = z.string().uuid();

function isUuid(value: unknown): value is string {
    return typeof value === "string" && uuidId.safeParse(value).success;
}

function getHourInTimeZone(date: Date, timeZone: string) {
    const hourPart = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        hourCycle: "h23",
        timeZone,
    }).formatToParts(date).find((part) => part.type === "hour");

    return Number(hourPart?.value ?? date.getHours());
}

function isOrderingClosed(now = new Date()) {
    if (process.env.NODE_ENV === "development") return false;
    const currentHour = getHourInTimeZone(now, ORDERING_TIME_ZONE);
    return currentHour >= ORDERING_CLOSED_START_HOUR || currentHour < ORDERING_OPEN_HOUR;
}

function getOrderingWindowViolation() {
    return {
        productId: "ordering_window",
        productName: "Ordering hours",
        remaining: 0,
        unit: "order",
        requested: 1,
        error: ORDERING_CLOSED_ERROR,
    };
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
        payment_type: user.payment_type || "prepaid_user",
        credit_limit: user.credit_limit === null || user.credit_limit === undefined ? null : Number(user.credit_limit),
        current_balance: user.current_balance === null || user.current_balance === undefined ? null : Number(user.current_balance),
        billing_cycle_day: user.billing_cycle_day ?? null,
        payment_terms_days: user.payment_terms_days ?? null,
        billing_status: user.billing_status ?? null,
        created_at: user.created_at,
    };
}

function getBillingCycleWindow(billingCycleDay: number, cycleLengthDays: number, now = new Date()) {
    const safeDay = Math.min(Math.max(Math.trunc(billingCycleDay || 1), 1), 28);
    const safeCycleLength = Math.min(Math.max(Math.trunc(cycleLengthDays || 30), 1), 90);
    let cycleStart = new Date(now.getFullYear(), now.getMonth(), safeDay, 0, 0, 0, 0);

    if (now < cycleStart) {
        cycleStart = new Date(cycleStart.getFullYear(), cycleStart.getMonth() - 1, safeDay, 0, 0, 0, 0);
    }

    let cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleEnd.getDate() + safeCycleLength);

    while (now >= cycleEnd) {
        cycleStart = new Date(cycleEnd);
        cycleEnd = new Date(cycleStart);
        cycleEnd.setDate(cycleEnd.getDate() + safeCycleLength);
    }

    return { cycleStart, cycleEnd };
}

async function getUserBillingSummaryInternal(userId: string) {
    const [user] = await sql`
        SELECT
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.mobile_no,
            u.payment_type,
            bp.id AS billing_profile_id,
            bp.billing_status,
            bp.credit_limit,
            bp.current_balance,
            bp.billing_cycle_day,
            bp.payment_terms_days,
            bp.invoice_email,
            bp.notes
        FROM app_users u
        LEFT JOIN user_billing_profiles bp
            ON bp.user_id = u.id
        WHERE u.id = ${userId}
    `;

    if (!user) {
        return { success: false as const, error: "User not found" };
    }

    const paymentType = user.payment_type || "prepaid_user";
    if (paymentType !== "postpaid_user" || !user.billing_profile_id || user.billing_status !== "active") {
        return {
            success: true as const,
            summary: {
                paymentType,
                isPostpaid: false,
                cycle: null,
                creditLimit: 0,
                pendingAmount: 0,
                availableCredit: 0,
                creditBalance: 0,
                billingCycleDay: null,
                paymentTermsDays: null,
                orders: [],
            },
        };
    }

    const { cycleStart, cycleEnd } = getBillingCycleWindow(
        Number(user.billing_cycle_day || 1),
        Number(user.payment_terms_days || 30)
    );

    const orders = await sql`
        SELECT
            o.id,
            o.order_number,
            o.order_status,
            o.total_amount,
            o.created_at,
            o.payment_type_snapshot,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'id', oi.id,
                        'product_id', oi.product_id,
                        'quantity', oi.quantity,
                        'price_at_time', oi.unit_price,
                        'product_name', oi.product_name_snapshot,
                        'product_image', COALESCE(p.image_url, '/images/bakery/sourdough.png')
                    ) ORDER BY oi.line_number
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
            ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        LEFT JOIN products p ON p.id = oi.product_id
        WHERE o.user_id = ${userId}
          AND o.payment_type_snapshot = 'postpaid_user'
          AND o.order_status <> 'cancelled'
          AND o.created_at >= ${cycleStart.toISOString()}
          AND o.created_at < ${cycleEnd.toISOString()}
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `;

    const orderViews = await Promise.all(orders.map(toOrderView).map(presignOrderView));
    const creditLimit = Number(user.credit_limit || 0);

    // Running, all-time ledger (not scoped to the current cycle): what's owed is
    // every postpaid order ever placed minus every payment ever recorded.
    // available = credit_limit + amount_paid - amount_spent — a payment first
    // pays down whatever's owed, and anything left over pushes availableCredit
    // above the base credit_limit as reusable rollover credit.
    const [{ total_spent }] = await sql`
        SELECT COALESCE(SUM(total_amount), 0) AS total_spent
        FROM orders
        WHERE user_id = ${userId}
          AND payment_type_snapshot = 'postpaid_user'
          AND order_status <> 'cancelled'
    `;
    const [{ total_paid }] = await sql`
        SELECT COALESCE(SUM(amount), 0) AS total_paid
        FROM manual_payment_records
        WHERE user_id = ${userId}
    `;
    const amountSpent = Number(total_spent || 0);
    const amountPaid = Number(total_paid || 0);
    const pendingAmount = Math.max(0, amountSpent - amountPaid);
    const creditBalance = Math.max(0, amountPaid - amountSpent);

    return {
        success: true as const,
        summary: {
            paymentType,
            isPostpaid: true,
            cycle: {
                start: cycleStart.toISOString(),
                end: cycleEnd.toISOString(),
            },
            creditLimit,
            pendingAmount,
            availableCredit: Math.max(0, creditLimit + amountPaid - amountSpent),
            creditBalance,
            billingCycleDay: Number(user.billing_cycle_day || 1),
            paymentTermsDays: Number(user.payment_terms_days || 0),
            invoiceEmail: user.invoice_email || user.email,
            notes: user.notes || "",
            orders: orderViews,
        },
    };
}

async function findUserFromSessionIdentity(user: { id?: string | number, email?: string, phone?: string } | undefined | null) {
    if (!user) return null;

    if (isUuid(user.id)) {
        const rows = await sql`
            SELECT id, first_name, last_name, email, mobile_no, payment_type, created_at
            FROM app_users
            WHERE id = ${user.id}
        `;
        if (rows[0]) return toUserView(rows[0]);
    }

    if (user.phone) {
        const rows = await sql`
            SELECT id, first_name, last_name, email, mobile_no, payment_type, created_at
            FROM app_users
            WHERE mobile_no = ${normalizeMobileNo(user.phone)}
        `;
        if (rows[0]) return toUserView(rows[0]);
    }

    if (user.email) {
        const rows = await sql`
            SELECT id, first_name, last_name, email, mobile_no, payment_type, created_at
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
    if (role === "manager") return "manager";
    return "admin";
}

function toStaffRole(designation: string): StaffRole {
    if (designation === "baker_chef") return "baker";
    if (designation === "delivery_person") return "delivery";
    if (designation === "accountant") return "accountant";
    if (designation === "manager") return "manager";
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
        max_daily_limit: product.max_daily_limit === null ? 100 : Number(product.max_daily_limit),
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
        payment_received_at: order.payment_received_at || null,
        invoice_number: order.invoice_number || null,
        invoice_pdf_url: order.invoice_pdf_url || null,
        items: (order.items || []).map((item: any) => ({
            ...item,
            quantity: Number(item.quantity),
            price_at_time: Number(item.price_at_time ?? item.unit_price ?? 0),
        })),
    };
}

function isOperationallyClearedPayment(status: string) {
    return status === "paid" || status === "postpaid-pending";
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

async function presignProductView<T extends { image?: string | null }>(product: T): Promise<T> {
    return { ...product, image: (await toSignedUrl(product.image)) || product.image };
}

async function presignOrderView<T extends { invoice_pdf_url?: string | null; items?: any[] }>(order: T): Promise<T> {
    const [invoicePdfUrl, items] = await Promise.all([
        toSignedUrl(order.invoice_pdf_url),
        Promise.all((order.items || []).map(async (item: any) => ({
            ...item,
            product_image: (await toSignedUrl(item.product_image)) || item.product_image,
        }))),
    ]);
    return { ...order, invoice_pdf_url: invoicePdfUrl, items };
}

function isServerUploadFile(value: FormDataEntryValue): boolean {
    return (
        typeof value === "object" &&
        value !== null &&
        "arrayBuffer" in value &&
        typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function" &&
        "size" in value &&
        typeof (value as { size?: unknown }).size === "number" &&
        (value as { size: number }).size > 0
    );
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
    if (role === "accountant") return ["place_order_on_behalf", "manage_payments", "issue_invoice", "issue_receipt", "view_reports"];
    if (role === "manager") return ["place_order_on_behalf", "assign_work_orders", "complete_work_orders", "mark_order_confirmed", "mark_order_preparing", "mark_order_ready", "mark_order_out_for_delivery", "mark_order_completed", "cancel_order", "view_reports"];
    return [];
}

function getStaffMutationErrorMessage(err: unknown, fallback: string) {
    const message = err instanceof Error ? err.message : "";

    if (message.includes("ux_staff_members_email")) {
        return "Failed to add staff: email is already in use.";
    }

    if (message.includes("ux_staff_members_mobile_no")) {
        return "Failed to add staff: phone number is already in use.";
    }

    if (message.includes("invalid input value for enum staff_designation")) {
        return "Failed to add staff: the database does not yet allow the selected role. Run the staff designation migration first.";
    }

    return fallback;
}

function getOrderStatusErrorMessage(err: unknown) {
    const message = err instanceof Error ? err.message : "";

    if (message.includes("staff member does not have permission")) {
        return message;
    }

    if (message.includes("assigned staff designation does not match work order designation")) {
        return "Failed to update status: the staff designation does not match the assigned work order.";
    }

    return "Failed to update status";
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
async function getRequestClientIp() {
    const headerList = await headers();
    return headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip")?.trim() || "unknown";
}

async function consumeAuthRateLimit(scope: string, identifier: string) {
    const now = Date.now();
    const ip = await getRequestClientIp();
    const key = `${scope}:${identifier}:${ip}`;
    const current = authRateLimit.get(key);

    if (!current || current.resetAt <= now) {
        authRateLimit.set(key, { count: 1, resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS });
        return { allowed: true, key };
    }

    if (current.count >= AUTH_RATE_LIMIT_MAX) {
        return { allowed: false, key };
    }

    current.count += 1;
    return { allowed: true, key };
}

function clearAuthRateLimit(key: string) {
    authRateLimit.delete(key);
}

async function requireAdminAction() {
    const staff = await getActiveStaffFromSession();
    if (!staff || staff.role !== "admin") {
        return { success: false as const, error: "Unauthorized admin action." };
    }
    return { success: true as const, staff };
}

async function getActiveStaffFromSession() {
    const session = await getIronSession<StaffSessionData>(await cookies(), staffSessionOptions);
    const sessionStaff = session.staff;

    if (!sessionStaff?.id || !isUuid(sessionStaff.id)) return null;

    const [staff] = await sql`
        SELECT id, staff_name, email, mobile_no, designation, status
        FROM staff_members
        WHERE id = ${sessionStaff.id}
          AND status = 'active'
    `;

    return staff ? toStaffView(staff) : null;
}

async function requireAdminOrStaffRoles(allowedRoles: StaffRole[]) {
    const staff = await getActiveStaffFromSession();
    if (!staff || !allowedRoles.includes(staff.role)) {
        return { success: false as const, error: "Unauthorized staff action." };
    }

    return { success: true as const, actor: "staff" as const, staff };
}

async function requireUserDataAccess(userId: string | number, staffRoles: StaffRole[] = []) {
    if (!isUuid(userId)) {
        return { success: false as const, error: "Invalid user ID." };
    }

    const user = await getUserSession();
    if (user?.id && String(user.id) === String(userId)) {
        return { success: true as const, actor: "user" as const, userId: String(user.id) };
    }

    if (staffRoles.length > 0) {
        const privileged = await requireAdminOrStaffRoles(staffRoles);
        if (privileged.success) return privileged;
    }

    return { success: false as const, error: "Unauthorized user data access." };
}

async function requireRecentlyVerifiedPhone(phone: string) {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) return { success: false as const, error: "Invalid phone number" };

    const normalizedPhone = normalizeMobileNo(parsed.data);
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (
        session.verifiedPhone !== normalizedPhone ||
        !session.verifiedPhoneExpiresAt ||
        session.verifiedPhoneExpiresAt < Date.now()
    ) {
        return { success: false as const, error: "Phone verification expired. Please request a new OTP." };
    }

    return { success: true as const, normalizedPhone, session };
}

// Memoized per-request: getUserSession() is called independently by page components
// and by requireUserDataAccess() inside every server action on the page, so without
// this it re-runs the app_users lookup (and competes for a DB pool connection)
// multiple times per request.
export const getUserSession = cache(async function getUserSession() {
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
});

// ---------------------------------------------------------------------------
// OTP Server Actions — Firebase Phone Auth token verification
// ---------------------------------------------------------------------------
export async function verifyFirebaseToken(idToken: string, phone: string) {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) return { success: false as const, error: "Invalid phone number" };

    if (!idToken) return { success: false as const, error: "Missing authentication token" };

    try {
        const { verifyFirebaseIdToken } = await import("@/lib/firebase/verify");
        const decoded = await withTimeout(
            verifyFirebaseIdToken(idToken),
            EXTERNAL_API_TIMEOUT_MS,
            "Firebase token verification"
        );

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

        const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
        session.verifiedPhone = expectedPhone;
        session.verifiedPhoneExpiresAt = Date.now() + VERIFIED_PHONE_TTL_MS;
        await session.save();

        return { success: true as const };
    } catch (err: any) {
        console.error("Firebase token verification failed:", err?.code, err?.message, err);
        return {
            success: false as const,
            error: getSafeErrorMessage(err, "Verification failed. Please try again."),
        };
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
            SELECT id, first_name, last_name, email, mobile_no, payment_type, created_at
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
    const verified = await requireRecentlyVerifiedPhone(phone);
    if (!verified.success) return verified;

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
                RETURNING id, first_name, last_name, email, mobile_no, payment_type, created_at
            `;
            return toUserView(verified);
        });
        
        const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
        session.user = user as any;
        session.verifiedPhone = undefined;
        session.verifiedPhoneExpiresAt = undefined;
        await session.save();

        return { success: true as const, user };
    } catch (err) {
        console.error("Error registering user:", err);
        return { success: false as const, error: "Failed to register user. Email or phone may already be in use." };
    }
}

export async function loginUser(phone: string) {
    const verified = await requireRecentlyVerifiedPhone(phone);
    if (!verified.success) return verified;

    const result = await checkUser(phone);
    // checkUser collapses DB failures into exists:false — surface those as a
    // retryable error instead of letting them read as "not registered", since
    // a cold-start DB hiccup here would otherwise send existing customers to
    // the signup form.
    if (result.error) {
        return { success: false as const, error: result.error };
    }
    if (result.exists && result.user) {
        const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
        session.user = result.user as any;
        session.verifiedPhone = undefined;
        session.verifiedPhoneExpiresAt = undefined;
        await session.save();
        return { success: true, user: result.user };
    }
    return { success: false as const, error: "User not found", notFound: true as const };
}

// Fire-and-forget ping so the AuthModal can kick the serverless DB awake as
// soon as it opens, instead of the login check being the first query.
export async function warmDatabase() {
    try {
        await sql`SELECT 1`;
    } catch {
        // Best-effort only; the actual login/checkUser call still retries.
    }
}

export async function syncUserSession(_user: { id: string | number, name: string, email: string, phone: string }) {
    void _user;
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    if (!session.user) {
        return { success: false as const, error: "Session expired. Please log in again." };
    }

    const hydratedUser = await findUserFromSessionIdentity(session.user);
    if (hydratedUser) {
        session.user = hydratedUser as any;
        await session.save();
        return { success: true, user: hydratedUser };
    }

    if (!isUuid(session.user.id)) {
        session.destroy();
        return { success: false, error: "Session user is no longer valid. Please sign in again." };
    }

    if (!session.user) {
        session.user = session.user as any;
        await session.save();
        return { success: true, user: session.user };
    }
    return { success: false, alreadySynced: true, user: session.user };
}

export async function logoutUser() {
    const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
    session.destroy();
}
// Reads the host straight from DATABASE_URL (never the credentials) so the dashboard
// shows which DB the app is actually pointed at instead of a stale hardcoded label.
function getDbHostLabel() {
    try {
        return new URL(process.env.DATABASE_URL || "").hostname || "unknown-host";
    } catch {
        return "unknown-host";
    }
}

function getFirebaseStatus() {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientConfigured = Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
    return {
        configured: Boolean(projectId) && clientConfigured,
        projectId: projectId || null,
    };
}

export async function getHealthStatus() {
    const auth = await requireAdminAction();
    if (!auth.success) {
        return {
            status: "unauthorized",
            database: {
                connected: false,
                error: "Unauthorized",
            },
            firebase: getFirebaseStatus(),
            timestamp: new Date().toISOString(),
        };
    }

    try {
        const start = Date.now();
        const [{ db_name }] = await sql`SELECT current_database() AS db_name`;
        const latency = Date.now() - start;

        const userCount = await sql`SELECT count(*) FROM app_users`;

        return {
            status: "healthy",
            database: {
                connected: true,
                latency: `${latency}ms`,
                userCount: parseInt(userCount[0].count),
                dbName: db_name as string,
                host: getDbHostLabel(),
            },
            firebase: getFirebaseStatus(),
            timestamp: new Date().toISOString()
        };
    } catch (err) {
        console.error("Health check failed:", err);
        return {
            status: "unhealthy",
            database: {
                connected: false,
                error: "Connection failed",
                host: getDbHostLabel(),
            },
            firebase: getFirebaseStatus(),
            timestamp: new Date().toISOString()
        };
    }
}


// Presigned URLs are cached alongside the product rows. This is safe because the
// presign TTL (STORAGE_S3_PRESIGN_TTL_SECONDS, default 1hr) comfortably outlives
// this cache's revalidate window, so a cached URL is never served past its expiry.
// Presigning is synchronous CPU-bound crypto per item — doing it on every request
// (instead of once per cache window) blocks the event loop for the whole catalog size.
const getCachedProducts = unstable_cache(
    async () => {
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
        const presigned = await Promise.all(products.map(toProductView).map(presignProductView));
        return { success: true as const, products: presigned };
    },
    ["bakery-products-v2"],
    { revalidate: 60, tags: ["products"] }
);

export async function getProducts() {
    try {
        return await getCachedProducts();
    } catch (err) {
        console.error("Failed to fetch products:", err);
        return { success: false as const, error: "Database error" };
    }
}

export async function updateProductDailyLimitForStaff(productId: string, maxDailyLimit: number) {
    if (!isUuid(productId)) {
        return { success: false as const, error: "Invalid product ID" };
    }

    if (!Number.isFinite(maxDailyLimit) || maxDailyLimit < 0) {
        return { success: false as const, error: "Daily limit must be a non-negative number" };
    }

    try {
        const session = await getIronSession<StaffSessionData>(await cookies(), staffSessionOptions);
        const sessionStaff = session.staff;

        if (!sessionStaff?.id || !isUuid(sessionStaff.id)) {
            return { success: false as const, error: "Unauthorized. Please sign in again." };
        }

        const [staff] = await sql`
            SELECT id, designation, status
            FROM staff_members
            WHERE id = ${sessionStaff.id}
              AND status = 'active'
        `;

        if (!staff) {
            return { success: false as const, error: "Staff session is no longer valid." };
        }

        const role = toStaffRole(staff.designation);
        if (role !== "manager" && role !== "admin") {
            return { success: false as const, error: "Only manager or owner can update daily limits." };
        }

        const [updated] = await sql`
            UPDATE products
            SET max_daily_limit = ${Math.trunc(maxDailyLimit)}
            WHERE id = ${productId}
            RETURNING id, max_daily_limit
        `;

        if (!updated) {
            return { success: false as const, error: "Product not found" };
        }

        revalidatePath("/bakery", "layout");
        return { success: true as const, productId: updated.id, maxDailyLimit: Number(updated.max_daily_limit) };
    } catch (err) {
        console.error("Failed to update product daily limit:", err);
        return { success: false as const, error: "Failed to update daily limit" };
    }
}

export async function getProductsForUser(userId: string | number) {
    if (!isUuid(userId)) {
        return getProducts();
    }

    const auth = await requireUserDataAccess(userId, ["admin", "manager", "accountant"]);
    if (!auth.success) {
        return { success: false as const, error: auth.error };
    }

    const fetcher = unstable_cache(
        async (uId: string) => {
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
            const presigned = await Promise.all(products.map(toProductView).map(presignProductView));
            return { success: true as const, products: presigned };
        },
        [`user-products-v2-${userId}`],
        { revalidate: 300, tags: ["products", `user-products-${userId}`] }
    );
    try {
        return await fetcher(userId as string);
    } catch (err) {
        console.error("Failed to fetch products for user:", err);
        return { success: false as const, error: "Database error" };
    }
}

export async function addProduct(product: { name: string, category: string, price: number, image: string, description: string, unit: string, max_daily_limit: number }) {
    const auth = await requireAdminAction();
    if (!auth.success) return auth;

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
                    ${stripPresignQuery(parsed.data.image)}, ${parsed.data.price}, ${parsed.data.description},
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
        return { success: true as const, product: await presignProductView(toProductView(newProduct)) };
    } catch (err) {
        console.error("Failed to add product:", err);
        return { success: false as const, error: "Failed to add product" };
    }
}

export async function deleteProduct(id: string | number) {
    const auth = await requireAdminAction();
    if (!auth.success) return auth;

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
        const categories = await sql`
            SELECT id, name, short_description, status, created_at
            FROM product_categories
            WHERE status = 'show'
            ORDER BY display_order ASC, name ASC
        `;
        return { success: true as const, categories };
    },
    ["bakery-categories-v4"],
    { revalidate: 300, tags: ["categories"] }
);

export async function getCategories() {
    try {
        return await getCachedCategories();
    } catch (err) {
        console.error("Failed to fetch categories:", err);
        return { success: false as const, error: "Database error" };
    }
}

export async function addCategory(name: string) {
    const auth = await requireAdminAction();
    if (!auth.success) return auth;

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
    const auth = await requireAdminAction();
    if (!auth.success) return auth;

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
    const auth = await requireAdminAction();
    if (!auth.success) return auth;

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
    const auth = await requireAdminAction();
    if (!auth.success) return auth;

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
                    image_url = ${stripPresignQuery(parsed.data.image)},
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
        return { success: true as const, product: await presignProductView(toProductView(updated)) };
    } catch (err) {
        console.error("Failed to update product:", err);
        return { success: false as const, error: "Failed to update product" };
    }
}

export async function uploadImage(formData: FormData) {
    const auth = await requireAdminAction();
    if (!auth.success) return auth;

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
        if (!hasAllowedImageSignature(buffer, file.type)) {
            return { success: false, error: "Invalid image content. The file does not match its declared type." };
        }
        const bucket = process.env.STORAGE_S3_BUCKET || "vvip-bucket";

        const command = new PutObjectCommand({
            Bucket: bucket,
            Key: filePath,
            Body: buffer,
            ContentType: file.type,
        });

        await s3Client.send(command);

        return { success: true, url: await getPresignedObjectUrl(bucket, filePath) };
    } catch (err: any) {
        console.error("Image upload failed:", err);
        return {
            success: false,
            error: getSafeErrorMessage(err, "Image upload failed. Please try again."),
        };
    }
}

// --- STAFF MANAGEMENT ---

export async function getStaffMembers() {
    const auth = await requireAdminAction();
    if (!auth.success) return { ...auth, staff: [] };

    try {
        const staff = await sql`
            SELECT id, staff_name, email, mobile_no, designation, status, created_at
            FROM staff_members
            ORDER BY (status = 'active') DESC, created_at DESC
        `;
        return { success: true, staff: staff.map(toStaffView) };
    } catch (err) {
        console.error("Failed to fetch staff:", err);
        return { success: false, error: "Database error" };
    }
}

export async function addStaff(staffMember: { name: string, email: string, phone: string, role: string, password: string }) {
    const auth = await requireAdminAction();
    if (!auth.success) return auth;

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
        return {
            success: false as const,
            error: getStaffMutationErrorMessage(err, "Failed to add staff due to a database error."),
        };
    }
}

export async function deleteStaff(id: string | number) {
    const auth = await requireAdminAction();
    if (!auth.success) return auth;

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

export async function updateStaff(id: string | number, staffMember: { name: string, email: string, phone: string, role: string, password?: string }) {
    const auth = await requireAdminAction();
    if (!auth.success) return auth;

    const parsed = staffUpdateSchema.safeParse(staffMember);
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0].message };
    }

    try {
        const currentRows = await sql`SELECT designation FROM staff_members WHERE id = ${id}`;
        if (currentRows.length === 0) return { success: false as const, error: "Staff member not found" };

        const currentRole = toStaffRole((currentRows[0] as any).designation);
        const nextRole = parsed.data.role;

        // Guard against demoting the last remaining admin
        if (currentRole === "admin" && nextRole !== "admin") {
            const adminCount = await sql`SELECT count(*) FROM staff_members WHERE designation = 'admin' AND status = 'active'`;
            const currentCount = parseInt((adminCount[0] as any).count);
            if (currentCount <= 1) {
                return {
                    success: false as const,
                    error: "Security Lock: Cannot change the role of the last administrator account.",
                };
            }
        }

        const updatedStaff = await sql.begin(async (tx: any) => {
            const passwordHash = parsed.data.password ? await bcrypt.hash(parsed.data.password, 12) : null;

            const [updated] = passwordHash
                ? await tx`
                    UPDATE staff_members
                    SET staff_name = ${parsed.data.name}, email = ${parsed.data.email},
                        mobile_no = ${normalizeMobileNo(parsed.data.phone)}, designation = ${toStaffDesignation(nextRole)},
                        password_hash = ${passwordHash}
                    WHERE id = ${id}
                    RETURNING id, staff_name, email, mobile_no, designation, status, created_at
                `
                : await tx`
                    UPDATE staff_members
                    SET staff_name = ${parsed.data.name}, email = ${parsed.data.email},
                        mobile_no = ${normalizeMobileNo(parsed.data.phone)}, designation = ${toStaffDesignation(nextRole)}
                    WHERE id = ${id}
                    RETURNING id, staff_name, email, mobile_no, designation, status, created_at
                `;

            if (currentRole !== nextRole) {
                await tx`UPDATE staff_permissions SET revoked_at = now() WHERE staff_id = ${id} AND revoked_at IS NULL`;
                await grantDefaultStaffPermissions(tx, String(id), nextRole);
            }

            return toStaffView(updated);
        });

        return { success: true as const, staff: updatedStaff };
    } catch (err) {
        console.error("Failed to update staff member:", err);
        return {
            success: false as const,
            error: getStaffMutationErrorMessage(err, "Failed to update staff due to a database error."),
        };
    }
}

export async function setStaffStatus(id: string | number, status: "active" | "inactive") {
    const auth = await requireAdminAction();
    if (!auth.success) return auth;

    try {
        const currentRows = await sql`SELECT designation FROM staff_members WHERE id = ${id}`;
        if (currentRows.length === 0) return { success: false as const, error: "Staff member not found" };

        const role = toStaffRole((currentRows[0] as any).designation);

        if (status === "inactive" && role === "admin") {
            const adminCount = await sql`SELECT count(*) FROM staff_members WHERE designation = 'admin' AND status = 'active'`;
            const currentCount = parseInt((adminCount[0] as any).count);
            if (currentCount <= 1) {
                return {
                    success: false as const,
                    error: "Security Lock: Cannot deactivate the last administrator account.",
                };
            }
        }

        await sql`UPDATE staff_members SET status = ${status} WHERE id = ${id}`;
        return { success: true as const };
    } catch (err) {
        console.error("Failed to update staff status:", err);
        return { success: false as const, error: "Failed to update staff status" };
    }
}

// --- ORDER MANAGEMENT ---

// (Redundant placeOrder removed, using consolidated version below)

export async function getOrders() {
    const auth = await requireAdminOrStaffRoles(["admin", "manager", "accountant", "baker", "delivery"]);
    if (!auth.success) return { ...auth, orders: [] };

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
                pay.payment_received_at,
                o.placed_by,
                o.placed_by_staff_id,
                CASE
                    WHEN EXISTS (
                        SELECT 1 FROM payments pay
                        WHERE pay.order_id = o.id AND pay.payment_status = 'succeeded'
                    ) THEN 'paid'
                    WHEN o.payment_type_snapshot = 'postpaid_user' THEN 'postpaid-pending'
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
                            'category',        COALESCE(oi.category_name_snapshot, ''),
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
            LEFT JOIN LATERAL (
                SELECT created_at AS payment_received_at
                FROM payments
                WHERE order_id = o.id
                  AND payment_status = 'succeeded'
                ORDER BY created_at DESC
                LIMIT 1
            ) pay ON true
            LEFT JOIN order_items oi ON oi.order_id = o.id
            LEFT JOIN products    p  ON p.id = oi.product_id
            GROUP BY o.id, inv.invoice_number, inv.invoice_pdf_url, pay.payment_received_at
            ORDER BY o.created_at DESC
        `;
        const actorRole = auth.actor === "staff" ? auth.staff.role : "admin";
        const visibleOrders = orders.map(toOrderView).filter((order: any) => isOrderVisibleToRole(order, actorRole)).map((order: any) => redactOrderForRole(order, actorRole));
        return { success: true as const, orders: await Promise.all(visibleOrders.map(presignOrderView)) };
    } catch (err) {
        console.error("Failed to fetch orders:", err);
        return { success: false as const, error: "Database error" };
    }
}

function isOrderVisibleToRole(order: any, role: StaffRole | "admin") {
    if (role === "admin" || role === "manager") return true;
    if (role === "baker") {
        return isOperationallyClearedPayment(order.payment_status) && ["pending", "preparing", "prepared"].includes(order.status);
    }
    if (role === "delivery") {
        return isOperationallyClearedPayment(order.payment_status) && ["prepared", "in transit", "delivered"].includes(order.status);
    }
    if (role === "accountant") {
        return isOperationallyClearedPayment(order.payment_status);
    }
    return false;
}

function redactOrderForRole(order: any, role: StaffRole | "admin") {
    if (role === "admin" || role === "manager") return order;
    if (role === "baker") {
        return {
            ...order,
            user_phone: "Restricted",
            address_line1: null,
            city: null,
            pincode: null,
            invoice_number: null,
            invoice_pdf_url: null,
        };
    }
    if (role === "accountant") {
        return {
            ...order,
            address_line1: null,
            city: null,
            pincode: null,
        };
    }
    return order;
}

const ORDER_FEEDBACK_STATUSES = ["open", "in_review", "resolved", "closed"] as const;

async function canManageOrderFeedback() {
    const staff = await getActiveStaffFromSession();
    return Boolean(staff && ["manager", "admin"].includes(staff.role));
}

export async function getOrderFeedbackTickets() {
    try {
        if (!(await canManageOrderFeedback())) {
            return { success: false as const, error: "Only managers and admins can view order issue tickets.", tickets: [] };
        }

        const tickets = await sql`
            SELECT
                ofb.id,
                ofb.order_id,
                ofb.user_id,
                ofb.issue_type,
                ofb.description,
                ofb.image_urls,
                ofb.status,
                ofb.created_at,
                ofb.updated_at,
                o.order_number,
                o.total_amount,
                o.order_status,
                u.first_name,
                u.last_name,
                u.email,
                u.mobile_no
            FROM order_feedback ofb
            JOIN orders o ON o.id = ofb.order_id
            JOIN app_users u ON u.id = ofb.user_id
            ORDER BY
                CASE ofb.status
                    WHEN 'open' THEN 1
                    WHEN 'in_review' THEN 2
                    WHEN 'resolved' THEN 3
                    ELSE 4
                END,
                ofb.created_at DESC
        `;

        return {
            success: true as const,
            tickets: await Promise.all(tickets.map(async (ticket: any) => {
                const images = Array.isArray(ticket.image_urls) ? ticket.image_urls : [];
                return {
                    id: ticket.id,
                    order_id: ticket.order_id,
                    user_id: ticket.user_id,
                    issue_type: ticket.issue_type,
                    description: ticket.description,
                    image_urls: await Promise.all(images.map(async (image: any) => ({
                        ...image,
                        url: image?.bucket && image?.key
                            ? await getPresignedObjectUrl(image.bucket, image.key)
                            : image?.url,
                    }))),
                    status: ticket.status,
                    created_at: ticket.created_at,
                    updated_at: ticket.updated_at,
                    order_number: ticket.order_number,
                    order_status: toLegacyOrderStatus(ticket.order_status),
                    total_price: Number(ticket.total_amount || 0),
                    user_name: combineName(ticket.first_name, ticket.last_name),
                    user_email: ticket.email,
                    user_phone: denormalizeMobileNo(ticket.mobile_no),
                };
            })),
        };
    } catch (err) {
        console.error("Failed to fetch order feedback tickets:", err);
        return { success: false as const, error: "Could not load issue tickets.", tickets: [] };
    }
}

export async function updateOrderFeedbackStatus(ticketId: string, status: string) {
    if (!isUuid(ticketId)) {
        return { success: false as const, error: "Invalid ticket ID" };
    }

    const parsedStatus = z.enum(ORDER_FEEDBACK_STATUSES).safeParse(status);
    if (!parsedStatus.success) {
        return { success: false as const, error: "Invalid ticket status" };
    }

    try {
        if (!(await canManageOrderFeedback())) {
            return { success: false as const, error: "Only managers and admins can update order issue tickets." };
        }

        const [ticket] = await sql`
            UPDATE order_feedback
            SET status = ${parsedStatus.data}
            WHERE id = ${ticketId}
            RETURNING id
        `;

        if (!ticket) {
            return { success: false as const, error: "Ticket not found" };
        }

        return { success: true as const };
    } catch (err) {
        console.error("Failed to update order feedback status:", err);
        return { success: false as const, error: "Could not update ticket status." };
    }
}

export async function updateOrderStatus(orderId: string | number, status: string, _staffId?: string | number) {
    void _staffId;
    const dbStatus = toDbOrderStatus(status);
    if (!dbStatus) {
        return { success: false as const, error: `Invalid status. Must be one of: ${Object.keys(LEGACY_TO_DB_ORDER_STATUS).join(", ")}` };
    }

    try {
        const auth = await requireAdminOrStaffRoles(["admin", "manager", "baker", "delivery"]);
        if (!auth.success) return auth;

        const actorStaffId = auth.actor === "staff" ? auth.staff.id : null;
        const actorRole = auth.actor === "staff" ? auth.staff.role : "admin";
        if (!canRoleUpdateOrderStatus(actorRole, status)) {
            return { success: false as const, error: "This role cannot move orders to that status." };
        }

        const updated = await sql.begin(async (tx: any) => {
            if (actorStaffId) {
                await tx`SELECT set_config('app.actor_type', 'employee', true)`;
                await tx`SELECT set_config('app.actor_id', ${String(actorStaffId)}, true)`;
                await tx`SELECT set_config('app.order_status_reason', ${`Staff panel changed status to ${status}`}, true)`;
            }

            const [order] = await tx`
                UPDATE orders
                SET order_status = ${dbStatus}
                WHERE id = ${orderId}
                RETURNING *
            `;

            if (order && actorStaffId) {
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
                            SET assigned_staff_id = ${actorStaffId},
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
                                ${actorStaffId}, ${`Prepare ${order.order_number}`}
                            )
                        `;
                    }
                } else if (dbStatus === "ready_for_pickup") {
                    const work = await tx`
                        UPDATE work_orders
                        SET work_status = 'completed',
                            completed_by_staff_id = ${actorStaffId}
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
                                ${actorStaffId}, ${actorStaffId}, ${`Prepare ${order.order_number}`}
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
                            SET assigned_staff_id = ${actorStaffId},
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
                                ${actorStaffId}, ${`Deliver ${order.order_number}`}
                            )
                        `;
                    }
                } else if (dbStatus === "completed") {
                    const work = await tx`
                        UPDATE work_orders
                        SET work_status = 'completed',
                            completed_by_staff_id = ${actorStaffId}
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
                                ${actorStaffId}, ${actorStaffId}, ${`Deliver ${order.order_number}`}
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
        return { success: false as const, error: getOrderStatusErrorMessage(err) };
    }
}

export async function staffLogin(email: string, pass: string) {
    const safeEmail = sanitizeLoginEmail(email);
    const rateLimit = await consumeAuthRateLimit("staff", safeEmail || "blank");
    if (!rateLimit.allowed) {
        return { success: false as const, error: "Too many login attempts. Please try again later." };
    }

    const schema = z.object({ email: z.string().email().max(254), pass: z.string().min(1).max(256) });
    const parsed = schema.safeParse({ email: safeEmail, pass });
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

        const staffRecord = { ...(staff[0] as any) };
        delete staffRecord.password_hash;
        const staffWithoutHash = toStaffView(staffRecord);

        // Grant the staff session cookie
        const staffSession = await getIronSession<StaffSessionData>(await cookies(), staffSessionOptions);
        staffSession.staff = staffWithoutHash;
        await staffSession.save();

        clearAuthRateLimit(rateLimit.key);
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

async function getAuthenticatedStaffForPermission(permissionCode: string) {
    const session = await getIronSession<StaffSessionData>(await cookies(), staffSessionOptions);
    const sessionStaff = session.staff;

    if (!sessionStaff?.id || !isUuid(sessionStaff.id)) {
        return { success: false as const, error: "Unauthorized. Please sign in again." };
    }

    const [staff] = await sql`
        SELECT id, staff_name, email, mobile_no, designation, status
        FROM staff_members
        WHERE id = ${sessionStaff.id}
          AND status = 'active'
    `;

    if (!staff) {
        return { success: false as const, error: "Staff session is no longer valid." };
    }

    const [hasPermission] = await sql`
        SELECT staff_has_permission(${sessionStaff.id}::uuid, ${permissionCode}::varchar) AS allowed
    `;

    if (!hasPermission?.allowed) {
        return { success: false as const, error: `Missing permission: ${permissionCode}` };
    }

    return { success: true as const, staff: toStaffView(staff) };
}

export async function logoutStaff() {
    const session = await getIronSession<StaffSessionData>(await cookies(), staffSessionOptions);
    session.destroy();

    return { success: true };
}

export async function retryStaffInvoiceGeneration(orderId: string) {
    if (!isUuid(orderId)) {
        return { success: false as const, error: "Invalid order ID" };
    }

    try {
        const auth = await getAuthenticatedStaffForPermission("issue_invoice");
        if (!auth.success) {
            return auth;
        }

        const [order] = await sql`
            SELECT id, payment_type_snapshot FROM orders
            WHERE id = ${orderId}
        `;
        if (!order) return { success: false as const, error: "Order not found" };

        const [payment] = await sql`
            SELECT id FROM payments
            WHERE order_id = ${orderId}
              AND payment_status = 'succeeded'
            LIMIT 1
        `;
        if (!payment && order.payment_type_snapshot !== "postpaid_user") {
            return { success: false as const, error: "No successful payment found for this order" };
        }

        const { generateAndUploadInvoicePdfForOrder } = await import("@/lib/invoice-service");
        const invoice = await withTimeout(
            generateAndUploadInvoicePdfForOrder(sql, orderId),
            INVOICE_API_TIMEOUT_MS,
            "Invoice generation"
        );
        return {
            success: true as const,
            invoicePdfUrl: await toSignedUrl(invoice.invoicePdfUrl),
            invoiceNumber: invoice.invoiceNumber,
        };
    } catch (err: any) {
        console.error("Failed to generate invoice from staff portal:", err);
        return {
            success: false as const,
            error: getSafeErrorMessage(err, err?.message || "Invoice generation failed"),
        };
    }
}

// --- USER SETTINGS & ADDRESSES ---

export async function updateUserDetails(id: string | number, name: string, email: string) {
    if (!isUuid(id)) {
        return { success: false, error: "Session user is no longer valid. Please sign in again." };
    }
    const parsed = z.object({
        name: z.string().trim().min(1).max(100),
        email: z.string().trim().toLowerCase().email().max(254),
    }).safeParse({ name, email });
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message || "Invalid profile details" };
    }

    try {
        const sessionUser = await getUserSession();
        if (!sessionUser?.id || !isUuid(sessionUser.id)) {
            return { success: false, error: "Unauthorized. Please sign in again." };
        }
        requireSameUserId(sessionUser.id, id);

        const { firstName, lastName } = splitName(parsed.data.name);
        const updatedUser = await sql.begin(async (tx: any) => {
            const [updated] = await tx`
                UPDATE app_users
                SET first_name = ${firstName},
                    last_name = ${lastName},
                    email = ${parsed.data.email}
                WHERE id = ${id}
                RETURNING id, first_name, last_name, email, mobile_no, payment_type, created_at
            `;
            return updated ? toUserView(updated) : null;
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
        const auth = await requireUserDataAccess(userId, ["admin", "manager", "accountant"]);
        if (!auth.success) return { ...auth, addresses: [] };

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
        const sessionUser = await getUserSession();
        if (!sessionUser?.id || !isUuid(sessionUser.id)) {
            return { success: false, error: "Unauthorized. Please sign in again." };
        }
        requireSameUserId(sessionUser.id, parsed.data.user_id);

        const [newAddress] = await sql`
            INSERT INTO user_addresses (
                user_id, recipient_name, recipient_mobile_no,
                line1, line2, city, postal_code, is_default
            )
            VALUES (
                ${parsed.data.user_id},
                ${parsed.data.receiver_name},
                ${normalizeMobileNo(parsed.data.receiver_phone)},
                ${parsed.data.address_line1},
                ${parsed.data.address_line2 || null},
                ${parsed.data.city},
                ${parsed.data.pincode},
                ${parsed.data.is_default}
            )
            RETURNING *
        `;
        return { success: true, address: toAddressView(newAddress) };
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
        const sessionUser = await getUserSession();
        if (!sessionUser?.id || !isUuid(sessionUser.id)) {
            return { success: false, error: "Unauthorized. Please sign in again." };
        }
        requireSameUserId(sessionUser.id, userId);

        const updated = await sql`
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
        const sessionUser = await getUserSession();
        if (!sessionUser?.id || !isUuid(sessionUser.id)) {
            return { success: false, error: "Unauthorized. Please sign in again." };
        }
        requireSameUserId(sessionUser.id, userId);

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
        const sessionUser = await getUserSession();
        if (!sessionUser?.id || !isUuid(sessionUser.id)) {
            return { success: false, error: "Unauthorized. Please sign in again.", orders: [] };
        }
        requireSameUserId(sessionUser.id, userId);

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
                    ) THEN 'paid'
                    WHEN o.payment_type_snapshot = 'postpaid_user' THEN 'postpaid-pending'
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
                            'category',        COALESCE(oi.category_name_snapshot, ''),
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
        return { success: true, orders: await Promise.all(orders.map(toOrderView).map(presignOrderView)) };
    } catch (err) {
        console.error("Failed to fetch user orders:", err);
        return { success: false, error: "Database error" };
    }
}

export async function getOrderIssueContext(orderId: string) {
    if (!isUuid(orderId)) {
        return { success: false as const, error: "Invalid order ID" };
    }

    try {
        const sessionUser = await getUserSession();
        if (!sessionUser || !isUuid(sessionUser.id)) {
            return { success: false as const, error: "Unauthorized. Please sign in again." };
        }

        const [order] = await sql`
            SELECT id, order_number, total_amount, order_status, created_at
            FROM orders
            WHERE id = ${orderId}
              AND user_id = ${sessionUser.id}
        `;

        if (!order) {
            return { success: false as const, error: "Order not found" };
        }

        return {
            success: true as const,
            order: {
                id: order.id,
                order_number: order.order_number,
                total_price: Number(order.total_amount || 0),
                status: toLegacyOrderStatus(order.order_status),
                created_at: order.created_at,
            },
        };
    } catch (err) {
        console.error("Failed to load order issue context:", err);
        return { success: false as const, error: "Could not load order details" };
    }
}

export async function submitOrderIssue(formData: FormData) {
    try {
        const sessionUser = await getUserSession();
        if (!sessionUser || !isUuid(sessionUser.id)) {
            return { success: false as const, error: "Unauthorized. Please sign in again." };
        }

        const parsed = orderIssueSchema.safeParse({
            orderId: formData.get("orderId"),
            issueType: formData.get("issueType"),
            description: formData.get("description"),
        });

        if (!parsed.success) {
            return {
                success: false as const,
                error: parsed.error.issues[0]?.message || "Invalid issue details",
            };
        }

        const [order] = await sql`
            SELECT id
            FROM orders
            WHERE id = ${parsed.data.orderId}
              AND user_id = ${sessionUser.id}
        `;

        if (!order) {
            return { success: false as const, error: "Order not found" };
        }

        const files = formData
            .getAll("images")
            .filter(isServerUploadFile) as ServerUploadFile[];

        if (files.length > 3) {
            return { success: false as const, error: "You can upload up to 3 images." };
        }

        const bucket = process.env.STORAGE_S3_BUCKET || "vvip-bucket";
        const uploadedImages: Array<{
            url: string;
            bucket: string;
            key: string;
            contentType: string;
            size: number;
            originalName: string;
        }> = [];

        for (const file of files) {
            const fileExt = ALLOWED_MIME_EXTENSIONS[file.type];
            if (!fileExt) {
                return { success: false as const, error: "Only JPEG, PNG, WebP, or GIF images are allowed." };
            }

            const MAX_OPTIMIZED_SIZE = 2 * 1024 * 1024;
            if (file.size > MAX_OPTIMIZED_SIZE) {
                return { success: false as const, error: "Each optimized image must be 2MB or smaller." };
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            if (!hasAllowedImageSignature(buffer, file.type)) {
                return { success: false as const, error: "Invalid image content. The file does not match its declared type." };
            }
            const key = `order-feedback/${parsed.data.orderId}/${crypto.randomUUID()}.${fileExt}`;

            try {
                await s3Client.send(new PutObjectCommand({
                    Bucket: bucket,
                    Key: key,
                    Body: buffer,
                    ContentType: file.type,
                    CacheControl: "private, max-age=0, no-cache",
                }));
            } catch (uploadErr) {
                console.error("Failed to upload order issue image:", uploadErr);
                return {
                    success: false as const,
                    error: getSafeErrorMessage(uploadErr, "Could not upload the selected image. Please try a smaller image."),
                };
            }

            uploadedImages.push({
                url: buildStorageIdentifierUrl(bucket, key),
                bucket,
                key,
                contentType: file.type,
                size: file.size,
                originalName: file.name,
            });
        }

        let feedback;
        try {
            [feedback] = await sql`
                INSERT INTO order_feedback (
                    order_id,
                    user_id,
                    issue_type,
                    description,
                    image_urls
                )
                VALUES (
                    ${parsed.data.orderId},
                    ${sessionUser.id},
                    ${parsed.data.issueType},
                    ${parsed.data.description},
                    ${sql.json(uploadedImages)}
                )
                RETURNING id
            `;
        } catch (dbErr) {
            console.error("Failed to insert order issue:", dbErr);
            return {
                success: false as const,
                error: getSafeErrorMessage(dbErr, "Could not save your issue. Please try again."),
            };
        }

        revalidatePath("/bakery/settings");
        return { success: true as const, feedbackId: feedback.id };
    } catch (err) {
        console.error("Failed to submit order issue:", err);
        return {
            success: false as const,
            error: getSafeErrorMessage(err, "Could not submit your issue. Please try again."),
        };
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
        const sessionUser = await getUserSession();
        if (!sessionUser?.id || !isUuid(sessionUser.id)) {
            return { success: false, error: "Unauthorized. Please sign in again." };
        }
        if (!localOrderId || !isUuid(localOrderId)) {
            return { success: false, error: "A valid local order ID is required." };
        }

        let amountToCharge = amount;
        let localOrder: any = null;
        const orders = await sql`
            SELECT id, user_id, order_number, total_amount
            FROM orders
            WHERE id = ${localOrderId}
              AND user_id = ${sessionUser.id}
        `;
        localOrder = orders[0];
        if (!localOrder) return { success: false, error: "Order not found" };
        const dbAmount = Number(localOrder.total_amount);
        // Use DB amount if valid, otherwise fall back to the caller-supplied amount.
        amountToCharge = dbAmount > 0 ? dbAmount : amount;

        if (!amountToCharge || amountToCharge <= 0) {
            return { success: false, error: "Invalid order amount" };
        }

        const options = {
            amount: Math.round(amountToCharge * 100), // Razorpay expects paise
            currency: "INR",
            receipt: localOrder?.order_number
                ? `ord_${String(localOrder.order_number).replace(/\D/g, "") || String(localOrder.order_number).slice(0, 24)}`
                : `rcpt_${Date.now()}`,
        };
        const rzp = getRazorpay();
        if (!rzp) return { success: false, error: "Payment system is not configured." };

        const order: any = await withTimeout(
            rzp.orders.create(options),
            EXTERNAL_API_TIMEOUT_MS,
            "Razorpay order creation"
        );
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
    } catch (err: any) {
        const detail = err?.error?.description || err?.message || String(err);
        console.error("Razorpay Order Creation Failed:", detail, err);
        return {
            success: false,
            error: isTimeoutError(err) ? "Payment gateway timed out. Please try again." : `Payment error: ${detail}`,
        };
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
        const sessionUser = await getUserSession();
        if (!sessionUser?.id || !isUuid(sessionUser.id)) {
            return { success: false, error: "Unauthorized. Please sign in again." };
        }

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
                      AND user_id = ${sessionUser.id}
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
                const invoice = await withTimeout(
                    generateAndUploadInvoicePdfForOrder(sql, orderId),
                    INVOICE_API_TIMEOUT_MS,
                    "Invoice generation"
                );
                return { success: true, invoice: { ...invoice, invoicePdfUrl: await toSignedUrl(invoice.invoicePdfUrl) } };
            } catch (invoiceErr) {
                console.error("Invoice PDF upload failed after successful payment:", invoiceErr);
                return {
                    success: true,
                    invoiceError: getSafeErrorMessage(
                        invoiceErr,
                        "Payment captured, but invoice PDF upload failed."
                    ),
                };
            }
        }

        const [order] = await sql`
            SELECT id, user_id, total_amount
            FROM orders
            WHERE id = ${orderId}
              AND user_id = ${sessionUser.id}
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
        quantity: z.coerce.number().int().positive().max(MAX_CART_ITEM_QUANTITY),
    })).min(1),
    addressId: uuidId,
});

const staffPlaceOrderSchema = placeOrderSchema.extend({
    paymentMode: z.enum(["prepaid", "postpaid"]).default("prepaid"),
});

const cartLimitValidationSchema = z.object({
    items: z.array(z.object({
        id: z.union([z.string().min(1), z.number().int().positive()]).transform(String),
        quantity: z.coerce.number().int().positive().max(MAX_CART_ITEM_QUANTITY),
    })).min(1),
});

async function getAuthenticatedStaffForOrderOnBehalf() {
    const session = await getIronSession<StaffSessionData>(await cookies(), staffSessionOptions);
    const sessionStaff = session.staff;

    if (!sessionStaff?.id || !isUuid(sessionStaff.id)) {
        return { success: false as const, error: "Unauthorized. Please sign in again." };
    }

    const [staff] = await sql`
        SELECT id, staff_name, email, mobile_no, designation, status
        FROM staff_members
        WHERE id = ${sessionStaff.id}
          AND status = 'active'
    `;

    if (!staff) {
        return { success: false as const, error: "Staff session is no longer valid." };
    }

    const staffView = toStaffView(staff);
    if (!["admin", "manager", "accountant"].includes(staffView.role)) {
        return { success: false as const, error: "Only admin, manager, or accountant staff can place orders on behalf of users." };
    }

    await grantDefaultStaffPermissions(sql, staffView.id, staffView.role);

    const [hasPermission] = await sql`
        SELECT staff_has_permission(${staffView.id}::uuid, 'place_order_on_behalf'::varchar) AS allowed
    `;

    if (!hasPermission?.allowed) {
        return { success: false as const, error: "Missing permission: place_order_on_behalf" };
    }

    return { success: true as const, staff: staffView };
}

function normalizeOrderItemsForComparison(items: { product_id?: string | number; id?: string | number; quantity: number }[]) {
    return items
        .map((item) => ({
            productId: String(item.product_id ?? item.id),
            quantity: Number(item.quantity),
        }))
        .sort((a, b) => a.productId.localeCompare(b.productId));
}

function haveSameOrderItems(
    a: { product_id?: string | number; id?: string | number; quantity: number }[],
    b: { product_id?: string | number; id?: string | number; quantity: number }[]
) {
    const left = normalizeOrderItemsForComparison(a);
    const right = normalizeOrderItemsForComparison(b);
    if (left.length !== right.length) return false;
    return left.every((item, index) => item.productId === right[index].productId && item.quantity === right[index].quantity);
}

async function findRecentDuplicateOrder(input: {
    userId: string;
    addressId: string;
    orderStatus: OrderStatus;
    calculatedTotal: number;
    finalItems: { product_id: string | number; quantity: number }[];
}) {
    const candidates = await sql`
        SELECT
            o.id,
            o.order_number,
            o.total_amount,
            COALESCE(
                JSON_AGG(
                    JSON_BUILD_OBJECT(
                        'product_id', oi.product_id,
                        'quantity', oi.quantity
                    ) ORDER BY oi.product_id
                ) FILTER (WHERE oi.id IS NOT NULL),
                '[]'
            ) AS items
        FROM orders o
        LEFT JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = ${input.userId}
          AND o.delivery_address_id = ${input.addressId}
          AND o.order_source = 'web'
          AND o.placed_by = 'self'
          AND o.order_status = ${input.orderStatus}
          AND o.created_at >= now() - interval '2 minutes'
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 5
    `;

    return candidates.find((order: any) =>
        Math.abs(Number(order.total_amount || 0) - input.calculatedTotal) <= 0.5 &&
        haveSameOrderItems(order.items || [], input.finalItems)
    );
}

async function createOrderForUser(input: {
    userId: string;
    items: { id: string, quantity: number }[];
    addressId: string;
    paymentMode: OrderPaymentMode;
    frontendTotal?: number;
    idempotencyKey?: string | null;
    placedByStaffId?: string;
    allowPostpaidOverLimit?: boolean;
}) {
    if (isOrderingClosed()) {
        return { success: false, error: ORDERING_CLOSED_ERROR };
    }

    const productsRes = await getProductsForUser(input.userId);
    if (!productsRes.success) throw new Error("Could not fetch prices");

    const availableProducts = productsRes.products || [];
    const [userProfile] = await sql`
        SELECT
            u.id,
            u.payment_type,
            bp.billing_status,
            bp.credit_limit,
            bp.billing_cycle_day,
            bp.payment_terms_days
        FROM app_users u
        LEFT JOIN user_billing_profiles bp
            ON bp.user_id = u.id
        WHERE u.id = ${input.userId}
    `;

    if (!userProfile) {
        return { success: false, error: "User not found" };
    }

    const [deliveryAddress] = await sql`
        SELECT id
        FROM user_addresses
        WHERE id = ${input.addressId}
          AND user_id = ${input.userId}
          AND is_active = true
    `;

    if (!deliveryAddress) {
        return { success: false, error: "Invalid delivery address" };
    }

    const isEligibleForPostpaid = userProfile.payment_type === "postpaid_user";
    const isPostpaidUser = isEligibleForPostpaid && input.paymentMode === "postpaid";
    let calculatedTotal = 0;
    const finalItems: { product_id: string | number, quantity: number }[] = [];
    const dailyLimitValidation = await validateDailyProductLimitsInternal(input.items);

    if (!dailyLimitValidation.allowed) {
        return {
            success: false,
            error: dailyLimitValidation.violations[0]?.error || "Daily product limit exceeded.",
        };
    }

    for (const item of input.items) {
        const product = availableProducts.find((p: any) => String(p.id) === String(item.id));
        if (!product) {
            return { success: false, error: `Product ID ${item.id} not found` };
        }
        const itemTotal = product.price * item.quantity;
        calculatedTotal += itemTotal;
        finalItems.push({
            product_id: product.id,
            quantity: item.quantity
        });
    }

    if (input.frontendTotal !== undefined && Math.abs(calculatedTotal - Number(input.frontendTotal)) > 0.5) {
        console.warn("Frontend total mismatch", { frontendTotal: input.frontendTotal, calculatedTotal });
    }

    // Set when this order's full cost is already covered by the customer's
    // existing postpaid credit balance (see getUserBillingSummaryInternal) — such
    // orders get auto-marked paid below instead of sitting as postpaid-pending.
    let isFullyCoveredByCredit = false;

    if (isPostpaidUser) {
        if (userProfile.billing_status !== "active") {
            return { success: false, error: "Postpaid billing is not active for this account." };
        }

        const billingSummary = await getUserBillingSummaryInternal(input.userId);
        if (!billingSummary.success) {
            return { success: false, error: billingSummary.error || "Could not verify billing profile" };
        }

        const availableCredit = Number(billingSummary.summary.availableCredit || 0);
        if (calculatedTotal > availableCredit && !input.allowPostpaidOverLimit) {
            return {
                success: false,
                error: `Postpaid limit exceeded. Available balance is INR ${availableCredit.toFixed(2)}.`,
            };
        }

        const creditBalance = Number(billingSummary.summary.creditBalance || 0);
        isFullyCoveredByCredit = creditBalance >= calculatedTotal;
    }

    const isStaffOrder = Boolean(input.placedByStaffId);
    const targetStatus = (isPostpaidUser || isStaffOrder ? "placed" : "payment_pending") as OrderStatus;

    // SERVER-SIDE REQUIREMENT: add a persisted checkout idempotency key with a unique index for strict replay protection.
    if (input.idempotencyKey && !isStaffOrder) {
        const duplicate = await findRecentDuplicateOrder({
            userId: input.userId,
            addressId: input.addressId,
            orderStatus: targetStatus,
            calculatedTotal,
            finalItems,
        });
        if (duplicate) {
            return {
                success: true,
                orderId: duplicate.id,
                orderNumber: duplicate.order_number,
                total: Number(duplicate.total_amount),
                paymentMode: isPostpaidUser ? "postpaid" : "prepaid",
                reused: true,
            };
        }
    }

    return await sql.begin(async (tx: any) => {
        const [order] = await tx`
            INSERT INTO orders (
                user_id, delivery_address_id, fulfillment_type,
                order_source, placed_by, placed_by_staff_id,
                order_status, payment_type_snapshot
            )
            VALUES (
                ${input.userId},
                ${input.addressId},
                'delivery',
                ${isStaffOrder ? 'phone' : 'web'},
                ${isStaffOrder ? 'staff' : 'self'},
                ${input.placedByStaffId || null},
                ${targetStatus},
                ${isPostpaidUser ? 'postpaid_user' : 'prepaid_user'}
            )
            RETURNING id
        `;

        for (const [index, item] of finalItems.entries()) {
            await tx`
                INSERT INTO order_items (order_id, product_id, quantity, line_number)
                VALUES (${order.id}, ${item.product_id}, ${item.quantity}, ${index + 1})
            `;
        }

        const [savedOrder] = await tx`
            SELECT id, order_number, total_amount
            FROM orders
            WHERE id = ${order.id}
        `;

        if (isStaffOrder && !isPostpaidUser) {
            const [payment] = await tx`
                INSERT INTO payments (
                    user_id, order_id, amount, currency_code, payment_method,
                    payment_status, payment_provider, provider_status,
                    provider_status_message, idempotency_key
                )
                VALUES (
                    ${input.userId}, ${savedOrder.id}, ${savedOrder.total_amount}, 'INR', 'cash',
                    'succeeded', 'staff_offline', 'captured',
                    'Offline payment recorded by staff order on behalf',
                    ${`staff_cash:${savedOrder.id}`}
                )
                ON CONFLICT (payment_provider, idempotency_key)
                    WHERE payment_provider IS NOT NULL AND idempotency_key IS NOT NULL
                DO UPDATE SET
                    amount = EXCLUDED.amount,
                    payment_status = 'succeeded',
                    provider_status = 'captured',
                    provider_status_message = EXCLUDED.provider_status_message
                RETURNING id
            `;

            await tx`
                INSERT INTO receipts (payment_id, user_id, amount, notes)
                VALUES (${payment.id}, ${input.userId}, ${savedOrder.total_amount}, 'Auto-issued for staff offline order')
                ON CONFLICT (payment_id) DO NOTHING
            `;
        }

        if (isFullyCoveredByCredit) {
            await tx`
                INSERT INTO payments (
                    user_id, order_id, amount, currency_code, payment_method,
                    payment_status, captured_at, provider_status_message
                )
                VALUES (
                    ${input.userId}, ${savedOrder.id}, ${savedOrder.total_amount}, 'INR', 'postpaid_credit',
                    'succeeded', now(), 'Covered by existing postpaid credit balance'
                )
            `;
        }

        return {
            success: true,
            orderId: savedOrder.id,
            orderNumber: savedOrder.order_number,
            total: Number(savedOrder.total_amount),
            paymentMode: isPostpaidUser ? "postpaid" : "prepaid",
        };
    });
}

async function validateDailyProductLimitsInternal(items: { id: string, quantity: number }[], excludeOrderId?: string | null) {
    const violations: { productId: string; productName: string; remaining: number; unit: string; requested: number; error: string }[] = [];

    for (const item of items) {
        const [product] = await sql`
            SELECT
                p.id,
                p.name,
                COALESCE(mu.symbol, mu.code, 'unit') AS unit,
                p.max_daily_limit
            FROM products p
            LEFT JOIN measurement_units mu
                ON mu.id = p.unit_id
            WHERE p.id = ${item.id}
        `;

        if (!product) {
            violations.push({
                productId: item.id,
                productName: "Unknown product",
                remaining: 0,
                unit: "unit",
                requested: item.quantity,
                error: `Product ID ${item.id} not found`,
            });
            continue;
        }

        const maxDailyLimit = Number(product.max_daily_limit ?? 100);
        if (maxDailyLimit <= 0) continue;

        const dailyTotalRes = excludeOrderId
            ? await sql`
                SELECT COALESCE(SUM(oi.quantity), 0) as total
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE oi.product_id = ${product.id}
                  AND o.created_at >= CURRENT_DATE
                  AND o.order_status != 'cancelled'
                  AND o.id <> ${excludeOrderId}
            `
            : await sql`
                SELECT COALESCE(SUM(oi.quantity), 0) as total
                FROM order_items oi
                JOIN orders o ON oi.order_id = o.id
                WHERE oi.product_id = ${product.id}
                  AND o.created_at >= CURRENT_DATE
                  AND o.order_status != 'cancelled'
            `;

        const currentDailyTotal = parseFloat(dailyTotalRes[0].total);
        if (currentDailyTotal + item.quantity > maxDailyLimit) {
            const remaining = Math.max(0, maxDailyLimit - currentDailyTotal);
            violations.push({
                productId: String(product.id),
                productName: product.name,
                remaining,
                unit: product.unit,
                requested: item.quantity,
                error: `Limit exceeded for ${product.name}. Only ${remaining} ${product.unit} remaining for today.`,
            });
        }
    }

    return {
        allowed: violations.length === 0,
        violations,
    };
}

export async function validateCartProductLimits(items: { id: string | number, quantity: number }[]) {
    try {
        const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
        if (!session?.user) {
            return { success: false as const, error: "Unauthorized. Please log in again." };
        }

        if (isOrderingClosed()) {
            return {
                success: true as const,
                allowed: false,
                violations: [getOrderingWindowViolation()],
            };
        }

        const parsed = cartLimitValidationSchema.safeParse({ items });
        if (!parsed.success) {
            return { success: false as const, error: "Invalid cart data" };
        }

        return {
            success: true as const,
            ...(await validateDailyProductLimitsInternal(parsed.data.items)),
        };
    } catch (err) {
        console.error("Failed to validate cart product limits:", err);
        return { success: false as const, error: "Could not verify daily product limits" };
    }
}

export async function validatePendingOrderForPayment(orderId: string | number, userId: string | number) {
    if (!isUuid(orderId) || !isUuid(userId)) {
        return { success: false as const, error: "Session user is no longer valid. Please sign in again." };
    }

    try {
        const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
        if (!session?.user) {
            return { success: false as const, error: "Unauthorized. Please log in again." };
        }
        requireSameUserId(session.user.id, userId);

        const [order] = await sql`
            SELECT id, order_status
            FROM orders
            WHERE id = ${orderId}
              AND user_id = ${userId}
        `;
        if (!order) {
            return { success: false as const, error: "Order not found" };
        }

        if (!["payment_pending", "payment_failed"].includes(order.order_status)) {
            return { success: false as const, error: "This order is no longer awaiting payment." };
        }

        const items = await sql`
            SELECT product_id AS id, quantity
            FROM order_items
            WHERE order_id = ${orderId}
            ORDER BY line_number
        `;
        const normalizedItems = items.map((item: any) => ({
            id: String(item.id),
            quantity: Number(item.quantity),
        }));

        const validation = await validateDailyProductLimitsInternal(normalizedItems, String(orderId));
        return {
            success: true as const,
            ...validation,
        };
    } catch (err) {
        console.error("Failed to validate pending order for payment:", err);
        return { success: false as const, error: "Could not verify this pending order" };
    }
}

export async function placeOrder(
    userId: string | number,
    items: { id: string | number, quantity: number }[],
    frontendTotal: number,
    addressId: string | number,
    paymentMode: "prepaid" | "postpaid" = "prepaid",
    checkoutIdempotencyKey?: string
) {
    try {
        // 1. Verify User Session
        const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized. Please log in again." };
        }
        requireSameUserId(session.user.id, userId);

        if (isOrderingClosed()) {
            return { success: false, error: ORDERING_CLOSED_ERROR };
        }

        // 2. Input Validation
        const parsed = placeOrderSchema.safeParse({ userId, items, addressId });
        if (!parsed.success) {
            return { success: false, error: "Invalid order data" };
        }

        const validData = parsed.data;
        const idempotencyKey = validateCheckoutIdempotencyKey(checkoutIdempotencyKey);

        return await createOrderForUser({
            userId: validData.userId,
            items: validData.items,
            addressId: validData.addressId,
            paymentMode,
            frontendTotal,
            idempotencyKey,
        });
    } catch (err) {
        console.error("Failed to place order:", err);
        return { success: false, error: "An unexpected error occurred while placing your order" };
    }
}

export async function staffPlaceOrder(
    userId: string | number,
    items: { id: string | number, quantity: number }[],
    addressId: string | number,
    paymentMode: OrderPaymentMode = "prepaid"
) {
    try {
        const auth = await getAuthenticatedStaffForOrderOnBehalf();
        if (!auth.success) return { success: false, error: auth.error };

        const parsed = staffPlaceOrderSchema.safeParse({ userId, items, addressId, paymentMode });
        if (!parsed.success) {
            return { success: false, error: "Invalid order data" };
        }

        return await createOrderForUser({
            userId: parsed.data.userId,
            items: parsed.data.items,
            addressId: parsed.data.addressId,
            paymentMode: parsed.data.paymentMode,
            placedByStaffId: auth.staff.id,
            allowPostpaidOverLimit: true,
        });
    } catch (err) {
        console.error("Failed to place staff order:", err);
        return { success: false, error: "An unexpected error occurred while placing the order" };
    }
}

// --- MANUAL / OFFLINE PAYMENT RECORDS ---

const MANUAL_PAYMENT_METHODS = ["cash", "upi", "bank_transfer", "card", "net_banking", "wallet"] as const;

const manualPaymentSchema = z.object({
    userId: z.string().uuid(),
    amount: z.coerce.number().positive().max(10_000_000),
    paymentMethod: z.enum(MANUAL_PAYMENT_METHODS),
    notes: z.string().max(1000).trim().optional(),
    paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export async function recordManualPayment(input: {
    userId: string;
    amount: number | string;
    paymentMethod: string;
    notes?: string;
    paymentDate?: string;
}) {
    const auth = await requireAdminOrStaffRoles(["admin", "manager", "accountant"]);
    if (!auth.success) return auth;

    const parsed = manualPaymentSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0]?.message || "Invalid payment details" };
    }

    try {
        const [user] = await sql`SELECT id FROM app_users WHERE id = ${parsed.data.userId}`;
        if (!user) {
            return { success: false as const, error: "Selected user is not a registered app user." };
        }

        // No separate ledger to update here: getUserBillingSummaryInternal computes
        // pendingAmount/availableCredit live as (all-time orders) minus (all-time
        // manual_payment_records), so recording the payment is all that's needed
        // for it to immediately offset debt / roll over as credit.
        const paymentDate = parsed.data.paymentDate || new Date().toISOString().slice(0, 10);
        const [record] = await sql`
            INSERT INTO manual_payment_records (
                user_id, amount, payment_method, notes,
                recorded_by_staff_id, payment_date
            )
            VALUES (
                ${parsed.data.userId},
                ${parsed.data.amount},
                ${parsed.data.paymentMethod},
                ${parsed.data.notes || null},
                ${auth.staff.id},
                ${paymentDate}
            )
            RETURNING id, currency_code
        `;

        await sql`
            INSERT INTO manual_payment_record_history (
                record_id, action, amount, currency_code, payment_method, payment_date, notes, changed_by_staff_id
            )
            VALUES (
                ${record.id}, 'created', ${parsed.data.amount}, ${record.currency_code}, ${parsed.data.paymentMethod},
                ${paymentDate}, ${parsed.data.notes || null}, ${auth.staff.id}
            )
        `;

        return { success: true as const, id: record.id };
    } catch (err) {
        console.error("Failed to record manual payment:", err);
        return { success: false as const, error: "Database error" };
    }
}

const manualPaymentUpdateSchema = z.object({
    recordId: z.string().uuid(),
    amount: z.coerce.number().positive().max(10_000_000),
    paymentMethod: z.enum(MANUAL_PAYMENT_METHODS),
    notes: z.string().max(1000).trim().optional(),
    paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function updateManualPaymentRecord(input: {
    recordId: string;
    amount: number | string;
    paymentMethod: string;
    notes?: string;
    paymentDate: string;
}) {
    const auth = await requireAdminOrStaffRoles(["admin"]);
    if (!auth.success) return auth;

    const parsed = manualPaymentUpdateSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false as const, error: parsed.error.issues[0]?.message || "Invalid payment details" };
    }

    try {
        const [record] = await sql`
            UPDATE manual_payment_records
            SET amount = ${parsed.data.amount},
                payment_method = ${parsed.data.paymentMethod},
                notes = ${parsed.data.notes || null},
                payment_date = ${parsed.data.paymentDate}
            WHERE id = ${parsed.data.recordId}
            RETURNING id, currency_code
        `;

        if (!record) {
            return { success: false as const, error: "Payment record not found" };
        }

        await sql`
            INSERT INTO manual_payment_record_history (
                record_id, action, amount, currency_code, payment_method, payment_date, notes, changed_by_staff_id
            )
            VALUES (
                ${record.id}, 'updated', ${parsed.data.amount}, ${record.currency_code}, ${parsed.data.paymentMethod},
                ${parsed.data.paymentDate}, ${parsed.data.notes || null}, ${auth.staff.id}
            )
        `;

        return { success: true as const, id: record.id };
    } catch (err) {
        console.error("Failed to update manual payment record:", err);
        return { success: false as const, error: "Database error" };
    }
}

export async function getManualPaymentRecordHistory(recordId: string) {
    const auth = await requireAdminOrStaffRoles(["admin", "manager", "accountant"]);
    if (!auth.success) return { ...auth, history: [] };

    if (!isUuid(recordId)) {
        return { success: false as const, error: "Invalid record", history: [] };
    }

    try {
        const history = await sql`
            SELECT
                h.id, h.action, h.amount, h.currency_code, h.payment_method,
                h.payment_date, h.notes, h.created_at,
                s.staff_name AS changed_by_name, s.designation AS changed_by_designation
            FROM manual_payment_record_history h
            JOIN staff_members s ON s.id = h.changed_by_staff_id
            WHERE h.record_id = ${recordId}
            ORDER BY h.created_at ASC
        `;

        return {
            success: true as const,
            history: history.map((h: any) => ({
                id: h.id,
                action: h.action,
                amount: Number(h.amount),
                currencyCode: h.currency_code,
                paymentMethod: h.payment_method,
                paymentDate: h.payment_date,
                notes: h.notes,
                createdAt: h.created_at,
                changedByName: h.changed_by_name,
                changedByRole: toStaffRole(h.changed_by_designation),
            })),
        };
    } catch (err) {
        console.error("Failed to fetch manual payment record history:", err);
        return { success: false as const, error: "Database error", history: [] };
    }
}

export async function getManualPaymentRecords() {
    const auth = await requireAdminOrStaffRoles(["admin", "manager", "accountant"]);
    if (!auth.success) return { ...auth, records: [] };

    try {
        const records = await sql`
            SELECT
                mpr.id, mpr.amount, mpr.currency_code, mpr.payment_method,
                mpr.notes, mpr.payment_date, mpr.created_at,
                u.first_name AS user_first_name, u.last_name AS user_last_name,
                u.mobile_no AS user_mobile_no, u.email AS user_email,
                s.staff_name AS recorded_by_name, s.designation AS recorded_by_designation
            FROM manual_payment_records mpr
            JOIN app_users u ON u.id = mpr.user_id
            JOIN staff_members s ON s.id = mpr.recorded_by_staff_id
            ORDER BY mpr.created_at DESC
            LIMIT 500
        `;
        return {
            success: true as const,
            records: records.map((r: any) => ({
                id: r.id,
                amount: Number(r.amount),
                currencyCode: r.currency_code,
                paymentMethod: r.payment_method,
                notes: r.notes,
                paymentDate: r.payment_date,
                createdAt: r.created_at,
                userName: combineName(r.user_first_name, r.user_last_name),
                userPhone: denormalizeMobileNo(r.user_mobile_no),
                userEmail: r.user_email,
                recordedByName: r.recorded_by_name,
                recordedByRole: toStaffRole(r.recorded_by_designation),
            })),
        };
    } catch (err) {
        console.error("Failed to fetch manual payment records:", err);
        return { success: false as const, error: "Database error", records: [] };
    }
}

// --- USER PRICING MANAGEMENT ---

export async function getUsers() {
    const auth = await requireAdminOrStaffRoles(["admin", "manager", "accountant"]);
    if (!auth.success) return { ...auth, users: [] };

    try {
        const users = await sql`
            SELECT
                u.id,
                u.first_name,
                u.last_name,
                u.email,
                u.mobile_no,
                u.payment_type,
                u.created_at,
                bp.billing_status,
                bp.credit_limit,
                bp.current_balance,
                bp.billing_cycle_day,
                bp.payment_terms_days
            FROM app_users u
            LEFT JOIN user_billing_profiles bp
                ON bp.user_id = u.id
            ORDER BY u.created_at DESC
        `;
        return { success: true, users: users.map(toUserView) };
    } catch (err) {
        console.error("Failed to fetch users:", err);
        return { success: false, error: "Database error" };
    }
}

export async function getUserBillingSummary(userId: string | number) {
    if (!isUuid(userId)) {
        return { success: false as const, error: "Session user is no longer valid. Please sign in again." };
    }

    try {
        const auth = await requireUserDataAccess(userId, ["admin", "manager", "accountant"]);
        if (!auth.success) return auth;

        return await getUserBillingSummaryInternal(userId);
    } catch (err) {
        console.error("Failed to fetch user billing summary:", err);
        return { success: false as const, error: "Database error" };
    }
}

export async function updateUserBillingSettings(input: {
    userId: string;
    paymentType: "prepaid_user" | "postpaid_user";
    creditLimit: number;
    billingCycleDay: number;
    paymentTermsDays: number;
    invoiceEmail?: string;
    notes?: string;
}) {
    const auth = await requireAdminAction();
    if (!auth.success) return auth;

    if (!isUuid(input.userId)) {
        return { success: false as const, error: "Invalid user ID" };
    }

    const paymentType = input.paymentType;
    const creditLimit = Number(input.creditLimit || 0);
    const billingCycleDay = Math.min(28, Math.max(1, Math.trunc(input.billingCycleDay || 1)));
    const paymentTermsDays = Math.min(90, Math.max(0, Math.trunc(input.paymentTermsDays || 0)));

    try {
        const updated = await sql.begin(async (tx: any) => {
            const [user] = await tx`
                UPDATE app_users
                SET payment_type = ${paymentType}
                WHERE id = ${input.userId}
                RETURNING id
            `;

            if (!user) {
                throw new Error("User not found");
            }

            if (paymentType === "postpaid_user") {
                await tx`
                    INSERT INTO user_billing_profiles (
                        user_id, billing_status, credit_limit, billing_cycle_day, payment_terms_days, invoice_email, notes
                    )
                    VALUES (
                        ${input.userId}, 'active', ${creditLimit}, ${billingCycleDay}, ${paymentTermsDays},
                        ${input.invoiceEmail || null}, ${input.notes || null}
                    )
                    ON CONFLICT (user_id)
                    DO UPDATE SET
                        billing_status = 'active',
                        credit_limit = EXCLUDED.credit_limit,
                        billing_cycle_day = EXCLUDED.billing_cycle_day,
                        payment_terms_days = EXCLUDED.payment_terms_days,
                        invoice_email = EXCLUDED.invoice_email,
                        notes = EXCLUDED.notes
                `;
            } else {
                await tx`
                    UPDATE user_billing_profiles
                    SET billing_status = 'closed'
                    WHERE user_id = ${input.userId}
                `;
            }
        });

        return { success: true as const, updated };
    } catch (err: any) {
        console.error("Failed to update user billing settings:", err);
        return { success: false as const, error: err?.message || "Failed to update billing settings" };
    }
}

export async function getUserPrices(userId: string | number) {
    const auth = await requireAdminAction();
    if (!auth.success) return { ...auth, prices: [] };

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
    const auth = await requireAdminAction();
    if (!auth.success) return auth;

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

export async function retryInvoiceGeneration(orderId: string, userId: string) {
    if (!isUuid(orderId) || !isUuid(userId)) {
        return { success: false, error: "Invalid order or user ID" };
    }

    try {
        const session = await getIronSession<UserSessionData>(await cookies(), userSessionOptions);
        if (!session?.user) {
            return { success: false, error: "Unauthorized. Please sign in again." };
        }
        requireSameUserId(session.user.id, userId);

        const [order] = await sql`
            SELECT id, payment_type_snapshot FROM orders
            WHERE id = ${orderId} AND user_id = ${userId}
        `;
        if (!order) return { success: false, error: "Order not found" };

        const [payment] = await sql`
            SELECT id FROM payments
            WHERE order_id = ${orderId} AND payment_status = 'succeeded'
            LIMIT 1
        `;
        if (!payment && order.payment_type_snapshot !== "postpaid_user") {
            return { success: false, error: "No successful payment found for this order" };
        }

        const { generateAndUploadInvoicePdfForOrder } = await import("@/lib/invoice-service");
        const invoice = await withTimeout(
            generateAndUploadInvoicePdfForOrder(sql, orderId),
            INVOICE_API_TIMEOUT_MS,
            "Invoice generation"
        );
        return { success: true, invoicePdfUrl: await toSignedUrl(invoice.invoicePdfUrl), invoiceNumber: invoice.invoiceNumber };
    } catch (err: any) {
        console.error("Failed to retry invoice generation:", err);
        return {
            success: false,
            error: getSafeErrorMessage(err, err?.message || "Invoice generation failed"),
        };
    }
}
