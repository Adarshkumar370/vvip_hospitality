import type { Metadata } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import ConditionalNavbar from "@/components/layout/ConditionalNavbar";
import ConditionalFooter from "@/components/layout/ConditionalFooter";
import MainLayoutWrapper from "@/components/layout/MainLayoutWrapper";
import ConditionalWhatsAppButton from "@/components/layout/ConditionalWhatsAppButton";
import { SITE_CONFIG } from "@/lib/constants/config";

const SITE_URL = "https://vviphospitality.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "VVIP Hospitality | Premium Stays & Bakery Services",
    template: "%s | VVIP Hospitality",
  },
  description:
    "VVIP Hospitality runs Olive Stayz, a premium long-stay & medical-tourism accommodation in Kaushambi, Ghaziabad, and Swiss Affaire - The Bake Studio, a B2B cloud kitchen supplying gourmet baked goods to cafes and restaurants.",
  keywords: SITE_CONFIG.keywords,
  authors: [{ name: "VVIP Hospitality" }],
  creator: "VVIP Hospitality",
  publisher: "VVIP Hospitality",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "VVIP Hospitality",
    title: "VVIP Hospitality | Premium Stays & Bakery Services",
    description:
      "Premium long-stay accommodation and B2B cloud kitchen services in Ghaziabad/Noida.",
    images: [
      {
        url: "/images/hero_hospitality.png",
        width: 1200,
        height: 630,
        alt: "VVIP Hospitality",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VVIP Hospitality | Premium Stays & Bakery Services",
    description:
      "Premium long-stay accommodation and B2B cloud kitchen services in Ghaziabad/Noida.",
    images: ["/images/hero_hospitality.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VVIP Hospitality",
  url: SITE_URL,
  logo: `${SITE_URL}/images/olive-stayz-logo-new.png`,
  description: SITE_CONFIG.tagline,
  address: {
    "@type": "PostalAddress",
    streetAddress: SITE_CONFIG.hq,
    addressLocality: "Ghaziabad",
    addressRegion: "Uttar Pradesh",
    postalCode: "201010",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: SITE_CONFIG.whatsapp,
    contactType: "customer service",
    areaServed: "IN",
  },
  subOrganization: [
    {
      "@type": "LodgingBusiness",
      name: "Olive Stayz",
      url: `${SITE_URL}/olive-stayz`,
    },
    {
      "@type": "FoodEstablishment",
      name: "Swiss Affaire - The Bake Studio",
      url: `${SITE_URL}/bakery`,
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="scroll-smooth"
      style={
        {
          "--font-inter": "ui-sans-serif, system-ui, sans-serif",
          "--font-outfit": "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
        } as CSSProperties
      }
    >
      <body className="font-sans antialiased bg-white text-brand-black">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <ConditionalNavbar />
        <MainLayoutWrapper>
          {children}
        </MainLayoutWrapper>
        <ConditionalFooter />
        <ConditionalWhatsAppButton />
      </body>
    </html>
  );
}
