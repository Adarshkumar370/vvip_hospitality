"use client";

import { useState, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    Search,
    Plus,
    Minus,
    ArrowLeft,
    LayoutGrid,
    Wallet,
    Receipt,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { RupeeAmount } from "@/components/ui/RupeeAmount";
import { useCart } from "@/context/CartContext";
import { formatOrderDisplayLabel } from "@/lib/order-display";
import { normalizeCartQuantity } from "@/lib/security-validation";

interface Product {
    id: string | number;
    name: string;
    category: string;
    price: number;
    unit: string;
    image: string;
    description: string;
    is_available: boolean;
}

interface BillingOrderItem {
    id: string | number;
    quantity: number;
    price_at_time: number;
    product_name: string;
}

interface BillingOrder {
    id: string | number;
    order_number?: string;
    total_price: number;
    created_at: string;
    items: BillingOrderItem[];
}

interface BillingSummary {
    paymentType: string;
    isPostpaid: boolean;
    cycle: { start: string; end: string } | null;
    creditLimit: number;
    pendingAmount: number;
    availableCredit: number;
    creditBalance: number;
    billingCycleDay: number | null;
    paymentTermsDays: number | null;
    orders: BillingOrder[];
}

interface OrderClientProps {
    initialProducts: Product[];
    initialCategories: string[];
    user: { id: string | number; name: string };
    billingSummary: BillingSummary | null;
}

export default function OrderClient({ initialProducts, initialCategories, user: serverUser, billingSummary }: OrderClientProps) {
    const { addToCart, cart, updateQuantity } = useCart();
    const isHydrated = useSyncExternalStore(() => () => {}, () => true, () => false);

    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProducts = initialProducts.filter((product) => {
        const matchesCategory = activeCategory === "All" || product.category === activeCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const isPostpaid = billingSummary?.isPostpaid;
    const formatCurrency = (value: number) => (
        <RupeeAmount value={Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} />
    );
    const cycleLabel = billingSummary?.cycle
        ? `${new Date(billingSummary.cycle.start).toLocaleDateString()} to ${new Date(billingSummary.cycle.end).toLocaleDateString()}`
        : null;

    const handleQuantityInput = (product: Product, rawValue: string) => {
        const quantity = normalizeCartQuantity(rawValue);

        if (!quantity) {
            updateQuantity(product.id, 0);
            return;
        }

        const existingCartItem = cart.find((item) => item.id === product.id);

        if (existingCartItem) {
            updateQuantity(product.id, quantity);
            return;
        }

        addToCart(product, quantity);
    };

    return (
        <div className="min-h-screen overflow-x-hidden bg-brand-soft-gray px-4 sm:px-6 pb-16 md:pb-20 pt-28 md:pt-32">
            <div className="mx-auto max-w-7xl space-y-12">
                <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
                    <div className="space-y-4">
                        <Link
                            href="/bakery"
                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-gold-bright transition-all hover:gap-3"
                        >
                            <ArrowLeft size={16} />
                            Swiss Affaire
                        </Link>
                        <h1 className="text-3xl sm:text-5xl font-black leading-none tracking-tighter text-brand-olive-dark md:text-7xl">
                            Swiss Affaire <span className="font-serif italic text-brand-gold-bright">- The Bake Studio</span>
                        </h1>
                        <p className="max-w-xl text-base sm:text-lg font-medium text-gray-500">
                            Fresh artisanal supplies for <span className="font-black text-brand-olive-dark">{serverUser.name}</span>. Daily cloud-kitchen distribution active.
                        </p>
                    </div>
                </div>

                {isPostpaid && billingSummary && (
                    <section className="rounded-[1.5rem] sm:rounded-[2.5rem] border border-white bg-white p-5 sm:p-8 shadow-premium md:p-10">
                        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <div className="mb-3 flex items-center gap-3 text-xs font-black uppercase tracking-[0.2em] text-brand-gold-bright">
                                    <Wallet size={16} />
                                    Postpaid Billing
                                </div>
                                <h2 className="text-3xl font-serif font-black text-brand-olive-dark">Current Billing Cycle</h2>
                                {cycleLabel && <p className="mt-2 text-sm font-bold text-gray-500">{cycleLabel}</p>}
                            </div>
                            <div className="rounded-2xl bg-brand-soft-gray px-5 py-4 text-sm font-bold text-brand-olive-dark">
                                Bill Date: Day {billingSummary.billingCycleDay || 1}
                                <span className="mx-3 text-brand-olive-dark/20">|</span>
                                Cycle: {billingSummary.paymentTermsDays || 30} days
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-[2rem] bg-brand-olive-dark p-6 text-white">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-white/60">Pending Amount</p>
                                <p className="text-3xl font-serif font-black text-brand-gold-bright">{formatCurrency(billingSummary.pendingAmount)}</p>
                            </div>
                            <div className="rounded-[2rem] bg-brand-soft-gray p-6 text-brand-olive-dark">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Available Credit</p>
                                <p className="text-3xl font-serif font-black">{formatCurrency(billingSummary.availableCredit)}</p>
                            </div>
                            <div className="rounded-[2rem] bg-brand-soft-gray p-6 text-brand-olive-dark">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Credit Limit</p>
                                <p className="text-3xl font-serif font-black">{formatCurrency(billingSummary.creditLimit)}</p>
                            </div>
                            {billingSummary.creditBalance > 0 && (
                                <div className="rounded-[2rem] bg-brand-soft-gray p-6 text-brand-olive-dark">
                                    <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-gray-400">Credit Balance</p>
                                    <p className="text-3xl font-serif font-black">{formatCurrency(billingSummary.creditBalance)}</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 rounded-[1.5rem] sm:rounded-[2rem] border border-brand-olive-dark/10 bg-brand-soft-gray/40 p-4 sm:p-6">
                            <div className="mb-5 flex items-center gap-3 text-brand-olive-dark">
                                <Receipt size={18} />
                                <h3 className="text-lg font-black">Cycle Orders</h3>
                            </div>

                            {billingSummary.orders.length === 0 ? (
                                <p className="text-sm font-bold text-gray-500">No postpaid orders in the current cycle yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {billingSummary.orders.map((order) => (
                                        <div key={order.id} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
                                            <div className="mb-4 flex flex-col gap-2 border-b border-brand-olive-dark/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="font-black text-brand-olive-dark">Order {formatOrderDisplayLabel(order)}</p>
                                                    <p className="text-xs font-bold text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                                                </div>
                                                <p className="text-lg font-black text-brand-gold-bright">{formatCurrency(order.total_price)}</p>
                                            </div>

                                            <div className="space-y-3">
                                                {order.items.map((item) => (
                                                    <div key={item.id} className="flex flex-col gap-1 text-sm font-bold text-brand-olive-dark sm:flex-row sm:items-center sm:justify-between">
                                                        <div>
                                                            <span>{item.product_name}</span>
                                                            <span className="ml-2 text-xs text-gray-500">x{item.quantity}</span>
                                                        </div>
                                                        <div className="text-right text-brand-olive-dark/75">
                                                            {formatCurrency(Number(item.price_at_time) * Number(item.quantity))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                <div className="flex flex-col gap-6">
                    <div className="group relative w-full md:ml-auto md:w-96">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-brand-gold-bright" size={20} aria-hidden="true" />
                        <input
                            type="text"
                            placeholder="Search products..."
                            aria-label="Search products"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value.slice(0, 80))}
                            className="w-full rounded-[2rem] border-2 border-transparent bg-white py-4 pl-14 pr-8 text-sm font-bold text-brand-olive-dark shadow-sm outline-none transition-all focus:border-brand-gold-bright/30"
                        />
                    </div>

                    <div className="w-full rounded-[1.75rem] sm:rounded-[2rem] border border-white bg-white/50 p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-2.5">
                            {initialCategories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={cn(
                                        "whitespace-nowrap rounded-full px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                                        activeCategory === cat
                                            ? "scale-105 bg-brand-olive-dark text-white shadow-lg"
                                            : "bg-white/60 text-brand-olive-dark/70 hover:bg-white hover:text-brand-olive-dark hover:shadow-sm"
                                    )}
                                    aria-pressed={activeCategory === cat}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.map((product, idx) => {
                            const cartItem = isHydrated ? cart.find((i) => i.id === product.id) : undefined;
                            const isAvailable = product.is_available !== false;

                            return (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={cn(
                                        "flex h-full flex-col overflow-hidden rounded-[1.5rem] sm:rounded-[2.5rem] border border-white bg-white shadow-premium transition-all group hover:border-brand-gold-bright/20",
                                        !isAvailable && "grayscale opacity-75"
                                    )}
                                >
                                    <div className="relative h-48 sm:h-64 overflow-hidden bg-brand-soft-gray">
                                        <Image
                                            src={product.image || "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop"}
                                            alt={product.name}
                                            fill
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute left-6 top-6 flex flex-col gap-2">
                                            <span className="rounded-full bg-white/90 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-brand-olive-dark shadow-sm backdrop-blur-md">
                                                {product.category}
                                            </span>
                                            {!isAvailable && (
                                                <span className="rounded-full bg-red-500 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                                                    Out of Stock
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-1 flex-col gap-4 sm:gap-6 p-5 sm:p-8">
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-serif font-black leading-tight text-brand-olive-dark">{product.name}</h4>
                                            {product.description && (
                                                <p className="line-clamp-2 text-xs font-medium leading-relaxed text-gray-600">{product.description}</p>
                                            )}
                                            <div className="pt-2">
                                                <p className="flex items-baseline gap-2 text-2xl font-black text-brand-gold-bright">
                                                    <RupeeAmount value={product.price} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">/ {product.unit}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-center justify-between gap-4 border-t border-brand-olive-dark/5 pt-6">
                                            {cartItem ? (
                                                <div className="flex flex-1 items-center justify-between rounded-2xl bg-brand-soft-gray p-1.5 shadow-inner">
                                                    <button
                                                        onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                                                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-olive-dark shadow-sm transition-colors active:scale-90 hover:text-brand-gold-bright"
                                                        aria-label={`Decrease quantity for ${product.name}`}
                                                    >
                                                        <Minus size={18} aria-hidden="true" />
                                                    </button>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        value={String(cartItem.quantity)}
                                                        onKeyDown={(e) => {
                                                            const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
                                                            if (!allowed.includes(e.key) && !/^[0-9]$/.test(e.key)) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        onChange={(e) => handleQuantityInput(product, e.target.value)}
                                                        disabled={!isAvailable}
                                                        className="w-20 bg-transparent px-4 text-center text-lg font-black text-brand-olive-dark outline-none disabled:text-gray-400"
                                                        aria-label={`Enter quantity for ${product.name}`}
                                                    />
                                                    <button
                                                        onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                                                        disabled={!isAvailable}
                                                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-brand-olive-dark shadow-sm transition-colors active:scale-90 hover:text-brand-gold-bright disabled:opacity-30"
                                                        aria-label={`Increase quantity for ${product.name}`}
                                                    >
                                                        <Plus size={18} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => addToCart({ ...product })}
                                                    disabled={!isAvailable}
                                                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-brand-olive-dark py-4 text-sm font-black text-white shadow-xl transition-all active:scale-95 active:bg-brand-gold-bright/80 hover:bg-brand-gold-bright disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                                                >
                                                    <ShoppingBag size={18} />
                                                    {isAvailable ? "Add to Basket" : "Not Available"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {filteredProducts.length === 0 && (
                    <div className="py-32 text-center">
                        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white text-gray-200 shadow-sm">
                            <LayoutGrid size={48} />
                        </div>
                        <h3 className="mb-2 text-2xl font-serif font-black text-brand-olive-dark">No items found</h3>
                        <p className="mb-8 text-gray-500">Try adjusting your filters or search query.</p>
                        <button
                            onClick={() => {
                                setActiveCategory("All");
                                setSearchQuery("");
                            }}
                            className="text-xs font-black uppercase tracking-widest text-brand-gold-bright hover:underline"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
