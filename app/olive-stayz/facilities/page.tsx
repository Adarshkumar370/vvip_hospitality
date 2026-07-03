import type { Metadata } from "next";
import FacilitiesClient from "./FacilitiesClient";

export const metadata: Metadata = {
    title: "Facilities",
    description:
        "Discover Olive Stayz facilities in Kaushambi, Ghaziabad — Wi-Fi, parking, power backup, housekeeping, security, and accessible amenities for a comfortable long stay.",
    alternates: { canonical: "/olive-stayz/facilities" },
    openGraph: {
        title: "Olive Stayz Facilities",
        description:
            "Wi-Fi, parking, power backup, housekeeping, security, and accessible amenities for a comfortable long stay.",
        url: "/olive-stayz/facilities",
    },
};

export default function FacilitiesPage() {
    return <FacilitiesClient />;
}
