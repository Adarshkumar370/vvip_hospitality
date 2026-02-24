"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Lock, ArrowRight, CheckCircle2, Loader2, Smartphone, User, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { checkUser, registerUser, sendOtp, verifyOtp } from "@/app/bakery/actions";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const router = useRouter();
    const { login } = useAuth();
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [step, setStep] = useState<"phone" | "otp" | "signup" | "success">("phone");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [sessionId, setSessionId] = useState("");

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setStep("phone");
            setPhone("");
            setOtp("");
            setName("");
            setEmail("");
            setError("");
        }
    }, [isOpen]);

    const handleSendOtp = async () => {
        if (!phone || phone.length < 10) {
            setError("Please enter a valid 10-digit phone number");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // OTP is sent via a Server Action — the API key never reaches the browser.
            const result = await sendOtp(phone);
            if (result.success) {
                setSessionId(result.sessionId || "");
                setStep("otp");
            } else {
                setError(result.error || "Failed to send OTP. Please try again.");
            }
        } catch {
            setError("Network error. Please check your connection and try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) {
            setError("Please enter the complete 6-digit OTP");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Verification is done via a Server Action — never trust the client.
            const result = await verifyOtp(sessionId, otp);
            if (result.success) {
                await handlePostAuthCheck();
            } else {
                setError(result.error || "Invalid OTP. Please try again.");
            }
        } catch {
            // Never grant access on failure
            setError("Verification failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostAuthCheck = async () => {
        const result = await checkUser(phone);
        if (result.exists && result.user) {
            login(result.user as any);
            onClose();
            router.push("/bakery/order");
        } else {
            setStep("signup");
        }
    };

    const handleSignup = async () => {
        if (!name || !email) {
            setError("Please fill in all details");
            return;
        }

        setIsLoading(true);
        setError("");

        const result = await registerUser(phone, name, email);
        if (result.success && result.user) {
            login(result.user as any);
            onClose();
            router.push("/bakery/order");
        } else {
            setError(result.error || "Signup failed");
        }
        setIsLoading(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-brand-olive-dark/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-white/20"
                    >
                        {/* Dark Header Strip */}
                        <div className="bg-brand-olive-dark h-2 w-full" />

                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-gray-400 hover:text-brand-olive-dark transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="p-10 md:p-12">
                            {step === "phone" && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="space-y-8"
                                >
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-brand-soft-gray rounded-2xl flex items-center justify-center text-brand-gold-bright mx-auto mb-6">
                                            <Smartphone size={32} />
                                        </div>
                                        <h2 className="text-3xl font-serif font-black text-brand-olive-dark tracking-tight mb-2">Welcome Back</h2>
                                        <p className="text-gray-500 font-medium">Enter your mobile number to continue</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                                <Phone size={20} className="text-brand-gold-bright" />
                                                <span className="text-brand-olive-dark font-black border-r border-gray-200 pr-3 ml-1">+91</span>
                                            </div>
                                            <input
                                                type="tel"
                                                maxLength={10}
                                                placeholder="Mobile Number"
                                                value={phone}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, "");
                                                    if (val.length <= 10) setPhone(val);
                                                }}
                                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-5 pl-24 pr-6 text-lg font-bold text-brand-olive-dark transition-all"
                                            />
                                        </div>
                                        {error && <p className="text-red-500 text-sm font-black pl-2 tracking-tight">{error}</p>}
                                    </div>

                                    <button
                                        onClick={handleSendOtp}
                                        disabled={isLoading}
                                        className="w-full bg-brand-olive-dark text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={24} /> : "Send OTP"}
                                        <ArrowRight size={24} />
                                    </button>
                                </motion.div>
                            )}

                            {step === "otp" && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-8"
                                >
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-brand-soft-gray rounded-2xl flex items-center justify-center text-brand-gold-bright mx-auto mb-6">
                                            <Lock size={32} />
                                        </div>
                                        <h2 className="text-3xl font-serif font-black text-brand-olive-dark tracking-tight mb-2">Verify OTP</h2>
                                        <p className="text-gray-500 font-medium">Enter the 6-digit code sent to<br /><span className="text-brand-olive-dark font-black">+{phone}</span></p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <input
                                                type="text"
                                                maxLength={6}
                                                placeholder="000000"
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-5 px-6 text-center text-3xl font-black tracking-[0.5em] text-brand-olive-dark transition-all"
                                            />
                                        </div>
                                        {error && <p className="text-red-500 text-sm font-black text-center tracking-tight">{error}</p>}
                                        <button
                                            onClick={() => setStep("phone")}
                                            className="w-full text-brand-gold-bright text-xs font-black uppercase tracking-widest hover:underline"
                                        >
                                            Change Number
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleVerifyOtp}
                                        disabled={isLoading}
                                        className="w-full bg-brand-olive-dark text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={24} /> : "Verify & Login"}
                                        <ArrowRight size={24} />
                                    </button>
                                </motion.div>
                            )}

                            {step === "signup" && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="space-y-8"
                                >
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-brand-soft-gray rounded-2xl flex items-center justify-center text-brand-gold-bright mx-auto mb-6">
                                            <User size={32} />
                                        </div>
                                        <h2 className="text-3xl font-serif font-black text-brand-olive-dark tracking-tight mb-2">Create Profile</h2>
                                        <p className="text-gray-500 font-medium">Just a few more details to get started</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold-bright">
                                                <User size={20} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="Full Name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-5 pl-14 pr-6 text-lg font-bold text-brand-olive-dark transition-all"
                                            />
                                        </div>
                                        <div className="relative">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-gold-bright">
                                                <Mail size={20} />
                                            </div>
                                            <input
                                                type="email"
                                                placeholder="Email Address"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-brand-soft-gray border-2 border-transparent focus:border-brand-gold-bright/30 focus:bg-white outline-none rounded-2xl py-5 pl-14 pr-6 text-lg font-bold text-brand-olive-dark transition-all"
                                            />
                                        </div>
                                        {error && <p className="text-red-500 text-sm font-black text-center tracking-tight">{error}</p>}
                                    </div>

                                    <button
                                        onClick={handleSignup}
                                        disabled={isLoading}
                                        className="w-full bg-brand-olive-dark text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                    >
                                        {isLoading ? <Loader2 className="animate-spin" size={24} /> : "Complete Signup"}
                                        <ArrowRight size={24} />
                                    </button>
                                </motion.div>
                            )}

                            {step === "success" && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-10"
                                >
                                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-8 shadow-sm">
                                        <CheckCircle2 size={64} />
                                    </div>
                                    <h2 className="text-4xl font-serif font-black text-brand-olive-dark tracking-tight mb-4">Login Successful</h2>
                                    <p className="text-gray-500 font-bold text-lg">Welcome back to VVIP Bakery.</p>
                                </motion.div>
                            )}
                        </div>

                        <div className="bg-brand-soft-gray p-6 text-center">
                            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black">
                                Secure 256-bit Encrypted Authentication
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
