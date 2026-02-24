import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_COOKIE = "vvip_admin_session";
const STAFF_COOKIE = "vvip_staff_session";
const LOGIN_PAGE = "/bakery/admin/login";
const ADMIN_ROOT = "/bakery/admin";
const STAFF_ROOT = "/bakery/staff";

// Simple in-memory rate limit store (For production, prefer Redis)
const rateLimitMap = new Map<string, { count: number; timer: NodeJS.Timeout }>();

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown_ip";

    // 1. Rate Limiting for Login Routes
    if (pathname.startsWith(LOGIN_PAGE)) {
        const limit = 5; // 5 requests
        const windowMs = 60 * 1000; // per minute

        if (!rateLimitMap.has(ip)) {
            rateLimitMap.set(ip, { count: 1, timer: setTimeout(() => rateLimitMap.delete(ip), windowMs) });
        } else {
            const data = rateLimitMap.get(ip)!;
            if (data.count >= limit) {
                return new NextResponse(
                    JSON.stringify({ error: "Too many requests. Please try again later." }),
                    { status: 429, headers: { "Content-Type": "application/json", "Retry-After": "60" } }
                );
            }
            data.count += 1;
        }
    }

    // 2. Authentication Checks
    const hasAdminSession = request.cookies.has(ADMIN_COOKIE);
    const hasStaffSession = request.cookies.has(STAFF_COOKIE);

    if (pathname.startsWith(ADMIN_ROOT) && !pathname.startsWith(LOGIN_PAGE)) {
        if (!hasAdminSession) {
            const loginUrl = new URL(LOGIN_PAGE, request.url);
            loginUrl.searchParams.set("from", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    if (pathname.startsWith(LOGIN_PAGE) && hasAdminSession) {
        return NextResponse.redirect(new URL(ADMIN_ROOT, request.url));
    }

    // 3. Security Headers
    const response = NextResponse.next();
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
