import type { Metadata } from "next";
import BakeryHomeClient from "./BakeryHomeClient";
import { SITE_CONFIG } from "@/lib/constants/config";

const bakeryJsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    name: "Swiss Affaire - The Bake Studio",
    url: "https://vviphospitality.in/bakery",
    image: "https://vviphospitality.in/images/bakery_hero_new.png",
    description:
        "B2B cloud kitchen supplying gourmet baked goods, bulk bakery orders, and corporate catering to cafes, restaurants, and events in Ghaziabad.",
    address: {
        "@type": "PostalAddress",
        streetAddress: SITE_CONFIG.hq,
        addressLocality: "Ghaziabad",
        addressRegion: "Uttar Pradesh",
        postalCode: "201010",
        addressCountry: "IN",
    },
    telephone: SITE_CONFIG.whatsapp,
    servesCuisine: "Bakery",
};

export const metadata: Metadata = {
    title: "Swiss Affaire - The Bake Studio | B2B Cloud Kitchen",
    description:
        "Swiss Affaire - The Bake Studio is a B2B cloud kitchen in Ghaziabad supplying gourmet baked goods, bulk bakery orders, and corporate catering to cafes, restaurants, and events.",
    alternates: { canonical: "/bakery" },
    openGraph: {
        title: "Swiss Affaire - The Bake Studio | B2B Cloud Kitchen",
        description:
            "Gourmet-quality baked goods, bulk supply, and corporate catering for cafes, restaurants, and events.",
        url: "/bakery",
        images: [
            {
                url: "/images/bakery_hero_new.png",
                width: 1200,
                height: 630,
                alt: "Swiss Affaire - The Bake Studio",
            },
        ],
    },
};

export default function BakeryPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(bakeryJsonLd) }}
            />
            <BakeryHomeClient />
        </>
    );
}
