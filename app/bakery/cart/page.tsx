"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    ChevronLeft,
    Minus,
    Plus,
    Trash2,
    ArrowRight,
    Loader2,
    AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { validateCartProductLimits } from "@/app/bakery/actions";
import { RupeeAmount } from "@/components/ui/RupeeAmount";
import { getSafeImageSrc } from "@/lib/image-utils";
import StockLimitModal, { StockViolation } from "@/components/bakery/StockLimitModal";

export default function CartPage() {
    const router = useRouter();
    const { cart, removeFromCart, updateQuantity, clearCart, totalPrice, totalItems } = useCart();
    const { user, logout } = useAuth();

    const isHydrated = useSyncExternalStore(() => () => {}, () => true, () => false);

    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [stockViolations, setStockViolations] = useState<StockViolation[]>([]);

    const handleQuantityInput = (itemId: string | number, rawValue: string) => {
        const quantity = Number(rawValue);
        if (!rawValue || Number.isNaN(quantity) || quantity <= 0) {
            updateQuantity(itemId, 0);
            return;
        }
        updateQuantity(itemId, Math.floor(quantity));
    };

    const handleProceedToCheckout = async () => {
        setCheckoutError(null);

        if (!user) {
            router.push("/bakery?login=1&next=/bakery/checkout");
            return;
        }

        setIsCheckingOut(true);
        const itemsPayload = cart.map((item) => ({ id: item.id, quantity: item.quantity }));

        const dailyLimitRes = await validateCartProductLimits(itemsPayload);

        if (!dailyLimitRes.success) {
            if (dailyLimitRes.error?.toLowerCase().includes("unauthorized")) {
                logout();
                router.push("/bakery?login=1&next=/bakery/checkout");
                return;
            }
            if (dailyLimitRes.error?.toLowerCase().includes("invalid cart")) {
                clearCart();
                setCheckoutError("Your cart had corrupted data and has been cleared. Please add items again.");
                setIsCheckingOut(false);
                return;
            }
            setCheckoutError(dailyLimitRes.error || "Could not verify daily product limits.");
            setIsCheckingOut(false);
            return;
        }

        if (!dailyLimitRes.allowed) {
            const orderingViolation = dailyLimitRes.violations.find((v) => v.productId === "ordering_window");
            if (orderingViolation) {
                setCheckoutError(orderingViolation.error);
                setIsCheckingOut(false);
                return;
            }
            dailyLimitRes.violations.forEach((v) => {
                if (v.remaining === 0) {
                    removeFromCart(v.productId);
                } else {
                    updateQuantity(v.productId, v.remaining);
                }
            });
            setStockViolations(dailyLimitRes.violations);
            setIsCheckingOut(false);
            return;
        }

        router.push("/bakery/checkout");
    };

    const hydratedCart = isHydrated ? cart : [];
    const hydratedTotal = isHydrated ? totalPrice : 0;
    const hydratedItems = isHydrated ? totalItems : 0;

    return (
        <>
            {stockViolations.length > 0 && (
                <StockLimitModal
                    violations={stockViolations}
                    onClose={() => setStockViolations([])}
                />
            )}

            <div className="min-h-screen bg-brand-soft-gray/40 pb-40 pt-24">
                {/* Page header */}
                <div className="sticky top-16 z-10 bg-white/90 backdrop-blur-xl border-b border-brand-olive-dark/5 px-4 py-4 sm:px-6">
                    <div className="mx-auto max-w-2xl flex items-center justify-between gap-4">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-brand-olive-dark/60 hover:text-brand-olive-dark transition-colors group"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">Back</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-brand-soft-gray rounded-xl flex items-center justify-center text-brand-gold-bright">
                                <ShoppingBag size={16} />
                            </div>
                            <div>
                                <h1 className="text-base font-serif font-black text-brand-olive-dark leading-none">Your Basket</h1>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">
                                    {hydratedItems} {hydratedItems === 1 ? "item" : "items"}
                                </p>
                            </div>
                        </div>
                        <div className="w-16" />
                    </div>
                </div>

                <div className="mx-auto max-w-2xl px-4 sm:px-6 mt-6 space-y-3">
                    {/* Empty state */}
                    {hydratedCart.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-20 text-center space-y-5"
                        >
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-200 shadow-sm">
                                <ShoppingBag size={48} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-serif font-black text-brand-olive-dark">Empty Basket</h2>
                                <p className="mt-1 text-sm text-gray-500">Add some treats to get started</p>
                            </div>
                            <button
                                onClick={() => router.push("/bakery/order")}
                                className="mt-2 px-8 py-4 rounded-2xl bg-brand-olive-dark text-white font-black text-sm uppercase tracking-widest hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95"
                            >
                                Browse Catalog
                            </button>
                        </motion.div>
                    )}

                    {/* Cart items */}
                    <AnimatePresence mode="popLayout">
                        {hydratedCart.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 40, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex gap-4 shadow-sm"
                            >
                                {/* Image */}
                                <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-brand-soft-gray">
                                    <Image
                                        src={getSafeImageSrc(item.image)}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        sizes="96px"
                                    />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <h3 className="font-serif font-black text-brand-olive-dark leading-tight truncate">{item.name}</h3>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-0.5">{item.category}</p>
                                        </div>
                                        <p className="font-black text-brand-gold-bright whitespace-nowrap flex-shrink-0">
                                            <RupeeAmount value={item.price * item.quantity} />
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        {/* Qty stepper */}
                                        <div className="flex items-center bg-brand-soft-gray rounded-xl p-1">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-olive-dark/60 hover:text-brand-olive-dark hover:bg-white transition-all active:scale-90"
                                                aria-label={`Decrease quantity for ${item.name}`}
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                value={String(item.quantity)}
                                                onKeyDown={(e) => {
                                                    const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight"];
                                                    if (!allowed.includes(e.key) && !/^[0-9]$/.test(e.key)) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                                                className="h-8 w-10 bg-transparent text-center text-sm font-black text-brand-olive-dark outline-none"
                                                aria-label={`Quantity for ${item.name}`}
                                            />
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-olive-dark/60 hover:text-brand-olive-dark hover:bg-white transition-all active:scale-90"
                                                aria-label={`Increase quantity for ${item.name}`}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        {/* Unit price */}
                                        <div className="flex items-center gap-3">
                                            <p className="text-xs text-gray-400 font-medium">
                                                <RupeeAmount value={item.price} /> each
                                            </p>
                                            <button
                                                onClick={() => removeFromCart(item.id)}
                                                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                aria-label={`Remove ${item.name} from basket`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Sticky checkout footer */}
            {hydratedCart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-brand-olive-dark/5 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] px-4 pt-4 pb-6 sm:px-6">
                    <div className="mx-auto max-w-2xl space-y-4">
                        <div className="flex items-baseline justify-between">
                            <span className="text-sm text-gray-500 font-medium">Total</span>
                            <RupeeAmount className="text-2xl font-serif font-black text-brand-olive-dark" value={hydratedTotal} />
                        </div>

                        {checkoutError && (
                            <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-50 px-4 py-3">
                                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                                <p className="text-xs font-bold leading-snug text-red-700">{checkoutError}</p>
                            </div>
                        )}

                        <button
                            onClick={handleProceedToCheckout}
                            disabled={isCheckingOut}
                            className="w-full flex items-center justify-center gap-3 bg-brand-olive-dark text-white py-5 rounded-2xl font-black text-base uppercase tracking-wider hover:bg-brand-gold-bright transition-all shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-400 group"
                        >
                            {isCheckingOut ? (
                                <>
                                    <Loader2 size={22} className="animate-spin" />
                                    Checking availability...
                                </>
                            ) : (
                                <>
                                    Proceed to Checkout
                                    <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-[10px] text-gray-400 font-black uppercase tracking-widest">
                            Exclusive Partner Pricing Applied
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}
