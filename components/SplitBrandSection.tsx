"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const brands = [
    {
        id: "olive-stayz",
        title: "Olive Stayz",
        subtitle: "Smart Stays for the Modern Traveler.",
        description: "Experience premium comfort without the premium price tag. Our properties are designed for the modern business traveler and leisure seeker alike.",
        image: "/images/olive_stayz_room_1768770065041.png",
        points: [
            "High-speed Wi-Fi (200 Mbps+)",
            "Smart TVs with Netflix/Prime",
            "Proximity to Advant & Oxygen Business Parks",
            "24/7 Power Backup & Security",
        ],
        buttonText: "Explore Rooms",
        href: "/olive-stayz",
        accentColor: "text-olive",
        bgAccent: "bg-olive",
        reverse: false,
    },
    {
        id: "vvip-bakery",
        title: "VVIP Bakery",
        subtitle: "Your Premier B2B Cloud Kitchen Partner.",
        description: "We provide consistent, high-quality bakery solutions for cafes, restaurants, and corporate clients across the region.",
        image: "/images/vvip_bakery_kitchen_1768770081695.png",
        points: [
            "Bulk supply for cafes & restaurants",
            "Consistent gourmet quality",
            "Efficient B2B delivery network",
            "Customized menus for corporate events",
        ],
        buttonText: "Inquire for Supply",
        href: "/#corporate",
        accentColor: "text-gold",
        bgAccent: "bg-gold",
        reverse: true,
    },
];

export default function SplitBrandSection() {
    return (
        <section className="relative py-24 bg-background overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute inset-0 z-0 bg-pattern opacity-[0.03] dark:opacity-[0.05]" />
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {brands.map((brand, index) => (
                    <div
                        key={brand.id}
                        id={brand.id}
                        className={cn(
                            "flex flex-col lg:flex-row items-center gap-12 lg:gap-24 mb-24 last:mb-0",
                            brand.reverse && "lg:flex-row-reverse"
                        )}
                    >
                        {/* Image Side */}
                        <motion.div
                            initial={{ opacity: 0, x: brand.reverse ? 50 : -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="w-full lg:w-1/2"
                        >
                            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden group shadow-2xl">
                                <Image
                                    src={brand.image}
                                    alt={brand.title}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                            </div>
                        </motion.div>

                        {/* Content Side */}
                        <motion.div
                            initial={{ opacity: 0, x: brand.reverse ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                            className="w-full lg:w-1/2"
                        >
                            <p className={cn("text-lg font-bold tracking-widest uppercase mb-4", brand.accentColor)}>
                                {brand.title}
                            </p>
                            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-foreground">
                                {brand.subtitle}
                            </h2>
                            <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-medium">
                                {brand.description}
                            </p>

                            <ul className="space-y-4 mb-10">
                                {brand.points.map((point) => (
                                    <li key={point} className="flex items-center gap-3">
                                        <div className={cn("p-1 rounded-full", brand.bgAccent, "bg-opacity-10 text-brand")}>
                                            <CheckCircle2 className={brand.accentColor} size={18} />
                                        </div>
                                        <span className="text-foreground font-semibold">{point}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={brand.href}
                                className={cn(
                                    "inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all shadow-xl hover:shadow-2xl active:scale-95 group",
                                    brand.bgAccent,
                                    "text-white"
                                )}
                            >
                                {brand.buttonText}
                                <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
                            </Link>
                        </motion.div>
                    </div>
                ))}
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </section>
    );
}
