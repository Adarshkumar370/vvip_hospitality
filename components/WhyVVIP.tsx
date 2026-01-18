"use client";

import { motion } from "framer-motion";
import { ShieldCheck, MapPin, Award } from "lucide-react";

const features = [
    {
        icon: Award,
        title: "Hospitality Excellence",
        description: "Every guest is treated as a Very Very Important Person. Our service standards are designed to exceed expectations at every touchpoint.",
    },
    {
        icon: MapPin,
        title: "Strategic Locations",
        description: "Properties located near NH 24 and major business hubs like Advant & Oxygen Business Parks, ensuring you're never far from where you need to be.",
    },
    {
        icon: ShieldCheck,
        title: "Quality Guarantee",
        description: "From sanitized, premium-budget rooms to fresh, professional baking standards, quality is the cornerstone of everything we do.",
    },
];

export default function WhyVVIP() {
    return (
        <section className="relative py-24 bg-background text-foreground transition-colors duration-300 overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute inset-0 z-0 bg-pattern opacity-[0.03] dark:opacity-[0.05]" />
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold mb-4">Why VVIP Hospitality?</h2>
                    <div className="h-1.5 w-24 bg-gold mx-auto rounded-full" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="text-center p-8 rounded-3xl bg-card hover:bg-card/80 hover:shadow-2xl transition-all duration-300 border border-border"
                        >
                            <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gold">
                                <feature.icon size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
