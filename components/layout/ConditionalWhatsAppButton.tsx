"use client";

import { usePathname } from "next/navigation";
import WhatsAppButton from "../ui/WhatsAppButton";

export default function ConditionalWhatsAppButton() {
    const pathname = usePathname();

    // Hide WhatsApp button on bakery and olive-stayz routes
    if (pathname?.startsWith("/bakery") || pathname?.startsWith("/olive-stayz")) {
        return null;
    }

    return <WhatsAppButton />;
}
