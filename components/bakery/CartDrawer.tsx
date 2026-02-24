"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

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
                        <div className="p-8 border-b border-brand-olive-dark/5 flex items-center justify-between">
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
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
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
                                        className="text-brand-gold-bright text-sm font-black uppercase tracking-widest hover:underline"
                                    >
                                        Browse Catalog
                                    </button>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        className="flex gap-4 group"
                                    >
                                        <div className="relative w-24 h-24 bg-brand-soft-gray rounded-2xl overflow-hidden flex-shrink-0">
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
                                                <p className="font-black text-brand-gold-bright">₹{item.price * item.quantity}</p>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{item.category}</p>

                                            <div className="flex items-center justify-between pt-1">
                                                <div className="flex items-center bg-brand-soft-gray rounded-lg p-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 text-brand-olive-dark/60 hover:text-brand-olive-dark transition-colors"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-black text-brand-olive-dark">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 text-brand-olive-dark/60 hover:text-brand-olive-dark transition-colors"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="text-gray-300 hover:text-red-500 transition-colors"
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
                            <div className="p-8 border-t border-brand-olive-dark/5 space-y-6 bg-brand-soft-gray/30">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 font-medium">Subtotal</span>
                                        <span className="font-black text-brand-olive-dark">₹{totalPrice}</span>
                                    </div>
                                    <div className="flex justify-between text-base">
                                        <span className="text-brand-olive-dark font-black">Total Price</span>
                                        <span className="font-serif font-black text-2xl text-brand-olive-dark">₹{totalPrice}</span>
                                    </div>
                                </div>

                                <Link
                                    href="/bakery/checkout"
                                    onClick={onClose}
                                    className="w-full bg-brand-olive-dark text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 group text-center"
                                >
                                    Proceed to Checkout
                                    <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />
                                </Link>

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
