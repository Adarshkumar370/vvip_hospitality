"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Menu, X, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
    { name: "Home", href: "/" },
    { name: "Olive Stayz", href: "/olive-stayz" },
    { name: "VVIP Bakery", href: "/#vvip-bakery" },
    { name: "About Us", href: "/about" },
];

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
                isScrolled
                    ? "bg-white/95 dark:bg-charcoal/95 backdrop-blur-md shadow-lg py-3 border-b border-border dark:border-white/10"
                    : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <Link href="/" className="group flex items-center gap-2">
                    <span className="text-2xl font-bold text-foreground tracking-tighter transition-colors">
                        VVIP<span className="text-gold group-hover:text-gold/80 transition-colors">HOSPITALITY</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-10">
                    <div className="flex items-center gap-8">
                        {navLinks.map((link, index) => (
                            <motion.div
                                key={link.name}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + index * 0.1 }}
                            >
                                <Link
                                    href={link.href}
                                    className="relative text-sm font-medium text-foreground/70 hover:text-foreground transition-colors group"
                                >
                                    {link.name}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all duration-300 group-hover:w-full" />
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col items-end border-l border-border dark:border-white/10 pl-8"
                    >
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-0.5">
                            Inquiry
                        </span>
                        <a
                            href="tel:+919999000000"
                            className="flex items-center gap-2 text-sm font-bold text-gold hover:text-foreground transition-colors"
                        >
                            <Phone size={12} className="animate-pulse" />
                            +91 9999 000 000
                        </a>
                    </motion.div>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-foreground p-2 hover:bg-muted rounded-full transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="absolute top-full left-0 right-0 bg-background border-t border-border overflow-hidden md:hidden shadow-2xl"
                    >
                        <div className="p-6 flex flex-col gap-4">
                            {navLinks.map((link, index) => (
                                <motion.div
                                    key={link.name}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Link
                                        href={link.href}
                                        className="text-lg font-medium text-foreground/80 hover:text-foreground py-2 block border-b border-border"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.name}
                                    </Link>
                                </motion.div>
                            ))}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="mt-4 p-4 rounded-2xl bg-muted border border-border"
                            >
                                <span className="text-xs text-muted-foreground block mb-1">Direct Inquiry</span>
                                <a href="tel:+919999000000" className="text-xl font-bold text-gold flex items-center gap-2">
                                    <Phone size={18} />
                                    +91 9999 000 000
                                </a>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
