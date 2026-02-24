"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
    const pathname = usePathname();

    // Hide global footer on bakery routes
    if (pathname?.startsWith("/bakery")) {
        return null;
    }

    return <Footer />;
}
