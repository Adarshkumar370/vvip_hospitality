import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
    title: "Contact Us",
    description:
        "Get in touch with VVIP Hospitality for Olive Stayz bookings or Swiss Affaire - The Bake Studio B2B enquiries in Kaushambi, Ghaziabad.",
    alternates: { canonical: "/contact" },
    openGraph: {
        title: "Contact VVIP Hospitality",
        description:
            "Get in touch for Olive Stayz bookings or Swiss Affaire - The Bake Studio B2B enquiries.",
        url: "/contact",
    },
};

export default function ContactPage() {
    return <ContactClient />;
}
