"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Star } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";

const FeedbackForm = dynamic(() => import("@/components/FeedbackForm").then(mod => mod.FeedbackForm), { ssr: false });

export default function ReceptionPage() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-brand-soft-gray font-sans selection:bg-brand-gold-bright selection:text-white">
            {/* Header / Hero Section */}
            <section className="relative pt-16 sm:pt-20 pb-8 px-6 flex items-center justify-center bg-white overflow-hidden rounded-b-[2rem] sm:rounded-b-[4rem] shadow-premium z-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold-bright/5 rounded-full blur-3xl -mt-48 -mr-48" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-olive-light/5 rounded-full blur-3xl -mb-48 -ml-48" />

                <div className="relative z-10 text-center max-w-3xl mx-auto">
                    <motion.div
                        initial={mounted ? { opacity: 0, y: 10 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-soft-gray text-brand-gold-bright text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-8 shadow-sm border border-gray-100"
                    >
                        <Star className="w-3 h-3" fill="currentColor" />
                        Guest Reception
                    </motion.div>
                    
                    <motion.h1
                        initial={mounted ? { y: 20, opacity: 0 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl sm:text-4xl md:text-5xl font-serif font-black mb-4 text-brand-olive-dark tracking-tight leading-tight"
                    >
                        Welcome to
                        <span className="block text-brand-gold-bright italic mt-2">Olive Stayz</span>
                    </motion.h1>
                    
                    <motion.p
                        initial={mounted ? { y: 20, opacity: 0 } : false}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto font-medium leading-relaxed px-4"
                    >
                        Your premium comfort destination. Find our location easily or let us know about your experience.
                    </motion.p>
                </div>
            </section>

            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-start">
                {/* Location Details Section */}
                <motion.section
                    initial={mounted ? { opacity: 0, x: -20 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 shadow-xl border border-gray-50 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 lg:sticky lg:top-32"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-olive-light/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-brand-olive-light/10 transition-colors duration-700" />
                    
                    <div className="relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-brand-soft-gray flex items-center justify-center text-brand-olive-dark mb-8 group-hover:bg-brand-gold-bright group-hover:text-white transition-all duration-500">
                            <MapPin size={32} />
                        </div>
                        
                        <h2 className="text-3xl sm:text-4xl font-serif font-black mb-6 text-brand-olive-dark tracking-tight">
                            Reach Our Hotel
                        </h2>
                        
                        <div className="space-y-6 mb-10">
                            <div className="p-6 rounded-2xl bg-brand-soft-gray/50 border border-gray-100 flex flex-col items-start min-h-[104px] justify-center">
                                <h3 className="text-[10px] font-black uppercase text-brand-gold-bright tracking-[0.2em] mb-2">Property Name</h3>
                                <p className="text-xl font-bold text-brand-olive-dark">OLIVE STAYZ</p>
                            </div>

                            <div className="p-6 rounded-2xl bg-brand-soft-gray/50 border border-gray-100 flex flex-col items-start min-h-[104px] justify-center">
                                <h3 className="text-[10px] font-black uppercase text-brand-gold-bright tracking-[0.2em] mb-2">Address</h3>
                                <p className="text-gray-700 font-medium leading-relaxed">
                                    A188, Sector 14, Seemant Vihar Kaushambi,<br />
                                    Ghaziabad, Uttar Pradesh 201010
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl bg-brand-soft-gray/50 border border-gray-100 flex flex-col items-start min-h-[104px] justify-center">
                                <h3 className="text-[10px] font-black uppercase text-brand-gold-bright tracking-[0.2em] mb-2">Landmark</h3>
                                <p className="text-gray-700 font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-brand-gold-bright blur-[1px]" />
                                    Next to Radisson Blu Hotel, Kaushambi
                                </p>
                            </div>
                        </div>

                        <Link
                            href="https://maps.app.goo.gl/mymGSxHwBRo5eNDy8"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-5 rounded-2xl bg-brand-olive-dark text-white font-black text-lg flex items-center justify-center gap-3 hover:bg-brand-gold-bright transition-all shadow-lg hover:shadow-xl active:scale-95 group/btn"
                        >
                            <Navigation size={20} className="group-hover/btn:animate-bounce" />
                            Get Directions
                        </Link>
                    </div>
                </motion.section>

                {/* Feedback Form Section */}
                <motion.div
                    initial={mounted ? { opacity: 0, x: 20 } : false}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <FeedbackForm />
                </motion.div>
            </main>
        </div>
    );
}
