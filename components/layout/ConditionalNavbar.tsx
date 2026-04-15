"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
    const pathname = usePathname();

    // Hide global navbar on bakery and olive-stayz routes
    if (pathname?.startsWith("/bakery") || pathname?.startsWith("/olive-stayz")) {
        return null;
    }

    return <Navbar />;
}
