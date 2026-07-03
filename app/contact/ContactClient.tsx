"use client";

import { motion } from "framer-motion";
import { SITE_CONFIG } from "@/lib/constants/config";
import { Phone, MapPin, MessageCircle, Clock } from "lucide-react";

export default function ContactClient() {
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
                    <p className="text-gray-500 max-w-2xl mx-auto font-medium">
                        Whether you&apos;re looking for a premium stay in Kaushambi or a professional bakery partner, <span className="text-brand-olive-dark font-black">VVIP Hospitality</span> is here to help.
                    </p>
                </div>
            </section>

            {/* Contact Content */}
            <section className="py-24 px-6 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Info Section */}
                    <div className="w-full">
                        <div className="space-y-12">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-serif font-black text-brand-olive-dark mb-8">Contact Information</h2>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-5 bg-brand-soft-gray p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="w-12 h-12 rounded-xl bg-brand-gold-bright/10 flex items-center justify-center text-brand-gold-bright shrink-0">
                                            <MapPin size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Headquarters</h4>
                                            <p className="text-gray-800 font-bold leading-relaxed">{SITE_CONFIG.hq}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-5 bg-brand-soft-gray p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="w-12 h-12 rounded-xl bg-brand-gold-bright/10 flex items-center justify-center text-brand-gold-bright shrink-0">
                                            <Phone size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">WhatsApp & Call</h4>
                                            <p className="text-gray-800 font-black text-lg">{SITE_CONFIG.whatsapp}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-5 bg-brand-soft-gray p-6 rounded-3xl border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="w-12 h-12 rounded-xl bg-brand-gold-bright/10 flex items-center justify-center text-brand-gold-bright shrink-0">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">Operational Hours</h4>
                                            <p className="text-gray-800 font-bold">{SITE_CONFIG.operations}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex py-6 px-10 bg-[#25D366] text-white font-black rounded-2xl hover:bg-[#128C7E] transition-all items-center justify-center gap-4 shadow-xl active:scale-95 uppercase tracking-widest text-sm group">
                                <MessageCircle size={28} className="group-hover:rotate-12 transition-transform" />
                                Chat with our team
                            </a>
                        </div>
                    </div>

                    {/* Interactive Google Map */}
                    <div className="h-[400px] lg:h-[600px] bg-gray-100 rounded-[3rem] overflow-hidden relative shadow-premium border border-gray-100 group">
                        <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            sandbox="allow-scripts allow-same-origin allow-popups"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3501.742522752618!2d77.32491687681485!3d28.637477975662236!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390cfb004a2d89e3%3A0x874083354fa96356!2sOlive%20Stayz!5e0!3m2!1sen!2sin!4v1778115510577!5m2!1sen!2sin"
                            title="VVIP Hospitality Location"
                            className="absolute inset-0 opacity-90 group-hover:opacity-100 transition-all duration-700"
                        ></iframe>
                    </div>
                </div>
            </section>
        </div>
    );
}
