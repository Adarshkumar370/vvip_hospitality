import type { NextConfig } from "next";

// VULN-07: CSP tightened — unsafe-eval only in dev, unsafe-inline removed in prod.
// Nonce-based CSP is set per-request in middleware.ts for script-src.
// VULN-08: Added Strict-Transport-Security.
// VULN-18: Removed deprecated X-XSS-Protection header (not supported by modern browsers;
//           CSP is the modern replacement).

const isDev = process.env.NODE_ENV === "development";

const securityHeaders = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // VULN-08: HSTS — tell browsers to always use HTTPS for this domain.
    // Only set includeSubDomains if ALL subdomains also serve HTTPS.
    {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
    },
    {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
    },
    {
        // VULN-07: Static CSP fallback served via next.config headers.
        // In dev mode we allow unsafe-eval (needed by Next.js React Fast Refresh).
        // In production, nonces are injected per-request by middleware.ts — this
        // static rule acts as a last-resort fallback for routes middleware might miss
        // (e.g., static assets, _next routes excluded from the matcher).
        key: "Content-Security-Policy",
        value: [
            "default-src 'self'",
            // Supabase storage for images
            "img-src 'self' https://*.supabase.co data: blob:",
            // Dev: allow unsafe-eval for React Fast Refresh. Prod: nonce is set by middleware.
            isDev
                ? "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
                : "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            // Server fetches 2Factor.in; Razorpay checkout widget needs its CDN.
            "connect-src 'self' https://checkout.razorpay.com",
            "font-src 'self'",
            "frame-ancestors 'none'",
            // Razorpay iframe (if used)
            "frame-src https://api.razorpay.com",
        ].join("; "),
    },
];

const nextConfig: NextConfig = {
    experimental: {
        optimizePackageImports: ["lucide-react"],
    },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "*.supabase.co",
                pathname: "/storage/v1/object/public/**",
            },
        ],
    },
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: securityHeaders,
            },
        ];
    },
};

export default nextConfig;
