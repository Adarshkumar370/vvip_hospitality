import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "Privacy Policy for VVIP Hospitality, Olive Stayz, and Swiss Affaire - The Bake Studio.",
    alternates: { canonical: "/privacy-policy" },
    robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
    return <PrivacyClient />;
}
