"use client";

import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import BakeryNavbar from "@/components/bakery/BakeryNavbar";
import BakeryFooter from "@/components/bakery/BakeryFooter";
import { warmDatabase } from "@/app/bakery/actions";

export default function BakeryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isStaffRoute = pathname?.startsWith("/bakery/staff");
    const isDeveloperRoute = pathname?.startsWith("/bakery/developer");
    const hideNavbar = isStaffRoute || isDeveloperRoute;

    // Wake the serverless DB as soon as any bakery route is entered, so it's
    // already warm by the time login/checkout/ordering actions need it. Runs
    // after mount/paint and is never awaited, so it can't delay page load.
    useEffect(() => {
        warmDatabase().catch(() => {});
    }, []);

    return (
        <AuthProvider>
            <CartProvider>
                <div className="min-h-screen">
                    {!hideNavbar && (
                        <Suspense fallback={null}>
                            <BakeryNavbar />
                        </Suspense>
                    )}
                    <main>{children}</main>
                    {!hideNavbar && <BakeryFooter />}
                </div>
            </CartProvider>
        </AuthProvider>
    );
}
