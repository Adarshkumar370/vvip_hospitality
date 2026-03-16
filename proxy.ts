import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// NOTE: Do NOT import Node.js 'crypto' here — middleware runs in the Edge runtime.
// Use the Web Crypto API (globalThis.crypto) which is available in Edge, Node 15+, and browsers.

const ADMIN_COOKIE = "vvip_admin_session";
const STAFF_COOKIE = "vvip_staff_session";
const LOGIN_PAGE = "/bakery/admin/login";
const ADMIN_ROOT = "/bakery/admin";
const STAFF_ROOT = "/bakery/staff";

// ---------------------------------------------------------------------------
// VULN-10: Rate Limiting
// NOTE: This in-memory Map DOES NOT WORK reliably in serverless / Edge deployments
// (Vercel, AWS Lambda) because each invocation may run in a separate process.
// For production, replace with a Redis-backed solution:
//   npm install @upstash/ratelimit @upstash/redis
//   See: https://github.com/upstash/ratelimit
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, { count: number; timer: ReturnType<typeof setTimeout> }>();

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        "unknown_ip";

    // 1. Rate Limiting for Login Routes
    if (pathname.startsWith(LOGIN_PAGE)) {
        const limit = 5;       // 5 requests
        const windowMs = 60 * 1000; // per minute

        if (!rateLimitMap.has(ip)) {
            rateLimitMap.set(ip, {
                count: 1,
                timer: setTimeout(() => rateLimitMap.delete(ip), windowMs),
            });
        } else {
            const data = rateLimitMap.get(ip)!;
            if (data.count >= limit) {
                return new NextResponse(
                    JSON.stringify({ error: "Too many requests. Please try again later." }),
                    {
                        status: 429,
                        headers: {
                            "Content-Type": "application/json",
                            "Retry-After": "60",
                        },
                    }
                );
            }
            data.count += 1;
        }
    }

    // 2. Authentication Checks
    // NOTE (VULN-09): The middleware only checks cookie *presence*.
    // The actual cryptographic iron-session validation happens inside each Server Action
    // via verifySession(). This middleware check is a UX redirect guard, not
    // a security boundary. Every privileged Server Action calls await verifySession() independently.
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

    // 3. Nonce-Based CSP (VULN-07)
    // Generate a unique cryptographic nonce per request.
    // Pass the nonce to the response via header so app/layout.tsx can read it.
    // Web Crypto API — Edge-compatible nonce generation (16 random bytes → base64)
    const nonceBytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(nonceBytes);
    const nonce = btoa(String.fromCharCode(...nonceBytes));
    const isDev = process.env.NODE_ENV === "development";

    // Build a tight script-src that only allows scripts bearing this nonce.
    // In dev we still need unsafe-eval for React Fast Refresh.
    const scriptSrc = isDev
        ? `'self' 'nonce-${nonce}' 'unsafe-eval'`
        : `'self' 'nonce-${nonce}'`;

    const cspHeader = [
        "default-src 'self'",
        `img-src 'self' https://*.supabase.co data: blob:`,
        `script-src ${scriptSrc}`,
        `style-src 'self' 'unsafe-inline'`,
        `connect-src 'self' https://checkout.razorpay.com`,
        `font-src 'self'`,
        `frame-ancestors 'none'`,
        `frame-src https://api.razorpay.com`,
    ].join("; ");

    const response = NextResponse.next({
        request: {
            headers: new Headers(request.headers),
        },
    });

    // 4. Security Headers
    response.headers.set("Content-Security-Policy", cspHeader);
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    // VULN-08: HSTS — force HTTPS for 2 years, with subdomains and preload
    response.headers.set(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload"
    );
    // Expose the nonce to the layout via a response header
    response.headers.set("x-nonce", nonce);

    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)"],
};
