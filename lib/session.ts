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
        sameSite: "lax",
        // 8-hour session
        maxAge: 60 * 60 * 8 - 60, // subtract 60s buffer
        path: "/",
    },
};

export interface StaffSessionData {
    staff?: {
        id: string;
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
        sameSite: "lax",
        // 8-hour session
        maxAge: 60 * 60 * 8 - 60, // subtract 60s buffer
        path: "/",
    },
};
export interface UserSessionData {
    user?: {
        id: string;
        name: string;
        email: string;
        phone: string;
        payment_type?: string;
    }
    verifiedPhone?: string;
    verifiedPhoneExpiresAt?: number;
}

export const userSessionOptions: SessionOptions = {
    password: process.env.IRON_SESSION_SECRET as string,
    cookieName: "vvip_user_session",
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        // 2-day customer session.
        maxAge: 60 * 60 * 24 * 2 - 60, // subtract 60s buffer
        path: "/",
    },
};
