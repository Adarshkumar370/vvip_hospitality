"use client";

import { motion } from "framer-motion";
import { SITE_CONFIG } from "@/lib/constants/config";
import { Mail, Phone, MapPin, Send, MessageCircle, Clock, FileCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Contact() {
    const [formState, setFormState] = useState({ name: "", email: "", type: "Stay", message: "" });

    const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsapp.replace(/\+/g, "").replace(/\s/g, "")}?text=${encodeURIComponent(SITE_CONFIG.whatsappMessage)}`;

    return (
        <div className="flex flex-col bg-white">
            {/* Contact Hero */}
            <section className="bg-brand-soft-gray py-20 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-serif font-bold mb-6 text-brand-olive-dark"
                    >
                        Get in <span className="text-brand-gold-bright">Touch</span>
                    </motion.h1>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Whether you're looking for a premium stay near Advant Noida or a B2B bakery partner, we're here to help.
                    </p>
                </div>
            </section>

            {/* Contact Content */}
            <section className="py-24 px-6 max-w-4xl mx-auto w-full">
                <div className="space-y-16">
                    {/* Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-12">
                            <div>
                                <h2 className="text-2xl font-serif font-bold mb-8">Contact Information</h2>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-5">
                                        <div className="w-12 h-12 rounded-xl bg-brand-gold-bright/10 flex items-center justify-center text-brand-gold-bright shrink-0">
                                            <MapPin size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-1">Headquarters</h4>
                                            <p className="text-gray-800 font-medium">{SITE_CONFIG.hq}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-5">
                                        <div className="w-12 h-12 rounded-xl bg-brand-gold-bright/10 flex items-center justify-center text-brand-gold-bright shrink-0">
                                            <Phone size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-1">WhatsApp & Call</h4>
                                            <p className="text-gray-800 font-medium">{SITE_CONFIG.whatsapp}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-5">
                                        <div className="w-12 h-12 rounded-xl bg-brand-gold-bright/10 flex items-center justify-center text-brand-gold-bright shrink-0">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm uppercase tracking-wider text-gray-400 mb-1">Operational Hours</h4>
                                            <p className="text-gray-800 font-medium">{SITE_CONFIG.operations}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex py-5 px-10 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#128C7E] transition-colors items-center justify-center gap-2 shadow-lg active:scale-95">
                                <MessageCircle size={20} />
                                WhatsApp Our Team
                            </a>
                        </div>

                        <div className="p-10 bg-brand-soft-gray border border-gray-100 text-brand-olive-dark rounded-[2.5rem] relative overflow-hidden group">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-serif font-black mb-4">GST Invoice Support</h3>
                                <p className="text-gray-600 text-sm mb-8 leading-relaxed font-bold">
                                    Corporate partners can request GST-compliant invoices for all bookings and bakery supplies.
                                </p>
                                <div className="flex items-center gap-3 text-brand-gold-bright font-black text-sm">
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                        <FileCheck size={20} />
                                    </div>
                                    Corporate Invoicing Available
                                </div>
                            </div>
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-brand-gold-bright/10 rounded-full translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-brand-gold-bright/20 transition-colors" />
                        </div>
                    </div>

                    {/* Interactive Google Map */}
                    <div className="h-96 md:h-[500px] bg-gray-100 rounded-[3rem] overflow-hidden relative shadow-premium border border-gray-100">
                        <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.7425219403713!2d77.3274918!3d28.637477999999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfb004a2d89e3%3A0x874083354fa96356!2sOlive%20Stayz!5e0!3m2!1sen!2sin!4v1770068189552!5m2!1sen!2sin"
                            title="Olive Stayz Location"
                            className="absolute inset-0 grayscale contrast-125 opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
                        ></iframe>
                    </div>
                </div>
            </section>
        </div>
    );
}
