"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShoppingBag,
    Search,
    Plus,
    Minus,
    ArrowLeft,
    CheckCircle2,
    LayoutGrid,
    ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    unit: string;
    image: string;
    description: string;
    is_available: boolean;
}

interface OrderClientProps {
    initialProducts: Product[];
    initialCategories: string[];
    user: { id: number, name: string };
}

export default function OrderClient({ initialProducts, initialCategories, user: serverUser }: OrderClientProps) {
    const { addToCart, cart, updateQuantity } = useCart();
    
    const [activeCategory, setActiveCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const filteredProducts = initialProducts.filter(product => {
        const matchesCategory = activeCategory === "All" || product.category === activeCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-brand-soft-gray pt-32 pb-20 px-6 overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                    <div className="space-y-4">
                        <Link
                            href="/bakery"
                            className="inline-flex items-center gap-2 text-brand-gold-bright font-black uppercase tracking-widest text-xs hover:gap-3 transition-all"
                        >
                            <ArrowLeft size={16} />
                            Return Hub
                        </Link>
                        <h1 className="text-5xl md:text-7xl font-serif font-black text-brand-olive-dark tracking-tighter leading-none">
                            User <span className="text-brand-gold-bright italic">Catalog</span>
                        </h1>
                        <p className="text-gray-500 font-medium text-lg max-w-xl">
                            Fresh artisanal supplies for <span className="text-brand-olive-dark font-black">{serverUser.name}</span>. Daily cloud-kitchen distribution active.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                    <div className="flex flex-wrap items-center gap-3 bg-white/50 p-3 rounded-[2.5rem] border border-white w-full md:max-w-4xl shadow-sm">
                        {initialCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={cn(
                                    "px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                    activeCategory === cat
                                        ? "bg-brand-olive-dark text-white shadow-lg scale-105"
                                        : "text-brand-olive-dark/40 hover:text-brand-olive-dark hover:bg-white"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-gold-bright transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border-2 border-transparent focus:border-brand-gold-bright/30 outline-none rounded-[2rem] py-4 pl-14 pr-8 text-sm font-bold text-brand-olive-dark shadow-sm transition-all"
                        />
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    <AnimatePresence mode="popLayout">
                        {filteredProducts.map((product, idx) => {
                            const cartItem = cart.find(i => i.id === product.id);
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
                                        "bg-white rounded-[2.5rem] overflow-hidden shadow-premium group border border-white hover:border-brand-gold-bright/20 transition-all flex flex-col h-full",
                                        !isAvailable && "grayscale opacity-75"
                                    )}
                                >
                                    {/* Image Container */}
                                    <div className="h-64 relative bg-brand-soft-gray overflow-hidden">
                                        <Image
                                            src={product.image || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop'}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                                            <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-brand-olive-dark shadow-sm">
                                                {product.category}
                                            </span>
                                            {!isAvailable && (
                                                <span className="bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                                    Out of Stock
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-8 flex flex-col flex-1 gap-6">
                                        <div className="space-y-2">
                                            <h4 className="text-xl font-serif font-black text-brand-olive-dark leading-tight">{product.name}</h4>
                                            {product.description && (
                                                <p className="text-xs text-gray-400 font-medium line-clamp-2 leading-relaxed">
                                                    {product.description}
                                                </p>
                                            )}
                                            <div className="pt-2">
                                                <p className="text-2xl font-black text-brand-gold-bright flex items-baseline gap-2">
                                                    ₹{product.price}
                                                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">/ {product.unit}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-6 border-t border-brand-olive-dark/5 flex items-center justify-between gap-4">
                                            {cartItem ? (
                                                <div className="flex items-center bg-brand-soft-gray rounded-2xl p-1.5 flex-1 justify-between shadow-inner">
                                                    <button
                                                        onClick={() => updateQuantity(product.id, cartItem.quantity - 1)}
                                                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-olive-dark hover:text-brand-gold-bright transition-colors shadow-sm active:scale-90"
                                                    >
                                                        <Minus size={18} />
                                                    </button>
                                                    <span className="font-black text-brand-olive-dark text-lg px-4">{cartItem.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(product.id, cartItem.quantity + 1)}
                                                        disabled={!isAvailable}
                                                        className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand-olive-dark hover:text-brand-gold-bright transition-colors shadow-sm active:scale-90 disabled:opacity-30"
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => addToCart({ ...product })}
                                                    disabled={!isAvailable}
                                                    className="w-full bg-brand-olive-dark text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95 active:bg-brand-gold-bright/80 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
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

                {/* Empty State */}
                {filteredProducts.length === 0 && (
                    <div className="py-32 text-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-gray-200 mx-auto mb-8 shadow-sm">
                            <LayoutGrid size={48} />
                        </div>
                        <h3 className="text-2xl font-serif font-black text-brand-olive-dark mb-2">No items found</h3>
                        <p className="text-gray-500 font-medium mb-8 italic">Try adjusting your filters or search query.</p>
                        <button
                            onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}
                            className="text-brand-gold-bright font-black uppercase tracking-widest text-xs hover:underline"
                        >
                            Clear All Filters
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
