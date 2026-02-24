import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = "https://vviphospitality.in";

    const routes = [
        "",
        "/about-us",
        "/bakery",
        "/contact",
        "/olive-stayz",
        "/privacy-policy",
        "/terms-of-service",
    ];

    return routes.map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: route === "" ? 1 : 0.8,
    }));
}
