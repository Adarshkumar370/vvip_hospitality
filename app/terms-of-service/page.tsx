import type { Metadata } from "next";
import TermsClient from "./TermsClient";

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Terms of Service for VVIP Hospitality, Olive Stayz, and Swiss Affaire - The Bake Studio.",
    alternates: { canonical: "/terms-of-service" },
    robots: { index: true, follow: true },
};

export default function TermsOfServicePage() {
    return <TermsClient />;
}
