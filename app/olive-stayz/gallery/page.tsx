import type { Metadata } from "next";
import GalleryClient from "./GalleryClient";

export const metadata: Metadata = {
    title: "Gallery",
    description:
        "Browse photos of Olive Stayz property, interiors, and rooms in Kaushambi, Ghaziabad.",
    alternates: { canonical: "/olive-stayz/gallery" },
    openGraph: {
        title: "Olive Stayz Gallery",
        description: "Photos of Olive Stayz property, interiors, and rooms.",
        url: "/olive-stayz/gallery",
    },
};

export default function GalleryPage() {
    return <GalleryClient />;
}
