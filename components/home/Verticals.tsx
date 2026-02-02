"use client";

import { motion } from "framer-motion";
import { Hotel, Utensils, ArrowRight } from "lucide-react";
import Link from "next/link";

export function Verticals() {
    return (
        <section className="py-32 px-6 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-soft-gray rounded-full blur-3xl -mr-32 -mt-32" />

            <div className="mx-auto max-w-7xl relative z-10">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-6xl font-serif font-extrabold mb-6 text-brand-olive-dark">Our Verticals</h2>
                    <div className="h-1.5 w-24 bg-brand-gold-dark mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
                    {/* Olive Stayz Card */}
                    <motion.div
                        whileHover={{ y: -10 }}
                        className="group relative overflow-hidden rounded-[3rem] bg-brand-soft-gray p-10 lg:p-16 flex flex-col justify-between border border-gray-100/50 shadow-sm"
                    >
                        <div className="relative z-10">
                            <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-brand-olive-light mb-10 shadow-sm group-hover:bg-brand-olive-dark group-hover:text-white transition-all duration-500">
                                <Hotel size={40} />
                            </div>
                            <h3 className="text-3xl lg:text-4xl font-serif font-bold mb-6 text-brand-olive-dark">Olive Stayz</h3>
                            <p className="text-gray-600 mb-10 text-lg leading-relaxed font-medium">
                                Boutique accommodations in Kaushambi. Personalized care for corporate and medical long-stays.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                                {["Smart Digital Access", "Accessible Features", "Long-stay Optimized", "Centralized Locations"].map((feature) => (
                                    <div key={feature} className="flex items-center gap-3 text-sm font-bold text-gray-500">
                                        <div className="w-2 h-2 rounded-full bg-brand-gold-bright" />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Link
                            href="/olive-stayz"
                            className="mt-auto group flex items-center gap-3 font-extrabold text-brand-olive-dark hover:text-brand-gold-bright transition-all text-lg"
                        >
                            Explore Rooms
                            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </motion.div>

                    {/* VVIP Bakery Card */}
                    <motion.div
                        whileHover={{ y: -10 }}
                        className="group relative overflow-hidden rounded-[3rem] bg-brand-soft-gray p-10 lg:p-16 flex flex-col justify-between border border-gray-100/50 shadow-sm"
                    >
                        <div className="relative z-10">
                            <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-brand-gold-bright mb-10 shadow-sm group-hover:bg-brand-olive-dark group-hover:text-white transition-all duration-500">
                                <Utensils size={40} />
                            </div>
                            <h3 className="text-3xl lg:text-4xl font-serif font-bold mb-6 text-brand-olive-dark">VVIP Bakery</h3>
                            <p className="text-gray-600 mb-10 text-lg leading-relaxed font-medium">
                                Premier B2B cloud kitchen partner. Delivering gourmet pastries to cafes, restaurants, and corporate events.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
                                {["Gourmet Quality", "Scheduled Logistics", "Custom Curation", "B2B Support"].map((feature) => (
                                    <div key={feature} className="flex items-center gap-3 text-sm font-bold text-gray-500">
                                        <div className="w-2 h-2 rounded-full bg-brand-gold-bright" />
                                        {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Link
                            href="/bakery"
                            className="mt-auto group flex items-center gap-3 font-extrabold text-brand-olive-dark hover:text-brand-gold-bright transition-all text-lg"
                        >
                            B2B Services
                            <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
