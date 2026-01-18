"use client";

import React, { useState } from "react";
import {
    Wifi,
    Shield,
    Coffee,
    Car,
    Users,
    Bed,
    Tv,
    Wind,
    FileText,
    Bath,
    DoorOpen,
    ChevronDown,
    MapPin,
    Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Amenity {
    icon: React.ElementType;
    label: string;
}

interface Rule {
    label: string;
    value: string;
}

interface PropertyDetailsProps {
    location: "Kaushambi" | "Noida";
}

const PropertyDetails: React.FC<PropertyDetailsProps> = ({ location }) => {
    const isKaushambi = location === "Kaushambi";

    const amenities: Amenity[] = [
        { icon: Wifi, label: "High-speed Wi-Fi" },
        { icon: Shield, label: "24/7 Security" },
        { icon: Coffee, label: "Tea/Coffee Maker" },
        { icon: Car, label: "Car Parking" },
        { icon: Wind, label: "Air Conditioning" },
        { icon: Tv, label: "Smart LED TV" },
        { icon: FileText, label: "GST Invoicing" },
        { icon: Bath, label: "Premium Toiletries" }
    ];

    const rules: Rule[] = [
        { label: "Check-in", value: "12:00 PM" },
        { label: "Check-out", value: "11:00 AM" },
        { label: "Smoking", value: "Designated Balcony Rooms Only" },
        { label: "ID Required", value: "Aadhar/DL/Passport/Voter ID" },
        { label: "PAN Card", value: "Not accepted as ID" },
        { label: "Groups", value: "25% Prepayment for Bulk" }
    ];

    const [openAccordion, setOpenAccordion] = useState<boolean>(false);

    return (
        <div className="w-full max-w-7xl mx-auto px-6 py-12 font-sans selection:bg-olive/30 selection:text-charcoal">
            {/* Hero Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                    { icon: Users, label: "Guests", value: "1-2 Adults" },
                    { icon: Bed, label: "Bedrooms", value: "1 BHK / Studio" },
                    { icon: Bed, label: "Beds", value: "1 Queen/King" }
                ].map((item, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        className="bg-muted border border-border p-6 rounded-2xl flex items-center gap-4 group"
                    >
                        <div className="w-12 h-12 bg-olive/10 rounded-xl flex items-center justify-center text-olive group-hover:bg-olive group-hover:text-white transition-colors duration-300">
                            <item.icon size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{item.label}</p>
                            <p className="text-xl font-bold text-foreground">{item.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">

                {/* Left Column: About & Policies */}
                <div className="lg:col-span-2 space-y-12">
                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-3">
                            <Info className="text-olive" />
                            About Olive Stayz {location}
                        </h2>
                        <div className="prose prose-lg text-muted-foreground leading-relaxed max-w-none">
                            {isKaushambi ? (
                                <p>
                                    Our Kaushambi property is strategically situated near the NH 24 highway and Radisson Kaushambi, providing seamless connectivity for those traveling between Delhi and Uttar Pradesh. Whether you are visiting for a high-stakes board meeting or a leisurely city break, our location ensures you are never more than a few minutes away from your destination.
                                </p>
                            ) : (
                                <p>
                                    Our Sector 144, Noida location places you at the epicenter of the region's corporate growth, situated directly near Advant IT Park and Oxygen Business Park. This premium sanctuary is designed to handle the demands of the modern traveler with a contemporary urban aesthetic.
                                </p>
                            )}
                            <p className="mt-4">
                                At Olive Stayz, we believe that a room is more than just a place to sleep—it’s a sanctuary. Each of our rooms comes fully equipped to provide a seamless "plug-and-play" living experience for solo executives and couples alike.
                            </p>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                    >
                        <h2 className="text-3xl font-bold text-foreground mb-6">Stay Information</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-charcoal text-white p-8 rounded-3xl shadow-lg border border-white/5">
                                <h4 className="text-olive font-bold mb-4 uppercase tracking-widest text-sm">Security & Safety</h4>
                                <p className="text-white/70 text-sm leading-relaxed">
                                    Our properties are monitored by 24/7 CCTV surveillance to ensure total peace of mind for all our guests.
                                </p>
                            </div>
                            <div className="bg-charcoal text-white p-8 rounded-3xl shadow-lg border border-white/5">
                                <h4 className="text-olive font-bold mb-4 uppercase tracking-widest text-sm">Business Ready</h4>
                                <p className="text-white/70 text-sm leading-relaxed">
                                    We offer GST Invoicing for corporate travelers and high-speed Wi-Fi to ensure uninterrupted productivity.
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Accordion for Rules */}
                    <div className="border border-border rounded-3xl overflow-hidden bg-background">
                        <button
                            onClick={() => setOpenAccordion(!openAccordion)}
                            className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-muted transition-colors"
                        >
                            <span className="text-2xl font-bold text-foreground">Terms & Rules</span>
                            <motion.div
                                animate={{ rotate: openAccordion ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <ChevronDown className="text-olive" />
                            </motion.div>
                        </button>
                        <AnimatePresence>
                            {openAccordion && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-8 pb-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                        {rules.map((rule, idx) => (
                                            <div key={idx} className="flex justify-between items-center border-b border-border py-3">
                                                <span className="text-muted-foreground font-medium">{rule.label}</span>
                                                <span className="text-foreground font-bold">{rule.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Column: Features card */}
                <motion.aside
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="space-y-6 lg:sticky lg:top-24"
                >
                    <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-olive/5 rounded-full -mr-16 -mt-16 group-hover:bg-olive/10 transition-colors duration-500" />

                        <h3 className="text-2xl font-bold text-foreground mb-8 relative z-10">Features & Amenities</h3>

                        <div className="space-y-6 relative z-10">
                            {amenities.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 group/icon">
                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground group-hover/icon:bg-olive group-hover/icon:text-white transition-all duration-300">
                                        <item.icon size={20} />
                                    </div>
                                    <span className="text-muted-foreground group-hover/icon:text-foreground font-medium transition-colors">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-6 bg-olive text-white rounded-2xl">
                            <h5 className="font-bold flex items-center gap-2 mb-2 italic">
                                <DoorOpen size={18} />
                                Open Terrace Access
                            </h5>
                            <p className="text-sm text-white/80">
                                A perfect spot to unwind after a long day of meetings or exploration.
                            </p>
                        </div>
                    </div>

                    <div className="bg-muted p-8 rounded-[2.5rem] border border-border">
                        <div className="flex items-center gap-3 mb-4">
                            <MapPin className="text-olive" />
                            <h4 className="font-bold text-foreground">Prime Location</h4>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {isKaushambi
                                ? "Gateway to Delhi & UP via NH 24. Near Radisson Kaushambi."
                                : "Epicenter of Noida's IT growth. Minutes away from Advant IT Park."}
                        </p>
                    </div>
                </motion.aside>

            </div>
        </div>
    );
};

export default PropertyDetails;
