"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronRight } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants/config";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
    { name: "Home", href: "/" },
    { name: "Olive Stayz", href: "/olive-stayz" },
    { name: "VVIP Bakery", href: "/bakery" },
    { name: "About Us", href: "/about-us" },
    { name: "Contact", href: "/contact" },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
                scrolled
                    ? "bg-white/90 backdrop-blur-md shadow-lg py-3 border-b border-brand-olive-dark/5"
                    : "bg-transparent"
            )}
        >
            <div className="mx-auto flex max-w-7xl items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">

                    <span className={cn(
                        "font-serif text-3xl font-extrabold tracking-tight transition-colors",
                        "text-brand-olive-dark"
                    )}>
                        VVIP <span className="text-brand-gold-bright">HOSPITALITY</span>
                    </span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className={cn(
                                "text-sm font-medium transition-colors hover:text-brand-gold-bright relative group",
                                pathname === link.href ? "text-brand-gold-bright" : "text-brand-olive-dark/70"
                            )}
                        >
                            {link.name}
                            <span className={cn(
                                "absolute -bottom-1 left-0 h-0.5 w-0 bg-brand-gold-bright transition-all group-hover:w-full",
                                pathname === link.href && "w-full"
                            )} />
                        </Link>
                    ))}
                    <Link
                        href="/contact"
                        className="rounded-full bg-brand-olive-dark px-6 py-2.5 text-md font-semibold text-white transition-all hover:bg-brand-gold-bright hover:shadow-lg active:scale-95"
                    >
                        Enquire Now
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-brand-olive-dark"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isOpen}
                >
                    {isOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Nav */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-full left-0 right-0 bg-white shadow-xl md:hidden border-t"
                    >
                        <div className="flex flex-col p-6 gap-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center justify-between p-2 text-lg font-medium border-b border-gray-50",
                                        pathname === link.href ? "text-brand-gold-bright" : "text-brand-olive-dark"
                                    )}
                                >
                                    {link.name}
                                    <ChevronRight size={18} className="text-gray-400" />
                                </Link>
                            ))}
                            <Link
                                href="/contact"
                                onClick={() => setIsOpen(false)}
                                className="mt-4 rounded-xl bg-brand-olive-dark p-4 text-center text-white font-bold"
                            >
                                Get GST Invoice
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
