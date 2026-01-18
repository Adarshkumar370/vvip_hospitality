"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield, Lock, Eye, FileText, Bell } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPolicyPage() {
    const sections = [
        {
            title: "1. Data Collection & Usage",
            icon: Eye,
            content: "We collect personal information such as name, contact details, and government-issued ID (e.g., Aadhar, Driving License) as required by Indian Law for hotel check-ins. PAN Card is not accepted as a valid ID."
        },
        {
            title: "2. Compliance with Indian Laws",
            icon: Shield,
            content: "Your data is processed in accordance with the Digital Personal Data Protection (DPDP) Act 2023 and the Information Technology Act 2000. Data is shared with local law enforcement (C-Form) as mandatory for hospitality providers in India."
        },
        {
            title: "3. CCTV Surveillance",
            icon: Lock,
            content: "For safety and security, our properties (Olive Stayz Kaushambi & Noida) are equipped with 24/7 CCTV surveillance in public areas. Footage is stored securely and only accessed for security investigations."
        },
        {
            title: "4. Data Security",
            icon: Bell,
            content: "We implement industry-standard security measures to protect your data from unauthorized access, alteration, or disclosure. Your payment information is handled through secure, PCI-DSS compliant gateways."
        },
        {
            title: "5. Your Rights",
            icon: FileText,
            content: "Under the DPDP Act, you have the right to access, correct, or erase your personal data. You may also withdraw consent, though this may impact our ability to provide services."
        }
    ];

    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            <section className="pt-32 pb-20 bg-charcoal text-white relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-6xl font-bold mb-6"
                    >
                        Privacy Policy
                    </motion.h1>
                    <p className="text-white/60 text-lg">Last updated: January 2026</p>
                </div>
            </section>

            <section className="py-20 max-w-4xl mx-auto px-6">
                <div className="prose prose-lg prose-invert max-w-none space-y-12">
                    <p className="text-muted-foreground leading-relaxed">
                        VVIP Hospitality Group ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website or stay at our properties in Noida and Ghaziabad.
                    </p>

                    <div className="space-y-8">
                        {sections.map((section, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="bg-card border border-border p-8 rounded-3xl"
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center text-gold">
                                        <section.icon size={20} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-charcoal">{section.title}</h2>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                    {section.content}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    <div className="bg-muted p-10 rounded-3xl border border-border mt-16">
                        <h2 className="text-2xl font-bold text-charcoal mb-4">Grievance Redressal</h2>
                        <p className="text-muted-foreground mb-6">
                            As per the IT Act 2000 and DPDP Act 2023, if you have any questions or grievances, please contact our Grievance Officer:
                        </p>
                        <div className="space-y-2 text-charcoal font-medium">
                            <p>Email: legal@vviphospitality.com</p>
                            <p>Address: Sector 142, Noida, Uttar Pradesh, India</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
