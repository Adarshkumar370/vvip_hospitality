import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Supabase storage, Unsplash, and Pravatar for images
      "img-src 'self' https://*.supabase.co https://images.unsplash.com https://i.pravatar.cc data: blob:",
      // Next.js requires unsafe-eval in dev; tighten in prod if possible
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://www.google.com",
      "style-src 'self' 'unsafe-inline'",
      // Allow API calls to Supabase, 2Factor, and Razorpay
      "connect-src 'self' https://*.supabase.co https://api.razorpay.com",
      "font-src 'self'",
      "frame-src 'self' https://www.google.com https://api.razorpay.com https://checkout.razorpay.com",
      "frame-ancestors 'none'",
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
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
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
