"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Activity, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { verifyAdmin } from "@/app/bakery/actions";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const result = await verifyAdmin(email, password);
        if (result.success) {
            router.push("/bakery/admin");
            router.refresh(); // ensure server components re-render with new session
        } else {
            setError(result.error || "Invalid credentials");
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-brand-soft-gray flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 border border-white/20"
            >
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-brand-olive-dark rounded-2xl flex items-center justify-center text-brand-gold-bright mx-auto mb-6 shadow-lg">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-3xl font-serif font-black text-brand-olive-dark tracking-tight mb-2">
                        Admin Portal
                    </h1>
                    <p className="text-gray-500 font-medium italic">Authorized Access Only</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold-bright">
                                <Activity size={20} />
                            </div>
                            <input
                                type="email"
                                placeholder="Admin Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-5 pl-14 pr-6 text-lg font-bold text-brand-olive-dark transition-all"
                            />
                        </div>
                        <div className="relative">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold-bright">
                                <Lock size={20} />
                            </div>
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-5 pl-14 pr-6 text-lg font-bold text-brand-olive-dark transition-all"
                            />
                        </div>
                        {error && (
                            <p className="text-red-500 text-sm font-black text-center tracking-tight">
                                {error}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-brand-olive-dark text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <>Access Dashboard <ArrowRight size={24} /></>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
