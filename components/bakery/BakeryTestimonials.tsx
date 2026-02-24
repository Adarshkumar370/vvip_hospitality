"use client";

import { motion } from "framer-motion";
import { VVIP_BAKERY } from "@/lib/constants/bakery";
import { Star, Quote } from "lucide-react";

export default function BakeryTestimonials() {
    return (
        <section className="py-32 px-6 bg-brand-olive-dark relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold-bright/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-20 text-white">
                    <span className="text-brand-gold-bright text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Trust & Partnerships</span>
                    <h2 className="text-4xl md:text-6xl font-serif font-black mb-6 tracking-tight">Partner <span className="text-brand-gold-bright italic text-5xl md:text-7xl">Voices</span></h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {VVIP_BAKERY.testimonials.map((t, idx) => (
                        <motion.div
                            key={t.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-white/5 backdrop-blur-sm p-10 rounded-[3rem] border border-white/10 hover:border-brand-gold-bright/30 transition-colors group"
                        >
                            <div className="flex gap-1 mb-6">
                                {[...Array(t.stars)].map((_, i) => (
                                    <Star key={i} size={16} className="fill-brand-gold-bright text-brand-gold-bright" />
                                ))}
                            </div>
                            <Quote className="text-brand-gold-bright/20 mb-6 group-hover:text-brand-gold-bright/40 transition-colors" size={48} />
                            <p className="text-white/80 text-xl font-serif italic mb-8 leading-relaxed">
                                "{t.review}"
                            </p>
                            <div className="mt-auto">
                                <h4 className="text-white font-black text-lg tracking-tight uppercase">{t.name}</h4>
                                <p className="text-brand-gold-bright text-xs font-black tracking-widest uppercase mt-1">Direct Partner</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
