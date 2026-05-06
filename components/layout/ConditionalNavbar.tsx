"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
    const pathname = usePathname();

    // Hide global navbar on bakery, olive-stayz and reception routes
    if (
        pathname?.startsWith("/bakery") || 
        pathname?.startsWith("/olive-stayz") || 
        pathname === "/receptionolivestayzk"
    ) {
        return null;
    }

    return <Navbar />;
}
