"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import BakeryNavbar from "@/components/bakery/BakeryNavbar";
import BakeryFooter from "@/components/bakery/BakeryFooter";

export default function BakeryLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isStaffRoute = pathname?.startsWith("/bakery/staff");
    const isDeveloperRoute = pathname?.startsWith("/bakery/developer");
    const hideNavbar = isStaffRoute || isDeveloperRoute;

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
