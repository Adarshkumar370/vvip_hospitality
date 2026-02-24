"use client";

import { motion } from "framer-motion";
import { OLIVE_STAYZ } from "@/lib/constants/stayz";
import { Check, Info, ShieldCheck, Accessibility, Laptop, Wifi, Wind, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";

const AmenitiesGrid = dynamic(() => import("@/components/AmenitiesGrid").then(mod => mod.AmenitiesGrid));
const FAQSection = dynamic(() => import("@/components/FAQSection").then(mod => mod.FAQSection));
const TestimonialsSection = dynamic(() => import("@/components/TestimonialsSection").then(mod => mod.TestimonialsSection));
const PropertyRules = dynamic(() => import("@/components/PropertyRules").then(mod => mod.PropertyRules));

const iconMap: Record<string, any> = {
    zap: Zap,
    refrigerator: Laptop,
    "battery-charging": ShieldCheck,
    key: Wifi,
};

export default function OliveStayz() {
    return (
        <div className="flex flex-col bg-white">
            {/* Mini Hero - Light & Airy */}
            <section className="relative h-[45vh] min-h-[400px] flex items-center justify-center bg-brand-soft-gray overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-brand-gold-bright/10 rounded-full blur-3xl -ml-32 -mt-32" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-olive-light/5 rounded-full blur-3xl -mr-48 -mb-48" />

                <div className="relative z-10 text-center px-6">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1 rounded-full bg-white text-brand-gold-bright text-[10px] font-black uppercase tracking-[0.2em] mb-6 shadow-sm border border-gray-100"
                    >
                        Premium Accommodations
                    </motion.span>
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-serif font-black mb-8 text-brand-olive-dark tracking-tight"
                    >
                        {OLIVE_STAYZ.name}
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto font-medium leading-relaxed"
                    >
                        {OLIVE_STAYZ.description}
                    </motion.p>
                </div>
            </section>

            {/* Room Selection */}
            <section className="py-32 px-6 max-w-7xl mx-auto w-full">
                <div className="mb-20">
                    <h2 className="text-4xl md:text-5xl font-serif font-black mb-6 text-brand-olive-dark flex items-center gap-6">
                        Our Room Collection
                        <div className="h-px flex-1 bg-gray-100" />
                    </h2>
                    <p className="text-gray-500 text-lg font-medium">Designed for comfort, optimized for long stays.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
                    {OLIVE_STAYZ.rooms.map((room, idx) => (
                        <motion.div
                            key={room.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="flex flex-col bg-white rounded-[3rem] overflow-hidden shadow-premium border border-gray-50 hover:shadow-2xl transition-all duration-500"
                        >
                            <div className="h-80 bg-brand-soft-gray relative group">
                                <Image
                                    src={room.image}
                                    alt={room.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-brand-olive-dark shadow-xl">
                                    {room.view}
                                </div>
                            </div>
                            <div className="p-10 lg:p-14 flex flex-col flex-1">
                                <div className="flex justify-between items-start mb-10">
                                    <div>
                                        <h3 className="text-3xl font-serif font-black text-brand-olive-dark mb-2">{room.name}</h3>
                                        <p className="text-xs text-brand-gold-bright font-black uppercase tracking-[0.2em]">{room.bestFor}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] uppercase font-black text-gray-300 block mb-1">Occupancy</span>
                                        <span className="font-bold text-brand-olive-dark text-lg">{room.occupancy}</span>
                                    </div>
                                </div>

                                <div className="space-y-6 mb-12 flex-1">
                                    <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-[0.3em]">Key Amenities</h4>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                        {room.amenities.map(amenity => (
                                            <div key={amenity} className="flex items-center gap-3 text-sm text-gray-600 font-bold">
                                                <div className="w-8 h-8 rounded-lg bg-brand-gold-bright/10 flex items-center justify-center text-brand-gold-bright shrink-0">
                                                    <Check size={14} />
                                                </div>
                                                {amenity}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Link href="/contact" className="w-full py-5 text-center rounded-2xl bg-brand-olive-dark text-white font-black text-lg hover:bg-brand-gold-bright transition-all shadow-lg active:scale-95">
                                    Check Availability
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Why Olive Stayz (USPs) - Light Themed */}
            <section className="py-32 px-6 bg-brand-soft-gray overflow-hidden relative">
                <div className="absolute inset-0 bg-white/30 backdrop-blur-3xl" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-24">
                        <span className="text-brand-gold-bright text-xs font-black uppercase tracking-[0.4em] mb-6 block">Why Stay With Us?</span>
                        <h2 className="text-5xl md:text-7xl font-serif font-black text-brand-olive-dark tracking-tight">Why Olive Stayz</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                        {OLIVE_STAYZ.usps.map((usp, idx) => {
                            const Icon = iconMap[usp.icon] || Zap;
                            return (
                                <motion.div
                                    key={usp.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    className="bg-white p-10 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 group"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-brand-soft-gray flex items-center justify-center text-brand-olive-dark mb-10 group-hover:bg-brand-gold-bright group-hover:text-white transition-all duration-500">
                                        <Icon size={32} />
                                    </div>
                                    <h3 className="text-2xl font-serif font-black mb-4 text-brand-olive-dark tracking-tight">{usp.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed font-bold">{usp.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Amenities Grid */}
            <AmenitiesGrid amenities={OLIVE_STAYZ.amenitiesList} />

            {/* Specialized Care */}
            <section className="py-32 px-6 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                    <div className="relative rounded-[3rem] overflow-hidden aspect-square bg-brand-soft-gray shadow-premium">
                        <Image
                            src="/images/specialized_care.png"
                            alt="Specialized Medical Care"
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <h2 className="text-4xl md:text-5xl font-serif font-black mb-10 text-brand-olive-dark tracking-tight leading-tight">{OLIVE_STAYZ.medicalCare.title}</h2>
                        <p className="text-gray-600 mb-12 text-lg leading-relaxed font-medium">
                            We specialize in providing comfortable, accessible accommodations for patients and families visiting local medical centers.
                        </p>

                        <div className="flex flex-wrap gap-4 mb-14">
                            {OLIVE_STAYZ.medicalCare.focus.map(hosp => (
                                <span key={hosp} className="px-6 py-3 rounded-xl bg-red-50 text-red-700 text-xs font-black flex items-center gap-3 border border-red-100 shadow-sm">
                                    <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                                    Near {hosp}
                                </span>
                            ))}
                        </div>

                        <div className="space-y-6">
                            {OLIVE_STAYZ.medicalCare.features.map(f => (
                                <div key={f} className="flex items-center gap-6 text-brand-olive-dark font-black text-lg">
                                    <div className="w-12 h-12 rounded-full bg-brand-soft-gray flex items-center justify-center shrink-0 border border-gray-100">
                                        <Check size={24} className="text-brand-gold-bright" />
                                    </div>
                                    {f}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <FAQSection items={OLIVE_STAYZ.faqs} />

            {/* Testimonials */}
            <TestimonialsSection testimonials={OLIVE_STAYZ.testimonials} />

            {/* Dining & Kitchen - Light */}
            <section className="py-32 px-6 bg-brand-soft-gray rounded-[5rem] mx-6 mb-24 overflow-hidden relative">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-20">
                        <div className="max-w-2xl">
                            <h2 className="text-4xl md:text-6xl font-serif font-black mb-8 text-brand-olive-dark tracking-tight">{OLIVE_STAYZ.dining.title}</h2>
                            <p className="text-gray-600 text-lg leading-relaxed font-bold">
                                Food is heart. We provide a fully equipped common kitchen for home-cooked meals, while also supporting room delivery and in-house dining options.
                            </p>
                        </div>
                        <Link href="/contact" className="px-12 py-5 bg-brand-olive-dark text-white font-black rounded-full hover:bg-brand-gold-bright transition-all shadow-xl active:scale-95">
                            Inquire Dining
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {OLIVE_STAYZ.dining.features.map((f, idx) => (
                            <div key={f} className="bg-white p-12 rounded-[2.5rem] shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col h-full group">
                                <div className="text-brand-gold-bright mb-10 font-serif text-5xl font-black opacity-30 group-hover:opacity-100 transition-opacity">0{idx + 1}</div>
                                <h3 className="text-2xl font-serif font-black mb-8 text-brand-olive-dark tracking-tight leading-tight">{f}</h3>
                                <div className="mt-auto pt-8">
                                    <div className="bg-brand-soft-gray rounded-2xl aspect-video relative overflow-hidden border border-gray-100 shadow-inner">
                                        <Image
                                            src="/images/dining_area.png"
                                            alt="Dining Detail"
                                            fill
                                            sizes="(max-width: 768px) 100vw, 33vw"
                                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Property Rules */}
            <PropertyRules rules={OLIVE_STAYZ.rules} />

            {/* CTA Section - Light & Powerful */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-5xl mx-auto bg-white p-14 md:p-24 rounded-[4rem] shadow-2xl relative overflow-hidden border border-gray-100">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold-bright/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand-olive-light/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

                    <h2 className="text-4xl md:text-7xl font-serif font-black mb-12 relative z-10 text-brand-olive-dark tracking-tight leading-tight">
                        Ready to Book Your <br />
                        <span className="text-brand-gold-bright italic">Stay with VVIP?</span>
                    </h2>
                    <Link
                        href="/contact"
                        className="inline-block px-16 py-6 bg-brand-olive-dark text-white font-black rounded-full text-xl hover:bg-brand-gold-bright transition-all shadow-xl relative z-10 active:scale-95"
                    >
                        Contact Team
                    </Link>
                </div>
            </section>
        </div>
    );
}
