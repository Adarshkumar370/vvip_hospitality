"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import * as Dialog from "@radix-ui/react-dialog";
import { FaWhatsapp, FaPhoneAlt, FaBars, FaTimes } from "react-icons/fa";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
    { name: "Home", href: "/olive-stayz" },
    { name: "Rooms", href: "/olive-stayz/rooms" },
    { name: "Facilities", href: "/olive-stayz/facilities" },
    { name: "Gallery", href: "/olive-stayz/gallery" },
    { name: "Contact", href: "/receptionolivestayzk" },
];

export default function OliveStayzHeader() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }

            // Auto-close mobile menu if user scrolls significantly from where they started
            if (isMobileMenuOpen) {
                const scrollDelta = Math.abs(currentScrollY - lastScrollY);
                if (scrollDelta > 80) {
                    setIsMobileMenuOpen(false);
                }
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [isMobileMenuOpen, lastScrollY]);

    // Track scroll position when menu opens
    useEffect(() => {
        if (isMobileMenuOpen) {
            setLastScrollY(window.scrollY);
        }
    }, [isMobileMenuOpen]);

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ease-in-out px-6 md:px-12 bg-white h-20 shadow-sm border-b border-gray-100"
            )}
        >
            <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
                {/* Left: Logo */}
                <Link href="/olive-stayz" className="relative h-12 w-40 flex items-center">
                    <Image
                        src="/images/olive-stayz-logo-new.png"
                        alt="Olive Stayz Logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </Link>

                {/* Center: Desktop Navigation */}
                <NavigationMenu.Root className="hidden md:flex relative z-10">
                    <NavigationMenu.List className="flex gap-8 list-none">
                        {NAV_LINKS.map((link) => (
                            <NavigationMenu.Item key={link.name}>
                                <NavigationMenu.Link asChild>
                                    <motion.div
                                        whileHover={{ scale: 1.05 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                    >
                                        <Link
                                            href={link.href || "#"}
                                            className={cn(
                                                "text-sm font-bold tracking-wide uppercase transition-all relative group text-black",
                                                pathname === link.href && "after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-full after:h-[2px] after:bg-[#C5A04D]"
                                            )}
                                        >
                                            {link.name}
                                        </Link>
                                    </motion.div>
                                </NavigationMenu.Link>
                            </NavigationMenu.Item>
                        ))}
                    </NavigationMenu.List>
                </NavigationMenu.Root>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <a
                            href="https://wa.me/919599519696"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-full transition-all hover:scale-110 text-[#25D366]"
                            title="WhatsApp"
                        >
                            <FaWhatsapp size={24} />
                        </a>
                        <a
                            href="tel:+919599519696"
                            className="p-2 rounded-full transition-all hover:scale-110 text-[#C5A04D]"
                            title="Call Us"
                        >
                            <FaPhoneAlt size={20} />
                        </a>
                    </div>

                    <a
                        href="https://app.mmyt.co/Xm2V/r96ansxl"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            "hidden md:block px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg text-center",
                            "bg-black text-white hover:bg-[#376C34] border-2 border-transparent"
                        )}
                    >
                        Book Now
                    </a>

                    {/* Mobile Hamburger Menu Trigger */}
                    <button
                        className="md:hidden p-2 transition-colors text-black"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="fixed top-[72px] left-6 right-6 bg-white z-[90] flex flex-col p-8 md:hidden shadow-2xl rounded-[2.5rem] border border-gray-100 items-center text-center overflow-hidden"
                    >
                        <nav className="flex flex-col gap-8 w-full">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href || "#"}
                                    className="flex justify-center flex-col items-center group"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <span className={cn(
                                        "text-2xl font-black text-[#1A321A] uppercase tracking-tighter relative px-4 transition-transform group-active:scale-95",
                                        pathname === link.href && "after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[4px] after:bg-[#C5A04D]"
                                    )}>
                                        {link.name}
                                    </span>
                                </Link>
                            ))}
                        </nav>
                        
                        <div className="mt-10 pt-10 border-t border-gray-100 flex flex-col items-center gap-8 w-full">
                            <a 
                                href="https://app.mmyt.co/Xm2V/r96ansxl"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full py-5 bg-[#376C34] text-white font-black uppercase tracking-widest rounded-full shadow-lg active:scale-95 transition-all text-center"
                            >
                                Book Now
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
