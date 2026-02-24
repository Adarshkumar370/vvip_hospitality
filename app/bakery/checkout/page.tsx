"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    MapPin,
    CreditCard,
    ShoppingBag,
    ChevronLeft,
    Plus,
    CheckCircle2,
    Loader2,
    AlertCircle
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getAddresses, addAddress, createRazorpayOrder, verifyRazorpayPayment, placeOrder, completeOrderDummy } from "@/app/bakery/actions";
import { cn } from "@/lib/utils";
import Image from "next/image";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function CheckoutPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { cart, totalPrice, clearCart } = useCart();
    const router = useRouter();

    const [addresses, setAddresses] = useState<any[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push("/bakery");
        }
    }, [user, isAuthLoading, router]);

    useEffect(() => {
        if (user) {
            loadAddresses();
        }
    }, [user]);

    // Load Razorpay Script
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const loadAddresses = async () => {
        if (!user) return;
        setIsLoading(true);
        const res = await getAddresses(user.id);
        if (res.success && res.addresses) {
            const fetchedAddresses = res.addresses as any[];
            setAddresses(fetchedAddresses);
            const defaultAddr = fetchedAddresses.find((a: any) => a.is_default);
            if (defaultAddr) setSelectedAddressId(defaultAddr.id);
            else if (fetchedAddresses.length > 0) setSelectedAddressId(fetchedAddresses[0].id);
        }
        setIsLoading(false);
    };

    const handlePayment = async () => {
        if (!user || !selectedAddressId || cart.length === 0) return;

        setIsProcessing(true);
        setError(null);

        try {
            // 1. Create a "pending" order in our DB
            const itemsPayload = cart.map(item => ({ id: Number(item.id), quantity: item.quantity }));
            const orderRes = await placeOrder(user.id, itemsPayload, totalPrice, selectedAddressId) as any;
            if (!orderRes.success) throw new Error(orderRes.error || "Failed to place order");

            // 2. Dummy Payment Simulation (Skip Razorpay)
            const verifyRes = await completeOrderDummy(orderRes.orderId);

            if (verifyRes.success) {
                clearCart();
                router.push("/bakery/settings?tab=orders");
            } else {
                setError("Dummy payment failed. Please check logs.");
                setIsProcessing(false);
            }
            /* Original Razorpay Flow (Hidden for testing)
            // 2. Create Razorpay Order
            const razorpayRes = await createRazorpayOrder(totalPrice);
            if (!razorpayRes.success) throw new Error(razorpayRes.error || "Failed to initialize payment");

            // 3. Open Razorpay Checkout
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // Ensure this is set in your env
                amount: razorpayRes.amount,
                currency: "INR",
                name: "VVIP Bakery",
                description: "User Order",
                order_id: razorpayRes.orderId,
                handler: async (response: any) => {
                    // 4. Verify Payment
                    const verifyRes = await verifyRazorpayPayment(
                        orderRes.orderId,
                        response.razorpay_order_id,
                        response.razorpay_payment_id,
                        response.razorpay_signature
                    );

                    if (verifyRes.success) {
                        clearCart();
                        router.push("/bakery/settings?tab=orders");
                    } else {
                        setError("Payment verification failed. Please contact support.");
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: user.phone,
                },
                theme: {
                    color: "#344B33", // brand-olive-dark
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
            */
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
            setIsProcessing(false);
        }
    };

    if (isAuthLoading || (isLoading && !addresses.length)) {
        return (
            <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-brand-gold-bright animate-spin mb-4" />
                <p className="text-brand-olive-dark font-black uppercase tracking-widest text-xs">Securing your session...</p>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen pt-32 flex flex-col items-center justify-center px-6">
                <div className="w-24 h-24 bg-brand-soft-gray rounded-full flex items-center justify-center text-gray-300 mb-6">
                    <ShoppingBag size={48} />
                </div>
                <h1 className="text-3xl font-serif font-black text-brand-olive-dark mb-2">Empty Basket</h1>
                <p className="text-gray-500 mb-8 max-w-sm text-center">Your basket is currently empty. Head back to the bakery to add some treats!</p>
                <button
                    onClick={() => router.push("/bakery/order")}
                    className="bg-brand-olive-dark text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-gold-bright transition-all shadow-xl"
                >
                    Back to Bakery
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-screen pt-32 pb-20 bg-brand-soft-gray/30">
            <div className="max-w-7xl mx-auto px-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-brand-olive-dark/60 hover:text-brand-olive-dark transition-colors mb-8 group"
                >
                    <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-black uppercase tracking-widest italic">Return to Basket</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Left Side: Address & Payment */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Address Selection */}
                        <section className="bg-white rounded-[2.5rem] p-10 shadow-premium border border-brand-olive-dark/5">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-soft-gray rounded-2xl flex items-center justify-center text-brand-gold-bright">
                                        <MapPin size={24} />
                                    </div>
                                    <h2 className="text-2xl font-serif font-black text-brand-olive-dark">Delivery Address</h2>
                                </div>
                                <button
                                    onClick={() => router.push("/bakery/settings?tab=addresses")}
                                    className="flex items-center gap-2 px-6 py-3 bg-brand-soft-gray hover:bg-brand-olive-dark hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    <Plus size={16} />
                                    New Address
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addresses.map((addr) => (
                                    <button
                                        key={addr.id}
                                        onClick={() => setSelectedAddressId(addr.id)}
                                        className={cn(
                                            "p-6 rounded-3xl border-2 text-left transition-all relative group",
                                            selectedAddressId === addr.id
                                                ? "border-brand-gold-bright bg-brand-gold-bright/5"
                                                : "border-brand-olive-dark/10 hover:border-brand-olive-dark/30 bg-white"
                                        )}
                                    >
                                        {selectedAddressId === addr.id && (
                                            <div className="absolute top-4 right-4 text-brand-gold-bright">
                                                <CheckCircle2 size={24} />
                                            </div>
                                        )}
                                        <p className="font-black text-brand-olive-dark mb-1">{addr.receiver_name}</p>
                                        <p className="text-xs text-gray-400 font-bold mb-3">{addr.receiver_phone}</p>
                                        <p className="text-sm text-brand-olive-dark/70 leading-relaxed font-medium">
                                            {addr.address_line1}
                                            {addr.address_line2 && `, ${addr.address_line2}`}
                                            <br />
                                            {addr.city} - {addr.pincode}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Payment Method Info */}
                        <section className="bg-white rounded-[2.5rem] p-10 shadow-premium border border-brand-olive-dark/5">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-brand-soft-gray rounded-2xl flex items-center justify-center text-brand-gold-bright">
                                    <CreditCard size={24} />
                                </div>
                                <h2 className="text-2xl font-serif font-black text-brand-olive-dark">Payment Method</h2>
                            </div>

                            <div className="bg-brand-soft-gray/50 rounded-3xl p-6 border border-brand-olive-dark/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center p-1 shadow-sm">
                                            <svg viewBox="0 0 24 24" className="w-full h-full fill-[#3399cc]"><path d="M22.036 12l-5.698-5.706h-3.414l5.698 5.706-5.698 5.707h3.414l5.698-5.707zm-7.698 0l-5.706-5.706H5.218l5.706 5.706-5.706 5.707h3.414l5.706-5.707z" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-black text-brand-olive-dark">Razorpay Secure</p>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Cards, UPI, Netbanking, Wallets</p>
                                        </div>
                                    </div>
                                    <CheckCircle2 className="text-brand-gold-bright" />
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Side: Order Summary */}
                    <div className="lg:col-span-4 space-y-6">
                        <section className="bg-brand-olive-dark text-white rounded-[2.5rem] p-10 shadow-2xl sticky top-32">
                            <h2 className="text-2xl font-serif font-black mb-8 border-b border-white/10 pb-6 uppercase tracking-wider">Order Summary</h2>

                            <div className="space-y-6 mb-10 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black leading-tight italic">{item.name}</p>
                                                <p className="text-[10px] text-white/40 uppercase font-black">x{item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black italic">₹{item.price * item.quantity}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 pt-8 border-t border-white/10">
                                <div className="flex justify-between items-center text-white/60">
                                    <span className="text-xs font-black uppercase tracking-widest">Subtotal</span>
                                    <span className="font-black italic">₹{totalPrice}</span>
                                </div>
                                <div className="flex justify-between items-center text-white/60">
                                    <span className="text-xs font-black uppercase tracking-widest">Delivery</span>
                                    <span className="font-black italic">FREE</span>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-white/20">
                                    <span className="text-lg font-serif font-black italic">Total</span>
                                    <span className="text-3xl font-serif font-black text-brand-gold-bright italic">₹{totalPrice}</span>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-8 p-4 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-xs font-bold text-red-100 italic leading-snug">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handlePayment}
                                disabled={isProcessing || !selectedAddressId}
                                className={cn(
                                    "w-full mt-10 py-5 rounded-2xl font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 italic tracking-wide",
                                    (isProcessing || !selectedAddressId)
                                        ? "bg-gray-500 cursor-not-allowed"
                                        : "bg-white text-brand-olive-dark hover:bg-brand-gold-bright hover:text-brand-olive-dark"
                                )}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Authorize Payment
                                        <CheckCircle2 size={24} />
                                    </>
                                )}
                            </button>

                            {!selectedAddressId && cart.length > 0 && (
                                <p className="mt-4 text-[10px] text-center text-red-400 font-bold uppercase tracking-widest italic animate-pulse">
                                    Please select an address
                                </p>
                            )}

                            <p className="mt-6 text-[10px] text-center text-white/30 uppercase tracking-[0.2em] font-black italic">
                                Secure Transaction via SSL
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
