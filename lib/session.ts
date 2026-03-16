import type { SessionOptions } from "iron-session";

export interface AdminSessionData {
    isAdmin: boolean;
}

export const adminSessionOptions: SessionOptions = {
    password: process.env.IRON_SESSION_SECRET as string,
    cookieName: "vvip_admin_session",
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        // VULN-17: "strict" prevents the cookie being sent on ANY cross-site request,
        // which is correct for an admin panel — there is no valid cross-site use case.
        sameSite: "strict",
        // 8-hour session
        maxAge: 60 * 60 * 8 - 60, // subtract 60s buffer
        path: "/",
    },
};

export interface StaffSessionData {
    staff?: {
        id: number;
        name: string;
        email: string;
        phone: string;
        role: string;
    }
}

export const staffSessionOptions: SessionOptions = {
    password: process.env.IRON_SESSION_SECRET as string,
    cookieName: "vvip_staff_session",
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        // VULN-17: strict for the same reason as adminSessionOptions
        sameSite: "strict",
        // 8-hour session
        maxAge: 60 * 60 * 8 - 60, // subtract 60s buffer
        path: "/",
    },
};

// VULN-01 / VULN-15: User session for customer-facing checkout flow.
// Uses the same shared IRON_SESSION_SECRET — do NOT use a separate/fallback password.
export interface UserSessionData {
    user?: {
        id: number;
        name: string;
        email: string;
        phone: string;
    };
}

export const userSessionOptions: SessionOptions = {
    password: process.env.IRON_SESSION_SECRET as string,
    cookieName: "vvip_user_session",
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        // 24-hour user session (longer than admin for UX)
        maxAge: 60 * 60 * 24 - 60,
        path: "/",
    },
};
