"use client";

import { motion } from "framer-motion";
import { VVIP_BAKERY } from "@/lib/constants";
import { ArrowRight, ChefHat, Truck, Award, BadgeCheck, UtensilsCrossed, ExternalLink } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function VVIPBakery() {
    return (
        <div className="flex flex-col bg-white">
            {/* Premium Bakery Hero - Light */}
            <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center bg-brand-soft-gray overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-white -skew-x-12 translate-x-1/4 z-0" />

                <div className="relative z-10 text-center px-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-brand-gold-bright/20 bg-white text-brand-gold-bright text-xs font-black uppercase tracking-[0.2em] mb-10 shadow-sm"
                    >
                        <ChefHat size={16} />
                        B2B Cloud Kitchen Partner
                    </motion.div>
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-8xl font-serif font-black mb-8 text-brand-olive-dark tracking-tight"
                    >
                        {VVIP_BAKERY.name}
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl md:text-3xl text-brand-gold-bright font-serif italic max-w-3xl mx-auto leading-relaxed"
                    >
                        {VVIP_BAKERY.headline}
                    </motion.p>
                </div>

                {/* Decorative Bottom Wave */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-white transform translate-y-1/2 -skew-y-2 border-t border-gray-100/50" />
            </section>

            {/* Services Section */}
            <section className="py-40 px-6 max-w-7xl mx-auto w-full text-brand-olive-dark relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                    <div>
                        <span className="text-brand-gold-bright text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">What We Offer</span>
                        <h2 className="text-4xl md:text-6xl font-serif font-black mb-12 tracking-tight leading-tight">Our Specialized <br /><span className="text-brand-gold-bright italic text-5xl md:text-7xl">B2B Services</span></h2>
                        <div className="space-y-10">
                            {VVIP_BAKERY.services.map((service, idx) => (
                                <motion.div
                                    key={service}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    className="flex gap-8 group"
                                >
                                    <div className="w-16 h-16 rounded-2xl bg-brand-soft-gray flex items-center justify-center text-brand-olive-dark shrink-0 group-hover:bg-brand-olive-dark group-hover:text-white transition-all duration-500 shadow-sm">
                                        <UtensilsCrossed size={28} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-serif font-black mb-2 tracking-tight">{service}</h3>
                                        <p className="text-gray-500 text-base font-medium leading-relaxed">Consistent supply with gourmet quality standards tailored for your business needs.</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-6 bg-brand-gold-bright/5 rounded-[3rem] -z-10 group-hover:bg-brand-gold-bright/10 transition-colors" />
                        <div className="bg-brand-soft-gray rounded-[2.5rem] aspect-[4/5] overflow-hidden relative shadow-2xl border border-white">
                            <Image
                                src="/images/bakery_showcase.png"
                                alt="VVIP Bakery Showcase"
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                        {/* Floating Trusted Marker - Adjusted for Light */}
                        <div className="absolute top-12 -right-8 bg-white border border-gray-100 p-8 rounded-3xl shadow-premium hidden md:block">
                            <div className="flex items-center gap-4 mb-3">
                                <BadgeCheck className="text-brand-gold-bright" size={32} />
                                <span className="font-black text-2xl text-brand-olive-dark leading-none">GST</span>
                            </div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-black leading-none">Registered Partner</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* The VVIP Edge - Light themed */}
            <section className="py-32 px-6 bg-brand-soft-gray relative overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-24">
                        <h2 className="text-5xl md:text-7xl font-serif font-black mb-6 text-brand-olive-dark tracking-tight">The VVIP Edge</h2>
                        <p className="text-gray-500 max-w-2xl mx-auto text-lg font-bold">Why cafes and corporate partners choose our kitchen for their supply chain.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-brand-olive-dark">
                        {VVIP_BAKERY.edge.map((item, idx) => (
                            <div key={item} className="flex flex-col items-center text-center group">
                                <div className="w-24 h-24 rounded-full bg-white border border-gray-100 flex items-center justify-center text-brand-gold-bright mb-10 shadow-sm group-hover:bg-brand-olive-dark group-hover:text-white transition-all duration-500">
                                    {idx === 0 ? <Award size={48} /> : idx === 1 ? <Truck size={48} /> : <BadgeCheck size={48} />}
                                </div>
                                <h3 className="text-3xl font-serif font-black mb-5 tracking-tight">{item}</h3>
                                <p className="text-gray-500 text-base font-bold leading-relaxed">
                                    We maintain peak gourmet quality through strict logistics and custom curation for every client.
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* B2B Catalog CTA - Light themed block */}
            <section className="py-40 px-6">
                <div className="max-w-6xl mx-auto bg-brand-soft-gray p-12 md:p-24 rounded-[4rem] relative overflow-hidden border border-gray-100">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-brand-gold-bright/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

                    <div className="relative z-10 flex flex-col items-center text-center">
                        <h2 className="text-brand-olive-dark text-4xl md:text-7xl font-serif font-black mb-12 leading-tight tracking-tight">
                            Partner with the Best <br />
                            <span className="text-brand-gold-bright italic">Cloud Kitchen</span>
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl">
                            <Link
                                href="/contact"
                                className="flex-1 px-12 py-6 bg-brand-olive-dark text-white font-black rounded-2xl hover:bg-brand-gold-bright transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                            >
                                Become a Partner
                                <ArrowRight size={24} />
                            </Link>
                            <button className="flex-1 px-12 py-6 bg-white border-2 border-brand-olive-dark/10 text-brand-olive-dark font-black rounded-2xl hover:border-brand-gold-bright hover:text-brand-gold-bright transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95">
                                Download Catalog
                                <ExternalLink size={24} />
                            </button>
                        </div>
                        <p className="mt-16 text-gray-400 text-[10px] uppercase tracking-[0.3em] font-black">
                            GST Invoicing & Scheduled Logistics Included
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}
