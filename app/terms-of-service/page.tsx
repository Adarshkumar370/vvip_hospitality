"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Scale, Clock, UserCheck, AlertTriangle, Gavel } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsOfServicePage() {
    const terms = [
        {
            title: "1. Admission Policy",
            icon: UserCheck,
            content: "Admission to Olive Stayz properties is at the sole discretion of the management. In accordance with government regulations, all guests must present a valid physical photo ID at check-in (Aadhar, Driving License, Passport, or Voter ID). PAN cards are NOT accepted."
        },
        {
            title: "2. Booking & Cancellation",
            icon: Clock,
            content: "For bulk bookings (exceeding 3 rooms or 10 nights), a 25% non-refundable prepayment is required. Individual cancellations must be informed 48 hours prior to check-in to avoid a one-night charge."
        },
        {
            title: "3. Guest Conduct",
            icon: AlertTriangle,
            content: "Guests are expected to maintain social decorum. Any illegal activities, harassment, or damage to property will lead to immediate eviction without refund and potential legal action under Indian Penal Code (IPC)."
        },
        {
            title: "4. Smoking & Alcohol",
            icon: AlertTriangle,
            content: "Smoking is strictly prohibited in all indoor areas except for designated balcony rooms. Consumption of illegal substances is a criminal offense and will be reported to local authorities immediately."
        },
        {
            title: "5. Jurisdiction",
            icon: Gavel,
            content: "These terms are governed by the laws of India. Any disputes arising out of the stay or services shall be subject to the exclusive jurisdiction of the courts in Noida/Gautam Buddh Nagar, Uttar Pradesh."
        }
    ];

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-32 pb-20 bg-charcoal text-white relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <motion.h1
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-4xl md:text-6xl font-bold mb-6"
                    >
                        Terms of Service
                    </motion.h1>
                    <p className="text-white/60 text-lg italic">Standard Hospitality Terms for India Operations</p>
                </div>
            </section>

            <section className="py-20 max-w-4xl mx-auto px-6">
                <div className="space-y-12">
                    <div className="prose prose-lg max-w-none">
                        <p className="text-muted-foreground leading-relaxed">
                            Welcome to VVIP Hospitality. By accessing our services or staying at our properties, you agree to be bound by the following Terms and Conditions. Please read them carefully.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {terms.map((term, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.05 }}
                                className="group bg-card border border-border p-8 rounded-3xl hover:border-gold transition-colors"
                            >
                                <div className="flex items-start gap-6">
                                    <div className="w-12 h-12 shrink-0 bg-muted rounded-2xl flex items-center justify-center text-charcoal group-hover:bg-gold group-hover:text-white transition-all duration-300">
                                        <term.icon size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-charcoal mb-3">{term.title}</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            {term.content}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="border border-border p-8 rounded-3xl bg-charcoal text-white/90">
                        <div className="flex items-center gap-3 mb-4">
                            <Scale className="text-gold" />
                            <h2 className="text-xl font-bold">Limitation of Liability</h2>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed">
                            VVIP Hospitality Group is not responsible for any loss or damage of personal belongings. Guests are advised to use the in-room lockers (where available) and keep their valuables secure. Our liability for any service failure is limited to the amount paid for the booking.
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
