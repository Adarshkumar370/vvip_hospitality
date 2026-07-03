import type { Metadata } from "next";
import OliveStayzClient from "./OliveStayzClient";
import { SITE_CONFIG } from "@/lib/constants/config";

const lodgingJsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: "Olive Stayz",
    url: "https://vviphospitality.in/olive-stayz",
    image: "https://vviphospitality.in/images/backrgound_1.png",
    description:
        "Budget-friendly long-stay apartments and medical-tourism accommodation near Max Hospital Vaishali in Kaushambi, Ghaziabad.",
    address: {
        "@type": "PostalAddress",
        streetAddress: SITE_CONFIG.hq,
        addressLocality: "Ghaziabad",
        addressRegion: "Uttar Pradesh",
        postalCode: "201010",
        addressCountry: "IN",
    },
    telephone: SITE_CONFIG.whatsapp,
    priceRange: "$$",
};

export const metadata: Metadata = {
    title: "Olive Stayz | Premium Long-Stay Accommodation in Kaushambi, Ghaziabad",
    description:
        "Olive Stayz offers budget-friendly long-stay apartments and medical-tourism accommodation near Max Hospital Vaishali in Kaushambi, Ghaziabad. Book a comfortable, accessible stay today.",
    alternates: { canonical: "/olive-stayz" },
    openGraph: {
        title: "Olive Stayz | Premium Long-Stay Accommodation",
        description:
            "Budget-friendly long-stay apartments and medical-tourism accommodation in Kaushambi, Ghaziabad.",
        url: "/olive-stayz",
        images: [
            {
                url: "/images/backrgound_1.png",
                width: 1200,
                height: 630,
                alt: "Olive Stayz",
            },
        ],
    },
};

export default function OliveStayzPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(lodgingJsonLd) }}
            />
            <OliveStayzClient />
        </>
    );
}
