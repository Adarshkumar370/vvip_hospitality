"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { validateCartProductLimits } from "@/app/bakery/actions";
import { RupeeAmount } from "@/components/ui/RupeeAmount";
import Image from "next/image";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onRequireAuth?: (redirectTo: string) => void;
}

export default function CartDrawer({ isOpen, onClose, onRequireAuth }: CartDrawerProps) {
    const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
    const { user, logout } = useAuth();
    const router = useRouter();
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [isCheckingOut, setIsCheckingOut] = useState(false);

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
            onClose();
            onRequireAuth?.("/bakery/checkout");
            return;
        }

        setIsCheckingOut(true);
        const itemsPayload = cart.map((item) => ({ id: item.id, quantity: item.quantity }));

        const dailyLimitRes = await validateCartProductLimits(itemsPayload);
        if (!dailyLimitRes.success) {
            if (dailyLimitRes.error?.toLowerCase().includes("unauthorized")) {
                logout();
                onClose();
                onRequireAuth?.("/bakery/checkout");
                setIsCheckingOut(false);
                return;
            }
            setCheckoutError(dailyLimitRes.error || "Could not verify daily product limits.");
            setIsCheckingOut(false);
            return;
        }
        if (!dailyLimitRes.allowed) {
            setCheckoutError(dailyLimitRes.violations[0]?.error || "Daily product limit exceeded.");
            setIsCheckingOut(false);
            return;
        }

        onClose();
        router.push("/bakery/checkout");
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-brand-olive-dark/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-5 sm:p-8 border-b border-brand-olive-dark/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-brand-soft-gray rounded-xl flex items-center justify-center text-brand-gold-bright">
                                    <ShoppingBag size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-serif font-black text-brand-olive-dark">Your Basket</h2>
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{totalItems} Items</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 text-gray-400 hover:text-brand-olive-dark transition-colors"
                                aria-label="Close basket"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-20 h-20 bg-brand-soft-gray rounded-full flex items-center justify-center text-gray-300">
                                        <ShoppingBag size={40} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-serif font-black text-brand-olive-dark">Empty Basket</h3>
                                        <p className="text-sm text-gray-500 font-medium">Add some treats to get started</p>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="min-h-11 px-4 text-brand-gold-bright text-sm font-black uppercase tracking-widest hover:underline"
                                    >
                                        Browse Catalog
                                    </button>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        className="flex gap-3 sm:gap-4 group"
                                    >
                                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-brand-soft-gray rounded-xl sm:rounded-2xl overflow-hidden flex-shrink-0">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover transition-transform group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between">
                                                <h4 className="font-serif font-black text-brand-olive-dark">{item.name}</h4>
                                                <p className="font-black text-brand-gold-bright">
                                                    <RupeeAmount value={item.price * item.quantity} />
                                                </p>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{item.category}</p>

                                            <div className="flex items-center justify-between pt-1">
                                                <div className="flex items-center bg-brand-soft-gray rounded-xl p-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="flex h-9 w-9 items-center justify-center text-brand-olive-dark/60 hover:text-brand-olive-dark transition-colors"
                                                        aria-label={`Decrease quantity for ${item.name}`}
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        value={String(item.quantity)}
                                                        onChange={(e) => handleQuantityInput(item.id, e.target.value)}
                                                        className="h-9 w-10 bg-transparent text-center text-sm font-black text-brand-olive-dark outline-none"
                                                        aria-label={`Enter quantity for ${item.name}`}
                                                    />
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="flex h-9 w-9 items-center justify-center text-brand-olive-dark/60 hover:text-brand-olive-dark transition-colors"
                                                        aria-label={`Increase quantity for ${item.name}`}
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="flex h-10 w-10 items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                                                    aria-label={`Remove ${item.name} from basket`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        {cart.length > 0 && (
                            <div className="p-5 sm:p-8 border-t border-brand-olive-dark/5 space-y-6 bg-brand-soft-gray/30">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Subtotal</span>
                                        <RupeeAmount className="font-black text-brand-olive-dark" value={totalPrice} />
                                    </div>
                                    <div className="flex items-baseline justify-between gap-4">
                                        <span className="text-brand-olive-dark font-black">Total Price</span>
                                        <RupeeAmount className="font-serif font-black text-2xl text-brand-olive-dark" value={totalPrice} />
                                    </div>
                                </div>

                                {checkoutError && (
                                    <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-50 p-4">
                                        <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />
                                        <p className="text-xs font-bold leading-snug text-red-700">{checkoutError}</p>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleProceedToCheckout}
                                    disabled={isCheckingOut}
                                    className="w-full bg-brand-olive-dark text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 group text-center disabled:cursor-not-allowed disabled:bg-gray-400"
                                >
                                    {isCheckingOut ? (
                                        <>
                                            <Loader2 size={24} className="animate-spin" />
                                            Checking Limit...
                                        </>
                                    ) : (
                                        <>
                                            Proceed to Checkout
                                            <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>

                                <p className="text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold">
                                    Exclusive Partner Pricing Applied
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
