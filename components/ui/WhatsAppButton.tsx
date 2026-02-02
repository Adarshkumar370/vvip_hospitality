"use client";

import { MessageCircle } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { motion } from "framer-motion";

export default function WhatsAppButton() {
    const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\+/g, "").replace(/\s/g, "")}?text=${encodeURIComponent(SITE_CONFIG.whatsappMessage)}`;

    return (
        <motion.a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#128C7E] transition-colors"
            aria-label="Contact on WhatsApp"
        >
            <MessageCircle size={32} />
            <span className="absolute -top-12 right-0 hidden group-hover:block whitespace-nowrap rounded-lg bg-black/80 px-3 py-1 text-xs text-white">
                Book Now
            </span>
        </motion.a>
    );
}
