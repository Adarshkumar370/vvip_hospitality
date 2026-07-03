import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://vviphospitality.in";

    const routes = [
        "",
        "/about-us",
        "/bakery",
        "/contact",
        "/olive-stayz",
        "/olive-stayz/rooms",
        "/olive-stayz/facilities",
        "/olive-stayz/gallery",
        "/privacy-policy",
        "/terms-of-service",
    ];

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: route === "" ? 1 : route.split("/").length > 2 ? 0.6 : 0.8,
    }));
}
