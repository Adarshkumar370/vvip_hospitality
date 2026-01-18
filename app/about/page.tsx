"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Image from "next/image";
import { motion } from "framer-motion";
import { Target, Heart, Eye, MapPin, Award, Users, Globe } from "lucide-react";

const values = [
    {
        icon: Heart,
        title: "Guest Centricity",
        description: "Every decision we make starts with the comfort and satisfaction of our guests. We treat every visitor as a Very Very Important Person."
    },
    {
        icon: Target,
        title: "Strategic Excellence",
        description: "We choose our locations and business partners with precision, ensuring maximum convenience for the modern traveler."
    },
    {
        icon: Award,
        title: "Uncompromising Quality",
        description: "Whether it is the thread count of our linens or the hydration of our sourdough, we never settle for 'good enough'."
    }
];

const stats = [
    { label: "Happy Guests", value: "5000+" },
    { label: "Corporate Partners", value: "50+" },
    { label: "Years of Excellence", value: "5+" },
    { label: "Premium Rooms", value: "100+" }
];

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-40 pb-24 bg-background overflow-hidden border-b border-border">
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 z-0 bg-mesh opacity-30" />
                <div className="absolute inset-0 z-0 bg-pattern opacity-[0.03] dark:opacity-[0.05]" />

                <div className="absolute inset-0 opacity-40 dark:opacity-20 transition-opacity duration-1000">
                    <Image
                        src="/images/olive_stayz_room_1768770065041.png"
                        alt="Background"
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <motion.h4
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-gold font-bold tracking-[0.4em] uppercase mb-4"
                    >
                        Redefining Hospitality
                    </motion.h4>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-bold mb-8 text-foreground"
                    >
                        Our Story & <span className="text-olive italic">Vision</span>
                    </motion.h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
                        VVIP Hospitality Group is a diversified entity committed to excellence across urban living and gourmet bakery solutions.
                    </p>
                </div>
                {/* Bottom Gradient for smooth transition */}
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[2]" />
            </section>

            {/* Detailed Story Section */}
            <section className="py-24 max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl font-bold text-foreground mb-8">Who We Are</h2>
                        <div className="prose prose-lg text-muted-foreground space-y-6">
                            <p>
                                Founded on the principle of providing "Very Very Important" service to every individual, VVIP Hospitality started as a vision to bridge the gap between premium luxury and urban convenience.
                            </p>
                            <p>
                                Today, we operate two distinct yet harmonious verticals. <strong>Olive Stayz</strong> provides meticulously designed urban sanctuaries for the modern corporate traveler, while <strong>VVIP Bakery</strong> serves as a premier B2B cloud kitchen partner for the region's top cafes and restaurants.
                            </p>
                            <p>
                                Based in the tech-hub of Noida, we leverage our strategic positions near major business parks to serve a growing community of professionals and entrepreneurs.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mt-12">
                            {stats.map((stat, idx) => (
                                <div key={idx}>
                                    <p className="text-3xl font-bold text-olive">{stat.value}</p>
                                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl"
                    >
                        <Image
                            src="/images/vvip_bakery_kitchen_1768770081695.png"
                            alt="Our Operations"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gold/10 mix-blend-overlay" />
                    </motion.div>
                </div>
            </section>

            {/* Vision & Mission */}
            <section className="py-24 bg-background relative overflow-hidden border-y border-border">
                <div className="absolute inset-0 z-0 bg-pattern opacity-[0.03] dark:opacity-[0.05]" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="p-12 rounded-[3rem] bg-card dark:bg-white/5 border border-border dark:border-white/10 hover:border-gold/30 transition-all group shadow-xl hover:-translate-y-2">
                            <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center text-gold mb-8 group-hover:scale-110 transition-transform shadow-lg">
                                <Eye size={32} />
                            </div>
                            <h3 className="text-3xl font-bold mb-6 text-foreground">Our Vision</h3>
                            <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                                To become the most trusted name in Indian hospitality, recognized for our ability to blend premium comfort with high-efficiency urban living and gourmet culinary excellence.
                            </p>
                        </div>
                        <div className="p-12 rounded-[3rem] bg-card dark:bg-white/5 border border-border dark:border-white/10 hover:border-olive/30 transition-all group shadow-xl hover:-translate-y-2">
                            <div className="w-16 h-16 bg-olive/10 rounded-2xl flex items-center justify-center text-olive mb-8 group-hover:scale-110 transition-transform shadow-lg">
                                <Globe size={32} />
                            </div>
                            <h3 className="text-3xl font-bold mb-6 text-foreground">Our Mission</h3>
                            <p className="text-muted-foreground text-lg leading-relaxed font-medium">
                                To provide seamless, high-quality experiences through our diverse portfolio, ensuring every touchpoint—from a guest room to a bakery delivery—is consistent, reliable, and exceptional.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values */}
            <section className="py-24 max-w-7xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-foreground mb-4">Values That Drive Us</h2>
                    <p className="text-muted-foreground font-medium">The bedrock of our hospitality standard.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {values.map((v, i) => (
                        <div key={i} className="p-10 rounded-[2.5rem] border border-border bg-muted flex flex-col items-center text-center hover:bg-white transition-colors">
                            <div className="w-14 h-14 bg-charcoal text-white rounded-2xl flex items-center justify-center mb-6">
                                <v.icon size={24} />
                            </div>
                            <h4 className="text-xl font-bold mb-4">{v.title}</h4>
                            <p className="text-muted-foreground leading-relaxed">{v.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Location & Map Section */}
            <section className="py-24 bg-muted border-t border-border">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
                        <div className="lg:col-span-1">
                            <h2 className="text-4xl font-bold text-foreground mb-6">Find Our Headquarters</h2>
                            <p className="text-lg text-muted-foreground font-medium mb-8">
                                Located in the heart of Noida's technology corridor, our headquarters orchestrates our operations across the region.
                            </p>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white rounded-xl shadow-sm border border-border text-gold">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground">Main Office</p>
                                        <p className="text-muted-foreground">Sector 142, Near Advant Navis Park, Noida, UP 201305</p>
                                    </div>
                                </div>
                                <div className="p-8 bg-charcoal text-white rounded-3xl mt-12">
                                    <p className="font-medium text-gold mb-2 italic">Visit us</p>
                                    <p className="text-sm text-white/80">Our doors are open for corporate inquiries and partnership discussions from Monday to Saturday, 10 AM - 6 PM.</p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2">
                            <div className="h-[500px] w-full rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3505.4194!2d77.4116!3d28.5172!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce6603a119777%3A0xe5a3c98f8e08d6a8!2sAdvant%20Navis%20Business%20Park!5e0!3m2!1sen!2sin!4v1705600000000!5m2!1sen!2sin"
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
