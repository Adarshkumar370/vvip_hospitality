"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Shield, Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const locations = [
    {
        name: "Olive Stayz - Kaushambi",
        description: "Strategically located near NH 24 and Radisson Kaushambi, perfect for Delhi-UP commuters.",
        highlight: "Gateway to business hubs",
        image: "/images/olive_stayz_room_1768770065041.png",
        href: "/olive-stayz-kaushambi",
        features: ["Near NH 24", "Radisson Vicinity", "Premium 1 BHK"],
        color: "olive"
    },
    {
        name: "Olive Stayz - Noida",
        description: "Situated in Sector 144, the heart of Noida's corporate corridor near Advant IT Park.",
        highlight: "Ideal for corporate stays",
        image: "/images/olive_stayz_room_1768770065041.png",
        href: "/olive-stayz-noida",
        features: ["Near Advant Park", "Oxygen Business Hub", "Tech Corridor"],
        color: "gold"
    }
];

export default function OliveStayzLandingPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Hero Header */}
            <section className="relative pt-32 pb-20 bg-background overflow-hidden border-b border-border">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 z-0 bg-mesh opacity-30" />
                <div className="absolute inset-0 z-0 bg-pattern opacity-[0.03] dark:opacity-[0.05]" />

                <div className="absolute inset-0 opacity-40 dark:opacity-20 transition-opacity duration-1000">
                    <Image
                        src="/images/olive_stayz_room_1768770065041.png"
                        alt="Background Pattern"
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="max-w-3xl">
                        <motion.h4
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-olive font-bold tracking-[0.3em] uppercase mb-4"
                        >
                            Our Properties
                        </motion.h4>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-foreground"
                        >
                            Choose Your <span className="text-gold italic">Sanctuary</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-muted-foreground mb-8 leading-relaxed font-medium"
                        >
                            Experience premium comfort at Olive Stayz. Whether you're traveling for business or leisure, our strategically located properties in Noida and Ghaziabad offer the perfect blend of convenience and luxury.
                        </motion.p>
                    </div>
                </div>
                {/* Bottom Gradient for smooth transition */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/20 to-background z-[2]" />
            </section>

            {/* Location Cards */}
            <section className="py-24 max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {locations.map((loc, idx) => (
                        <motion.div
                            key={loc.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="group relative"
                        >
                            <div className="relative aspect-[16/10] rounded-[2.5rem] overflow-hidden shadow-2xl mb-8">
                                <Image
                                    src={loc.image}
                                    alt={loc.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-8 left-8 right-8">
                                    <div className="flex items-center gap-2 text-white/90 font-medium mb-3 backdrop-blur-sm bg-white/10 w-fit px-4 py-1.5 rounded-full border border-white/20">
                                        <MapPin size={16} className="text-gold" />
                                        <span className="text-sm">{loc.highlight}</span>
                                    </div>
                                    <h3 className="text-3xl font-bold text-white mb-2">{loc.name}</h3>
                                </div>
                            </div>

                            <div className="px-4">
                                <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                                    {loc.description}
                                </p>

                                <div className="flex flex-wrap gap-3 mb-10">
                                    {loc.features.map(feat => (
                                        <span key={feat} className="text-xs font-bold uppercase tracking-widest text-foreground bg-muted px-4 py-2 rounded-lg border border-border">
                                            {feat}
                                        </span>
                                    ))}
                                </div>

                                <Link
                                    href={loc.href}
                                    className="inline-flex items-center gap-3 bg-charcoal text-white px-10 py-4 rounded-full font-bold shadow-xl hover:bg-gold transition-all active:scale-95 group/btn"
                                >
                                    Explore This Location
                                    <ArrowRight className="transition-transform group-hover/btn:translate-x-2" size={20} />
                                </Link>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Why Olive Stayz */}
            <section className="py-24 bg-background relative overflow-hidden border-y border-border">
                <div className="absolute inset-0 z-0 bg-pattern opacity-[0.03] dark:opacity-[0.05]" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-foreground mb-4">The Olive Stayz Advantage</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">Premium amenities and strategic locations designed for the modern lifestyle.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: Shield, title: "Secure Living", desc: "24/7 surveillance and secure access for total peace of mind." },
                            { icon: Star, title: "Premium Design", desc: "Contemporary urban aesthetics with a focus on comfort." },
                            { icon: MapPin, title: "Strategic Spots", desc: "Always within reach of major business parks and highways." }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-background p-10 rounded-[2rem] border border-border flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-olive/10 rounded-2xl flex items-center justify-center text-olive mb-6 shadow-sm">
                                    <item.icon size={32} />
                                </div>
                                <h4 className="text-xl font-bold mb-4 text-foreground">{item.title}</h4>
                                <p className="text-muted-foreground font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
