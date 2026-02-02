"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface Testimonial {
    name: string;
    role: string;
    content: string;
    stars: number;
}

interface TestimonialsSectionProps {
    testimonials: Testimonial[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
    return (
        <section className="py-24 px-6 bg-brand-soft-gray/50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="text-brand-gold-bright text-xs font-black uppercase tracking-[0.4em] mb-4 block">
                        Guest Experiences
                    </span>
                    <h2 className="text-4xl md:text-6xl font-serif font-black text-brand-olive-dark">
                        What Our Guests Say
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            viewport={{ once: true }}
                            className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col"
                        >
                            <div className="flex gap-1 mb-6">
                                {[...Array(t.stars)].map((_, i) => (
                                    <Star key={i} size={16} className="fill-brand-gold-bright text-brand-gold-bright" />
                                ))}
                            </div>
                            <p className="text-gray-600 font-medium leading-relaxed mb-8 flex-1 italic">
                                "{t.content}"
                            </p>
                            <div>
                                <h3 className="text-lg font-bold text-brand-olive-dark">{t.name}</h3>
                                <p className="text-sm text-brand-gold-bright font-black uppercase tracking-widest">
                                    {t.role}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
