"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function MainLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isBakery = pathname?.startsWith("/bakery");
    const isOliveStayz = pathname?.startsWith("/olive-stayz");

    return (
        <main className={cn("min-h-screen", (!isBakery && !isOliveStayz) && "pt-20")}>
            {children}
        </main>
    );
}
