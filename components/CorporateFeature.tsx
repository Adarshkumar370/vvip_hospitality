"use client";

import { motion } from "framer-motion";
import { Building2, Briefcase, FileText, LayoutList } from "lucide-react";

export default function CorporateFeature() {
    return (
        <section id="corporate" className="py-24 bg-background overflow-hidden relative">
            {/* Decorative patterns */}
            <div className="absolute inset-0 z-0 bg-mesh opacity-20" />
            <div className="absolute inset-0 z-0 bg-pattern opacity-[0.03] dark:opacity-[0.05]" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-olive/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl opacity-50" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="bg-card dark:bg-white/5 border border-border dark:border-white/10 rounded-[3rem] p-8 md:p-16 shadow-xl">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/2">
                            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                                Corporate & <span className="text-gold">B2B Solutions</span>
                            </h2>
                            <p className="text-xl text-muted-foreground mb-8 max-w-xl font-medium">
                                We understand the unique needs of business partners. From streamlined invoicing
                                to long-term stay arrangements and bulk bakery supply.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-2 bg-gold/10 rounded-lg text-gold">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-foreground font-bold">GST Invoicing</h4>
                                        <p className="text-muted-foreground text-sm font-medium">Compliant billing for all business expenses.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-2 bg-gold/10 rounded-lg text-gold">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-foreground font-bold">Corporate Rates</h4>
                                        <p className="text-muted-foreground text-sm font-medium">Special pricing for stays exceeding 10 nights.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-2 bg-olive/10 rounded-lg text-olive">
                                        <LayoutList size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-foreground font-bold">Custom Menus</h4>
                                        <p className="text-muted-foreground text-sm font-medium">Tailored bakery offerings for corporate cafes.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="mt-1 p-2 bg-olive/10 rounded-lg text-olive">
                                        <Briefcase size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-foreground font-bold">B2B Delivery</h4>
                                        <p className="text-muted-foreground text-sm font-medium">Scheduled, reliable delivery for bulk orders.</p>
                                    </div>
                                </div>
                            </div>

                            <button className="bg-charcoal text-white dark:bg-white dark:text-charcoal px-10 py-4 rounded-full font-bold hover:bg-gold hover:text-white transition-all transform hover:-translate-y-1 shadow-lg">
                                Inquire for Business
                            </button>
                        </div>

                        <div className="lg:w-1/2 w-full">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div className="space-y-4 pt-8">
                                    <div className="h-40 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center transform rotate-3">
                                        <span className="text-gold/20 font-black text-6xl">VVIP</span>
                                    </div>
                                    <div className="h-64 bg-gold rounded-2xl flex items-end p-6 transform -rotate-2">
                                        <p className="text-white font-bold text-2xl">B2B Loyalty Rewards</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-64 bg-olive rounded-2xl flex items-end p-6 transform rotate-2">
                                        <p className="text-white font-bold text-2xl">Executive Bulk Suites</p>
                                    </div>
                                    <div className="h-40 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center transform -rotate-3">
                                        <span className="text-olive/20 font-black text-6xl">LTD</span>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
