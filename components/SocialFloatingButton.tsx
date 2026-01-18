"use client";

import React, { useState } from "react";
import {
    Instagram,
    Linkedin,
    Facebook,
    MessageCircle,
    X,
    Plus,
    Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const socialLinks = [
    { icon: Instagram, label: "Instagram", href: "https://instagram.com", color: "hover:bg-[#E4405F]" },
    { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com", color: "hover:bg-[#0077B5]" },
    { icon: Facebook, label: "Facebook", href: "https://facebook.com", color: "hover:bg-[#1877F2]" },
    { icon: Mail, label: "Email", href: "mailto:hello@vviphospitality.com", color: "hover:bg-gold" },
];

export default function SocialFloatingButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-center">
            {/* Social Icons List */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, y: 20 }}
                        className="flex flex-col gap-4 mb-4"
                    >
                        {socialLinks.map((link, idx) => (
                            <motion.a
                                key={link.label}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`w-12 h-12 bg-charcoal text-white rounded-full flex items-center justify-center shadow-2xl border border-white/10 transition-all duration-300 ${link.color}`}
                                title={link.label}
                            >
                                <link.icon size={20} />
                            </motion.a>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 transform ${isOpen ? "bg-gold rotate-0" : "bg-charcoal hover:bg-gold"
                    } text-white border border-white/10 group`}
            >
                <motion.div
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {isOpen ? <X size={24} /> : <MessageCircle size={24} className="group-hover:scale-110 transition-transform" />}
                </motion.div>

                {/* Subtle pulse effect when closed */}
                {!isOpen && (
                    <span className="absolute inset-0 rounded-full bg-gold/20 animate-ping -z-10" />
                )}
            </button>
        </div>
    );
}
