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
        sameSite: "lax",
        // 8-hour session
        maxAge: 60 * 60 * 8 - 60, // subtract 60s buffer
        path: "/",
    },
};
