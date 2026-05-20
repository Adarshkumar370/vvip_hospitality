"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    MapPin,
    CreditCard,
    ShoppingBag,
    ChevronLeft,
    Plus,
    CheckCircle2,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { getAddresses, createRazorpayOrder, verifyRazorpayPayment, placeOrder, validateCartProductLimits } from "@/app/bakery/actions";
import { cn } from "@/lib/utils";
import { RupeeAmount } from "@/components/ui/RupeeAmount";
import Image from "next/image";

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => { open: () => void };
    }
}

interface Address {
    id: string | number;
    receiver_name: string;
    receiver_phone: string;
    address_line1: string;
    address_line2?: string | null;
    city: string;
    pincode: string;
    is_default?: boolean;
}

interface PlaceOrderResult {
    success: boolean;
    error?: string;
    orderId?: string | number;
    paymentMode?: "prepaid" | "postpaid";
}

interface RazorpayVerifyResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

interface RazorpayOptions {
    key?: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: RazorpayVerifyResponse) => Promise<void>;
    prefill: {
        name: string;
        email: string;
        contact: string;
    };
    theme: {
        color: string;
    };
    modal: {
        ondismiss: () => void;
    };
}

export default function CheckoutPage() {
    const { user, isLoading: isAuthLoading } = useAuth();
    const { cart, totalPrice, clearCart } = useCart();
    const router = useRouter();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string | number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isPostpaidUser = user?.payment_type === "postpaid_user";
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"prepaid" | "postpaid">("prepaid");

    useEffect(() => {
        setSelectedPaymentMethod(isPostpaidUser ? "postpaid" : "prepaid");
    }, [isPostpaidUser]);

    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push("/bakery");
        }
    }, [user, isAuthLoading, router]);

    useEffect(() => {
        if (selectedPaymentMethod === "postpaid") return;

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, [selectedPaymentMethod]);

    const loadAddresses = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        const res = await getAddresses(user.id);
        if (res.success && res.addresses) {
            const fetchedAddresses = res.addresses as Address[];
            setAddresses(fetchedAddresses);
            const defaultAddr = fetchedAddresses.find((address) => address.is_default);
            if (defaultAddr) setSelectedAddressId(defaultAddr.id);
            else if (fetchedAddresses.length > 0) setSelectedAddressId(fetchedAddresses[0].id);
        }
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        if (user) {
            void loadAddresses();
        }
    }, [user, loadAddresses]);

    const finalizeOrder = async () => {
        if (!user || !selectedAddressId || cart.length === 0) return;
        const itemsPayload = cart.map((item) => ({ id: item.id, quantity: item.quantity }));
        return placeOrder(user.id, itemsPayload, totalPrice, selectedAddressId, selectedPaymentMethod) as Promise<PlaceOrderResult>;
    };

    const handleCheckout = async () => {
        if (!user || !selectedAddressId || cart.length === 0) return;

        setIsProcessing(true);
        setError(null);

        try {
            const itemsPayload = cart.map((item) => ({ id: item.id, quantity: item.quantity }));
            const dailyLimitRes = await validateCartProductLimits(itemsPayload);
            if (!dailyLimitRes.success) throw new Error(dailyLimitRes.error || "Could not verify daily product limits.");
            if (!dailyLimitRes.allowed) throw new Error(dailyLimitRes.violations[0]?.error || "Daily product limit exceeded.");

            const orderRes = await finalizeOrder();
            if (!orderRes?.success) throw new Error(orderRes?.error || "Failed to place order");

            if (selectedPaymentMethod === "postpaid" && orderRes.paymentMode === "postpaid") {
                clearCart();
                router.push("/bakery/settings?tab=orders");
                return;
            }

            const razorpayRes = await createRazorpayOrder(totalPrice, orderRes.orderId);
            if (!razorpayRes.success) throw new Error(razorpayRes.error || "Failed to initialize payment");
            if (typeof orderRes.orderId !== "string") throw new Error("Invalid order id returned from server");
            const verifiedOrderId = orderRes.orderId;

            const options = {
                key: razorpayRes.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: razorpayRes.amount,
                currency: "INR",
                name: "Swiss Affaire - The Bake Studio",
                description: "User Order",
                order_id: razorpayRes.orderId,
                handler: async (response: RazorpayVerifyResponse) => {
                    const verifyRes = await verifyRazorpayPayment(
                        verifiedOrderId,
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
                    color: "#344B33",
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false);
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred");
            setIsProcessing(false);
        }
    };

    if (isAuthLoading || (isLoading && !addresses.length)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-32">
                <Loader2 className="mb-4 h-12 w-12 animate-spin text-brand-gold-bright" />
                <p className="text-xs font-black uppercase tracking-widest text-brand-olive-dark">Securing your session...</p>
            </div>
        );
    }

    if (cart.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center px-6 pt-32">
                <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-brand-soft-gray text-gray-300">
                    <ShoppingBag size={48} />
                </div>
                <h1 className="mb-2 text-3xl font-serif font-black text-brand-olive-dark">Empty Basket</h1>
                <p className="mb-8 max-w-sm text-center text-gray-500">Your basket is currently empty. Head back to the bakery to add some treats.</p>
                <button
                    onClick={() => router.push("/bakery/order")}
                    className="rounded-2xl bg-brand-olive-dark px-8 py-4 font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-brand-gold-bright"
                >
                    Back to Swiss Affaire
                </button>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-brand-soft-gray/30 pb-20 pt-32">
            <div className="mx-auto max-w-7xl px-6">
                <button
                    onClick={() => router.back()}
                    className="group mb-8 flex items-center gap-2 text-brand-olive-dark/60 transition-colors hover:text-brand-olive-dark"
                >
                    <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                    <span className="text-sm font-black uppercase tracking-widest">Return to Swiss Affaire Basket</span>
                </button>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
                    <div className="space-y-10 lg:col-span-8">
                        <section className="rounded-[2.5rem] border border-brand-olive-dark/5 bg-white p-10 shadow-premium">
                            <div className="mb-8 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft-gray text-brand-gold-bright">
                                        <MapPin size={24} />
                                    </div>
                                    <h2 className="text-2xl font-serif font-black text-brand-olive-dark">Delivery Address</h2>
                                </div>
                                <button
                                    onClick={() => router.push("/bakery/settings?tab=addresses")}
                                    className="flex items-center gap-2 rounded-xl bg-brand-soft-gray px-6 py-3 text-xs font-black uppercase tracking-widest transition-all hover:bg-brand-olive-dark hover:text-white"
                                >
                                    <Plus size={16} />
                                    New Address
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {addresses.map((addr) => (
                                    <button
                                        key={addr.id}
                                        onClick={() => setSelectedAddressId(addr.id)}
                                        className={cn(
                                            "group relative rounded-3xl border-2 p-6 text-left transition-all",
                                            selectedAddressId === addr.id
                                                ? "border-brand-gold-bright bg-brand-gold-bright/5"
                                                : "border-brand-olive-dark/10 bg-white hover:border-brand-olive-dark/30"
                                        )}
                                    >
                                        {selectedAddressId === addr.id && (
                                            <div className="absolute right-4 top-4 text-brand-gold-bright">
                                                <CheckCircle2 size={24} />
                                            </div>
                                        )}
                                        <p className="mb-1 font-black text-brand-olive-dark">{addr.receiver_name}</p>
                                        <p className="mb-3 text-xs font-bold text-gray-400">{addr.receiver_phone}</p>
                                        <p className="text-sm font-medium leading-relaxed text-brand-olive-dark/70">
                                            {addr.address_line1}
                                            {addr.address_line2 && `, ${addr.address_line2}`}
                                            <br />
                                            {addr.city} - {addr.pincode}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-[2.5rem] border border-brand-olive-dark/5 bg-white p-10 shadow-premium">
                            <div className="mb-8 flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft-gray text-brand-gold-bright">
                                    <CreditCard size={24} />
                                </div>
                                <h2 className="text-2xl font-serif font-black text-brand-olive-dark">Payment Method</h2>
                            </div>

                            {isPostpaidUser ? (
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPaymentMethod("prepaid")}
                                        className={cn(
                                            "rounded-3xl border p-6 text-left transition-all",
                                            selectedPaymentMethod === "prepaid"
                                                ? "border-brand-gold-bright bg-brand-gold-bright/5"
                                                : "border-brand-olive-dark/5 bg-brand-soft-gray/50"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-gold-bright shadow-sm">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-brand-olive-dark">Prepaid</p>
                                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                                        Pay now with Razorpay
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedPaymentMethod === "prepaid" && <CheckCircle2 className="text-brand-gold-bright" />}
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setSelectedPaymentMethod("postpaid")}
                                        className={cn(
                                            "rounded-3xl border p-6 text-left transition-all",
                                            selectedPaymentMethod === "postpaid"
                                                ? "border-brand-gold-bright bg-brand-gold-bright/5"
                                                : "border-brand-olive-dark/5 bg-brand-soft-gray/50"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-gold-bright shadow-sm">
                                                    <CreditCard size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-brand-olive-dark">Postpaid</p>
                                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                                        Bill to active credit cycle
                                                    </p>
                                                </div>
                                            </div>
                                            {selectedPaymentMethod === "postpaid" && <CheckCircle2 className="text-brand-gold-bright" />}
                                        </div>
                                    </button>
                                </div>
                            ) : (
                                <div className="rounded-3xl border border-brand-olive-dark/5 bg-brand-soft-gray/50 p-6">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-gold-bright shadow-sm">
                                                <CheckCircle2 size={20} />
                                            </div>
                                            <div>
                                                <p className="font-black text-brand-olive-dark">Prepaid</p>
                                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                                    Cards, UPI, Netbanking, Wallets
                                                </p>
                                            </div>
                                        </div>
                                        <CheckCircle2 className="text-brand-gold-bright" />
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    <div className="space-y-6 lg:col-span-4">
                        <section className="sticky top-32 rounded-[2.5rem] bg-brand-olive-dark p-10 text-white shadow-2xl">
                            <h2 className="border-b border-white/10 pb-6 text-2xl font-serif font-black uppercase tracking-wider">Order Summary</h2>

                            <div className="custom-scrollbar mb-10 mt-8 max-h-60 space-y-6 overflow-y-auto pr-2">
                                {cart.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-white/10">
                                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black leading-tight">{item.name}</p>
                                                <p className="text-[10px] font-black uppercase text-white/40">x{item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black">
                                            <RupeeAmount value={item.price * item.quantity} />
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 border-t border-white/10 pt-8">
                                <div className="flex items-center justify-between text-white/60">
                                    <span className="text-xs font-black uppercase tracking-widest">Subtotal</span>
                                    <RupeeAmount className="font-black" value={totalPrice} />
                                </div>
                                <div className="flex items-center justify-between text-white/60">
                                    <span className="text-xs font-black uppercase tracking-widest">Delivery</span>
                                    <span className="font-black">FREE</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-white/20 pt-4">
                                    <span className="text-lg font-serif font-black">Total</span>
                                    <RupeeAmount className="text-3xl font-serif font-black text-brand-gold-bright" value={totalPrice} />
                                </div>
                            </div>

                            {error && (
                                <div className="mt-8 flex items-start gap-3 rounded-2xl border border-red-500/40 bg-red-500/20 p-4">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
                                    <p className="text-xs font-bold leading-snug text-red-100">{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing || !selectedAddressId}
                                className={cn(
                                    "mt-10 flex w-full items-center justify-center gap-3 rounded-2xl py-5 text-lg font-black shadow-xl transition-all active:scale-95",
                                    isProcessing || !selectedAddressId
                                        ? "cursor-not-allowed bg-gray-500"
                                        : "bg-white text-brand-olive-dark hover:bg-brand-gold-bright"
                                )}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {selectedPaymentMethod === "postpaid" ? "Place Postpaid Order" : "Authorize Payment"}
                                        <CheckCircle2 size={24} />
                                    </>
                                )}
                            </button>

                            {!selectedAddressId && cart.length > 0 && (
                                <p className="mt-4 animate-pulse text-center text-[10px] font-bold uppercase tracking-widest text-red-400">
                                    Please select an address
                                </p>
                            )}

                            <p className="mt-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                                {selectedPaymentMethod === "postpaid" ? "Order will be billed to your active credit cycle" : "Secure Transaction via SSL"}
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </main>
    );
}
