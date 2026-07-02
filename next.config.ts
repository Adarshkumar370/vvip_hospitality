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
      // Railway/Tigris object storage, Unsplash, and Pravatar for images
      "img-src 'self' https://t3.storageapi.dev https://images.unsplash.com https://i.pravatar.cc data: blob:",
      // Next.js requires unsafe-eval in dev; gstatic.com for Firebase reCAPTCHA script
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://www.google.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline'",
      // Razorpay and Firebase Auth / reCAPTCHA APIs
      "connect-src 'self' https://api.razorpay.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://firebaseinstallations.googleapis.com https://firebase.googleapis.com https://www.google.com https://recaptcha.google.com",
      "font-src 'self'",
      "frame-src 'self' https://www.google.com https://recaptcha.google.com https://api.razorpay.com https://checkout.razorpay.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  serverExternalPackages: ["pdfkit"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "t3.storageapi.dev",
        pathname: "/**",
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
