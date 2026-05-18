"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Lock, ArrowRight, CheckCircle2, Loader2, Smartphone, User, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { checkUser, registerUser, verifyFirebaseToken, loginUser } from "@/app/bakery/actions";
import { useAuth } from "@/context/AuthContext";
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase/client";

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
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
    const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
    const recaptchaHostRef = useRef<HTMLDivElement | null>(null);

    const normalizeIndianMobile = (value: string) => value.replace(/\D/g, "").slice(0, 10);
    const toE164IndianMobile = (value: string) => `+91${normalizeIndianMobile(value)}`;
    const maskPhoneForLog = (value: string) => value.replace(/^(\+91)(\d{2})\d{4}(\d{4})$/, "$1$2XXXX$3");

    const clearRecaptcha = () => {
        recaptchaVerifierRef.current?.clear();
        recaptchaVerifierRef.current = null;
        if (recaptchaContainerRef.current) {
            recaptchaContainerRef.current.innerHTML = "";
        }
        recaptchaHostRef.current = null;
    };

    const getRecaptchaVerifier = () => {
        if (recaptchaVerifierRef.current) {
            return recaptchaVerifierRef.current;
        }

        if (!recaptchaContainerRef.current) {
            throw new Error("reCAPTCHA container not found");
        }

        recaptchaContainerRef.current.innerHTML = "";
        const host = document.createElement("div");
        recaptchaContainerRef.current.appendChild(host);
        recaptchaHostRef.current = host;

        const verifier = new RecaptchaVerifier(auth, host, { size: "invisible" });
        recaptchaVerifierRef.current = verifier;
        return verifier;
    };

    useEffect(() => {
        if (!isOpen) {
            setStep("phone");
            setPhone("");
            setOtp("");
            setName("");
            setEmail("");
            setError("");
            setConfirmationResult(null);
            clearRecaptcha();
        }
    }, [isOpen]);

    const handleSendOtp = async () => {
        const normalizedPhone = normalizeIndianMobile(phone);
        if (normalizedPhone.length !== 10) {
            setError("Please enter a valid 10-digit phone number");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const verifier = getRecaptchaVerifier();
            const e164Phone = toE164IndianMobile(normalizedPhone);
            console.info("[Firebase OTP] app context:", {
                origin: window.location.origin,
                hostname: window.location.hostname,
                authDomain: auth.app.options.authDomain,
                projectId: auth.app.options.projectId,
            });
            console.info("[Firebase OTP] sending OTP to:", maskPhoneForLog(e164Phone));
            const result = await signInWithPhoneNumber(auth, e164Phone, verifier);
            setPhone(normalizedPhone);
            setConfirmationResult(result);
            setStep("otp");
        } catch (err: any) {
            if (err?.message?.includes("already been rendered")) {
                clearRecaptcha();
            }
            console.error("[Firebase OTP] sendOtp error:", err.code, err.message);
            if (err.code === "auth/invalid-phone-number") {
                setError("Invalid phone number. Please check and try again.");
            } else if (err.code === "auth/too-many-requests") {
                setError("Too many attempts. Please try again later.");
            } else if (err.code === "auth/operation-not-allowed") {
                setError("Phone sign-in is not enabled. Please contact support.");
            } else if (err.code === "auth/invalid-app-credential") {
                setError("Phone auth app verification failed. Check Firebase authorized domains, API key restrictions, and reCAPTCHA/app verification setup.");
            } else if (err.code === "auth/captcha-check-failed") {
                setError("reCAPTCHA check failed. Please refresh and try again.");
            } else if (err.code === "auth/network-request-failed") {
                setError("Could not reach Google's servers. Disable any ad-blockers and try again, or try in an incognito window.");
            } else {
                setError(`Failed to send OTP (${err.code ?? "unknown"}). Please try again.`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) {
            setError("Please enter the complete 6-digit OTP");
            return;
        }
        if (!confirmationResult) {
            setError("Session expired. Please request a new OTP.");
            setStep("phone");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const credential = await confirmationResult.confirm(otp);
            const idToken = await credential.user.getIdToken();
            const result = await verifyFirebaseToken(idToken, phone);

            if (result.success) {
                await handlePostAuthCheck();
            } else {
                setError(result.error || "Invalid OTP. Please try again.");
            }
        } catch (err: any) {
            if (err.code === "auth/invalid-verification-code") {
                setError("Invalid OTP. Please try again.");
            } else if (err.code === "auth/code-expired") {
                setError("OTP expired. Please request a new one.");
                setStep("phone");
            } else {
                setError("Verification failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handlePostAuthCheck = async () => {
        const result = await loginUser(phone);
        if (result.success && result.user) {
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

                        {/* Invisible reCAPTCHA container */}
                        <div id="recaptcha-container" ref={recaptchaContainerRef} />

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
                                                    const val = normalizeIndianMobile(e.target.value);
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
                                        <p className="text-gray-500 font-medium">Enter the 6-digit code sent to<br /><span className="text-brand-olive-dark font-black">+91 {phone}</span></p>
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
                                            onClick={() => { setStep("phone"); setOtp(""); setError(""); clearRecaptcha(); }}
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
                                    <p className="text-gray-500 font-bold text-lg">Welcome back to Swiss Affaire - The Bake Studio.</p>
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
