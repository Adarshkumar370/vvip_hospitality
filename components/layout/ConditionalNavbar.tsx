"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
    const pathname = usePathname();

    // Hide global navbar on bakery routes
    if (pathname?.startsWith("/bakery")) {
        return null;
    }

    return <Navbar />;
}
