"use client";

import { motion } from "framer-motion";
import { VVIP_BAKERY } from "@/lib/constants/bakery";
import { ChefHat, Truck, Award, BadgeCheck, UtensilsCrossed, Briefcase, Wheat } from "lucide-react";
import Image from "next/image";
import BakeryTestimonials from "@/components/bakery/BakeryTestimonials";
import BakeryBackground from "@/components/bakery/BakeryBackground";

const ICON_MAP: Record<string, any> = {
    utensils: UtensilsCrossed,
    briefcase: Briefcase,
    wheat: Wheat,
    award: Award,
    truck: Truck,
    "badge-check": BadgeCheck,
};

export default function VVIPBakery() {
    return (
        <div className="flex flex-col bg-white">
            {/* Premium Bakery Hero - Redesigned */}
            <section className="relative min-h-[100svh] h-auto flex items-center justify-center overflow-hidden py-28 sm:py-32 lg:min-h-[700px]">
                <Image
                    src="/images/bakery_hero_new.png"
                    alt="Swiss Affaire - The Bake Studio Hero"
                    fill
                    priority
                    className="object-cover scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-brand-olive-dark/60 via-brand-olive-dark/40 to-white z-0" />
                
                <div className="relative z-10 text-center px-6 max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-3 px-8 py-3 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-[0.4em] mb-12 shadow-2xl"
                    >
                        <ChefHat size={18} className="text-brand-gold-bright" />
                        B2B Cloud Kitchen Service
                    </motion.div>
                    
                    <motion.h1
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, duration: 0.8 }}
                        className="text-4xl xs:text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-serif font-black mb-10 text-white tracking-tight leading-[0.95] md:leading-[0.9]"
                    >
                        {VVIP_BAKERY.name}
                    </motion.h1>
                    
                    <motion.p
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="text-lg sm:text-xl md:text-3xl lg:text-4xl text-brand-gold-bright font-serif italic max-w-3xl mx-auto leading-relaxed drop-shadow-lg"
                    >
                        {VVIP_BAKERY.headline}
                    </motion.p>

                </div>

                {/* Scroll Indicator */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
                >
                    <span className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">Scroll to Explore</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-brand-gold-bright to-transparent" />
                </motion.div>
            </section>

            {/* Stats / Trust Bar */}
            <section className="relative z-20 -mt-10 md:-mt-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
                <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-premium p-6 py-10 md:p-16 border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 items-center">
                    {(VVIP_BAKERY as any).stats.map((stat: any, idx: number) => (
                        <div key={idx} className="text-center group">
                            <span className="block text-4xl md:text-5xl font-serif font-black text-brand-olive-dark mb-2 group-hover:text-brand-gold-bright transition-colors">{stat.value}</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Services Section - Redesigned */}
            <section className="py-16 sm:py-24 md:py-40 px-6 max-w-7xl mx-auto w-full text-brand-olive-dark relative overflow-hidden">
                <BakeryBackground />
                <div className="flex flex-col lg:flex-row gap-24 items-center">
                    <div className="lg:w-1/2">
                        <span className="text-brand-gold-bright text-[10px] font-black uppercase tracking-[0.4em] mb-6 block">Our Solutions</span>
                        <h2 className="text-3xl sm:text-5xl md:text-7xl font-serif font-black mb-8 sm:mb-12 tracking-tight leading-tight">Artisanal Excellence <br /><span className="text-brand-gold-bright italic text-4xl sm:text-6xl md:text-8xl">In Every Batch</span></h2>
                        <div className="space-y-12">
                            {VVIP_BAKERY.services.map((service, idx) => {
                                const Icon = ICON_MAP[service.icon] || UtensilsCrossed;
                                return (
                                    <motion.div
                                        key={service.title}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        viewport={{ once: true }}
                                        className="flex flex-col sm:flex-row gap-6 sm:gap-10 group"
                                    >
                                        <div className="w-20 h-20 rounded-3xl bg-brand-soft-gray flex items-center justify-center text-brand-olive-dark shrink-0 group-hover:bg-brand-olive-dark group-hover:text-white transition-all duration-500 shadow-sm relative overflow-hidden">
                                            <Icon size={32} className="relative z-10" />
                                            <div className="absolute inset-0 bg-brand-gold-bright scale-0 group-hover:scale-100 transition-transform origin-bottom-right duration-500 opacity-20" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl sm:text-3xl font-serif font-black mb-3 tracking-tight group-hover:text-brand-gold-bright transition-colors">{service.title}</h3>
                                            <p className="text-gray-500 text-base sm:text-lg font-medium leading-relaxed max-w-md">{service.description}</p>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="lg:w-1/2 relative group">
                        <div className="absolute -inset-10 bg-brand-gold-bright/5 rounded-[4rem] -z-10 group-hover:bg-brand-gold-bright/10 transition-colors duration-700" />
                        <div className="bg-brand-soft-gray rounded-[2rem] sm:rounded-[3.5rem] aspect-[4/5] overflow-hidden relative shadow-premium border-8 sm:border-[12px] border-white">
                            <Image
                                src="/images/bakery_showcase.png"
                                alt="Swiss Affaire - The Bake Studio Showcase"
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover group-hover:scale-110 transition-transform duration-1000"
                            />
                            {/* Floating Quality Badge */}
                            <div className="absolute bottom-4 left-4 sm:bottom-10 sm:left-10 bg-white/90 backdrop-blur-xl p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl border border-white/20">
                                <div className="flex items-center gap-4 mb-2">
                                    <Award className="text-brand-gold-bright" size={24} />
                                    <span className="font-black text-lg sm:text-xl text-brand-olive-dark tracking-tight">Premium Grade</span>
                                </div>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Certified Artisanal Kitchen</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* The Swiss Edge - Dark Themed Overlap */}
            <section className="py-16 md:py-32 px-6 bg-brand-olive-dark relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('/images/bakery_background.svg')] bg-repeat bg-[length:1000px_auto] pointer-events-none" />
                
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-16 md:mb-32">
                        <span className="text-brand-gold-bright text-[10px] font-black uppercase tracking-[0.5em] mb-6 block">Why Swiss Affaire - The Bake Studio?</span>
                        <h2 className="text-4xl sm:text-6xl md:text-8xl font-serif font-black mb-8 text-white tracking-tight">The Culinary <span className="text-brand-gold-bright italic">Edge</span></h2>
                        <p className="text-white/60 max-w-2xl mx-auto text-base sm:text-lg md:text-xl font-medium">Elevating your supply chain with precision, quality, and scale.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-24 text-white">
                        {VVIP_BAKERY.edge.map((item, idx) => {
                            const Icon = ICON_MAP[item.icon] || Award;
                            return (
                                <motion.div 
                                    key={item.title} 
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.2 }}
                                    viewport={{ once: true }}
                                    className="flex flex-col items-center text-center group"
                                >
                                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-center text-brand-gold-bright mb-6 sm:mb-12 shadow-2xl group-hover:bg-brand-gold-bright group-hover:text-brand-olive-dark transition-all duration-700 relative overflow-hidden">
                                        <Icon size={40} className="relative z-10 sm:scale-125" />
                                        <div className="absolute top-0 left-0 w-full h-full bg-white scale-0 group-hover:scale-100 transition-transform origin-top-left duration-700 opacity-10" />
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif font-black mb-4 sm:mb-6 tracking-tight text-white group-hover:text-brand-gold-bright transition-colors">{item.title}</h3>
                                    <p className="text-white/70 text-sm sm:text-base md:text-lg font-medium leading-relaxed">
                                        {item.description}
                                    </p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <BakeryTestimonials />

            {/* B2B Catalog CTA - Redesigned */}
            <section className="py-16 sm:py-24 md:py-40 px-6 bg-brand-soft-gray relative overflow-hidden">
                <BakeryBackground />
                <div className="max-w-6xl mx-auto bg-brand-olive-dark p-8 py-16 sm:p-16 md:p-24 lg:p-32 rounded-[2rem] sm:rounded-[4rem] md:rounded-[5rem] relative overflow-hidden border border-white/5 shadow-premium group">
                    <div className="absolute top-0 right-0 w-full h-full bg-[url('/images/bakery_hero_new.png')] opacity-10 object-cover scale-110 group-hover:scale-105 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-olive-dark via-brand-olive-dark/95 to-transparent z-0" />

                    <div className="relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left">
                        <span className="text-brand-gold-bright text-[10px] font-black uppercase tracking-[0.5em] mb-8 block">Ready to start?</span>
                        <h2 className="text-white text-3xl sm:text-5xl md:text-8xl font-serif font-black mb-8 sm:mb-12 md:mb-16 leading-tight tracking-tight max-w-3xl">
                            Partner with the <br />
                            <span className="text-brand-gold-bright italic">Best Cloud Kitchen</span>
                        </h2>
                        
                        <div className="mt-10 sm:mt-16 md:mt-20 flex flex-col sm:flex-row items-center gap-6">
                            <div className="flex -space-x-4">
                                {["SA", "OS", "VH", "BK"].map((label) => (
                                    <div key={label} className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-brand-olive-dark bg-brand-soft-gray text-[10px] font-black text-brand-olive-dark">
                                        {label}
                                    </div>
                                ))}
                            </div>
                            <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-black">
                                Trusted by 50+ Premium Cafes
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
