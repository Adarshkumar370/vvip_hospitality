"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle } from "lucide-react";

export interface StockViolation {
    productId: string;
    productName: string;
    remaining: number;
    unit: string;
    requested: number;
}

interface Props {
    violations: StockViolation[];
    onClose: () => void;
}

export default function StockLimitModal({ violations, onClose }: Props) {
    const outOfStock = violations.filter((v) => v.remaining === 0);
    const limited = violations.filter((v) => v.remaining > 0);

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 12 }}
                    className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl"
                >
                    <div className="mb-6 flex items-start gap-4">
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-serif font-black text-brand-olive-dark">Stock Unavailable</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Some items in your cart have been adjusted due to today&apos;s availability.
                            </p>
                        </div>
                    </div>

                    {outOfStock.length > 0 && (
                        <div className="mb-4">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-red-500">
                                Removed — Out of Stock
                            </p>
                            <ul className="space-y-2">
                                {outOfStock.map((v) => (
                                    <li
                                        key={v.productId}
                                        className="flex items-center justify-between rounded-2xl bg-red-50 px-4 py-3"
                                    >
                                        <span className="text-sm font-black text-brand-olive-dark">{v.productName}</span>
                                        <span className="text-xs font-bold text-red-500">Out of stock</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {limited.length > 0 && (
                        <div className="mb-6">
                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-amber-600">
                                Adjusted — Limited Stock
                            </p>
                            <ul className="space-y-2">
                                {limited.map((v) => (
                                    <li
                                        key={v.productId}
                                        className="flex items-center justify-between rounded-2xl bg-amber-50 px-4 py-3"
                                    >
                                        <span className="text-sm font-black text-brand-olive-dark">{v.productName}</span>
                                        <span className="text-xs font-bold text-amber-600">
                                            {v.remaining} {v.unit} available
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button
                        onClick={onClose}
                        className="mt-2 w-full rounded-2xl bg-brand-olive-dark py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-brand-gold-bright active:scale-95"
                    >
                        OK
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
