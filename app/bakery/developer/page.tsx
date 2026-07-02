"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, LogOut, Terminal } from "lucide-react";
import { getStaffSession, logoutStaff } from "@/app/bakery/actions";
import { DeveloperDashboard } from "@/components/bakery/staff/DeveloperDashboard";

export default function DeveloperPage() {
    const router = useRouter();
    const [isCheckingSession, setIsCheckingSession] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            const staff = await getStaffSession();
            if (!staff?.role) {
                router.replace("/bakery/staff");
                return;
            }
            if (staff.role !== "admin") {
                router.replace("/bakery/staff/owner");
                return;
            }
            setIsCheckingSession(false);
        };

        checkSession();
    }, [router]);

    const handleLogout = async () => {
        const result = await logoutStaff();
        if (result.success) {
            router.replace("/bakery/staff");
        }
    };

    if (isCheckingSession) {
        return (
            <div className="min-h-screen bg-brand-soft-gray flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-gold-bright" size={42} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-soft-gray">
            <header className="sticky top-0 z-10 border-b border-brand-olive-dark/5 bg-white shadow-sm">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-olive-dark text-brand-gold-bright shadow-lg">
                            <Terminal size={22} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold-bright">VVIP Staff</p>
                            <h2 className="text-xl font-serif font-black leading-none text-brand-olive-dark">Developer Console</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/bakery/staff/owner"
                            className="flex items-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-gray-400 transition-all hover:bg-brand-soft-gray hover:text-brand-olive-dark"
                        >
                            <ArrowLeft size={16} />
                            Owner Portal
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white"
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl p-8 lg:p-12">
                <DeveloperDashboard />
            </main>
        </div>
    );
}
