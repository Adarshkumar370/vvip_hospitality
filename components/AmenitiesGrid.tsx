"use client";

import { motion } from "framer-motion";
import {
    Wifi,
    Wind,
    Zap,
    Key,
    Utensils,
    Check,
    Laptop,
    Refrigerator
} from "lucide-react";

const iconMap: Record<string, any> = {
    wifi: Wifi,
    refrigerator: Refrigerator,
    wind: Wind,
    key: Key,
    utensils: Utensils,
    check: Check,
    zap: Zap,
    laptop: Laptop,
};

interface Amenity {
    name: string;
    icon: string;
}

interface AmenitiesGridProps {
    amenities: Amenity[];
}

export function AmenitiesGrid({ amenities }: AmenitiesGridProps) {
    return (
        <section className="py-24 px-6 max-w-7xl mx-auto w-full">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-serif font-black text-brand-olive-dark mb-4">
                    All-Inclusive Amenities
                </h2>
                <p className="text-gray-500 font-bold max-w-2xl mx-auto">
                    We've thought of everything so you don't have to. Enjoy a range of premium facilities designed for your comfort.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {amenities.map((amenity, idx) => {
                    const Icon = iconMap[amenity.icon] || Check;
                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            viewport={{ once: true }}
                            className="bg-brand-soft-gray p-8 rounded-3xl flex flex-col items-center text-center group hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-gray-100"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-brand-olive-dark mb-6 group-hover:bg-brand-gold-bright group-hover:text-white transition-all duration-300 shadow-sm">
                                <Icon size={28} />
                            </div>
                            <span className="text-lg font-bold text-brand-olive-dark">{amenity.name}</span>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}
