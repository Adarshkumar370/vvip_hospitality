import type { Metadata } from "next";
import AboutUsClient from "./AboutUsClient";

export const metadata: Metadata = {
    title: "About Us",
    description:
        "VVIP Hospitality treats every guest as a Very Very Important Person. Learn our story, our values, and how Olive Stayz and Swiss Affaire - The Bake Studio came to be.",
    alternates: { canonical: "/about-us" },
    openGraph: {
        title: "About VVIP Hospitality",
        description:
            "Our story, our values, and how Olive Stayz and Swiss Affaire - The Bake Studio came to be.",
        url: "/about-us",
    },
};

export default function AboutUsPage() {
    return <AboutUsClient />;
}
