import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/bakery/admin",
                    "/bakery/checkout",
                    "/bakery/order",
                    "/bakery/settings",
                    "/bakery/staff",
                ],
            },
            {
                userAgent: [
                    "GPTBot",
                    "ChatGPT-User",
                    "CCBot",
                    "Google-Extended",
                    "Anthropic-ai",
                    "Claude-Web",
                    "ClaudeBot",
                    "cohere-ai",
                    "Omgilibot",
                    "Omgili",
                    "FacebookBot",
                    "ImagesiftBot",
                    "PerplexityBot",
                    "YouBot",
                ],
                disallow: "/",
            },
        ],
        sitemap: "https://vviphospitality.in/sitemap.xml",
    };
}
