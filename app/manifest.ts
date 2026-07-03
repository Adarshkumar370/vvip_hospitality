import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "VVIP Hospitality",
        short_name: "VVIP Hospitality",
        description:
            "Premium long-stay accommodation (Olive Stayz) and B2B cloud kitchen services (Swiss Affaire - The Bake Studio) in Ghaziabad/Noida.",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#1a3f22",
        icons: [
            {
                src: "/favicon.ico",
                sizes: "48x48",
                type: "image/x-icon",
            },
        ],
    };
}
