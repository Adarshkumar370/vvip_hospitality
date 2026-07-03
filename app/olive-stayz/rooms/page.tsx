import type { Metadata } from "next";
import RoomsClient from "./RoomsClient";

export const metadata: Metadata = {
    title: "Rooms",
    description:
        "Explore Olive Stayz room options in Kaushambi, Ghaziabad — Superior Rooms and more, fully furnished with Wi-Fi, workspace, and accessible amenities for long stays.",
    alternates: { canonical: "/olive-stayz/rooms" },
    openGraph: {
        title: "Olive Stayz Rooms",
        description:
            "Fully furnished rooms with Wi-Fi, workspace, and accessible amenities for long stays in Kaushambi, Ghaziabad.",
        url: "/olive-stayz/rooms",
    },
};

export default function RoomsPage() {
    return <RoomsClient />;
}
