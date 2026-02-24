"use client";

import { motion } from "framer-motion";
import { SITE_CONFIG } from "@/lib/constants/config";
import { ShieldCheck, Heart, Users, Target, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutUs() {
    return (
        <div className="flex flex-col bg-white">
            {/* About Hero */}
            <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center bg-brand-soft-gray overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-white -skew-x-12 translate-x-1/2 z-0" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold-bright/5 rounded-full blur-3xl z-0" />

                <div className="relative z-10 text-center px-6">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1.5 rounded-full bg-brand-gold-bright/10 text-brand-gold-bright text-xs font-black uppercase tracking-[0.3em] mb-8"
                    >
                        Our Philosophy
                    </motion.span>
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-8xl font-serif font-black mb-8 text-brand-olive-dark tracking-tight leading-tight"
                    >
                        Treating Everyone <br />
                        <span className="text-brand-gold-bright italic">as a VVIP</span>
                    </motion.h1>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-medium"
                    >
                        At VVIP Hospitality, we believe excellence is not an act, but a habit. We are dedicated to redefining luxury through transparency and personalized care.
                    </motion.p>
                </div>
            </section>

            {/* Our Story Section */}
            <section className="py-32 px-6 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                    <div className="relative group">
                        <div className="absolute -inset-6 bg-brand-gold-bright/5 rounded-[4rem] -z-10 group-hover:bg-brand-gold-bright/10 transition-all duration-700" />
                        <div className="aspect-square bg-brand-soft-gray rounded-[3rem] overflow-hidden relative shadow-2xl border border-white">
                            <Image
                                src="/images/foundation.png"
                                alt="VVIP Hospitality Foundation"
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl md:text-6xl font-serif font-black mb-10 text-brand-olive-dark tracking-tight">Our Story</h2>
                        <div className="space-y-6 text-lg text-gray-600 font-medium leading-relaxed">
                            <p>
                                Founded with a singular vision, VVIP Hospitality group set out to bridge the gap between "standard services" and "genuine hospitality." The name "VVIP" reflects our core promise: to treat every visitor, guest, and partner as a Very Very Important Person.
                            </p>
                            <p>
                                What started as a boutique accommodation project in Kaushambi has now evolved into a multi-vertical hospitality group, spanning premium long-stays with <strong>Olive Stayz</strong> and professional B2B culinary solutions through <strong>VVIP Bakery</strong>.
                            </p>
                            <p>
                                Our growth is powered by a commitment to data-driven transparency, whether it's our "Pay-What-You-Spend" electricity model or our strictly monitored gourmet quality protocols in our cloud kitchens.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values - The VVIP Way */}
            <section className="py-32 px-6 bg-brand-olive-dark rounded-[5rem] mx-6 mb-24 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold-bright/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="max-w-7xl mx-auto relative z-10 text-white">
                    <div className="text-center mb-24">
                        <span className="text-brand-gold-bright text-xs font-black uppercase tracking-[0.4em] mb-6 block">The VVIP Way</span>
                        <h2 className="text-4xl md:text-7xl font-serif font-black tracking-tight">Built on Integrity</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            {
                                icon: ShieldCheck,
                                title: "Transparency",
                                desc: "No hidden charges. No fine print. We believe in building trust through clear, measurable standards in everything we do."
                            },
                            {
                                icon: Heart,
                                title: "Human Touch",
                                desc: "Technology enables us, but people drive us. Every stay and every supply is backed by a team that genuinely cares."
                            },
                            {
                                icon: Target,
                                title: "Uncompromising Quality",
                                desc: "From the thickness of a sourdough crust to the backup power for a medical traveler—we never settle for 'good enough'."
                            }
                        ].map((value, idx) => (
                            <motion.div
                                key={value.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="bg-white/5 border border-white/10 p-12 rounded-[3rem] hover:bg-white/10 transition-all duration-500 group"
                            >
                                <div className="w-20 h-20 rounded-2xl bg-brand-gold-bright/20 flex items-center justify-center text-brand-gold-bright mb-10 group-hover:bg-brand-gold-bright group-hover:text-brand-olive-dark transition-all duration-500">
                                    <value.icon size={40} />
                                </div>
                                <h3 className="text-3xl font-serif font-black mb-6 tracking-tight">{value.title}</h3>
                                <p className="text-gray-400 text-lg leading-relaxed font-medium">{value.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Meet our Team/Culture Placeholder */}
            <section className="py-32 px-6 max-w-7xl mx-auto w-full">
                <div className="text-center mb-20">
                    <h2 className="text-4xl md:text-6xl font-serif font-black mb-8 text-brand-olive-dark tracking-tight">Our Reach</h2>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto font-medium">
                        Based in Noida, we serve the NCR region with a focus on local expertise and global standards.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {[
                        { label: "Guest Satisfaction", value: "98%" },
                        { label: "B2B Partners", value: "50+" },
                        { label: "Locations", value: "3+" },
                        { label: "Years of Excellence", value: "5+" }
                    ].map((stat, idx) => (
                        <div key={stat.label} className="text-center p-10 bg-brand-soft-gray rounded-[2.5rem] border border-gray-100">
                            <div className="text-4xl md:text-5xl font-serif font-black text-brand-olive-dark mb-3">{stat.value}</div>
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold-bright">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6">
                <div className="max-w-6xl mx-auto bg-brand-soft-gray p-14 md:p-24 rounded-[4rem] text-center border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold-bright/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <h2 className="text-4xl md:text-7xl font-serif font-black mb-12 relative z-10 text-brand-olive-dark tracking-tight leading-tight">
                        Experience the <br />
                        <span className="text-brand-gold-bright italic">VVIP Hospitality Difference</span>
                    </h2>
                    <Link
                        href="/contact"
                        className="inline-flex items-center gap-3 px-16 py-6 bg-brand-olive-dark text-white font-black rounded-full text-xl hover:bg-brand-gold-bright transition-all shadow-2xl relative z-10 active:scale-95"
                    >
                        Work with Us
                        <ArrowRight size={24} />
                    </Link>
                </div>
            </section>
        </div>
    );
}
