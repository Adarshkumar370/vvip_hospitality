"use client";

import React from "react";
import OliveStayzHeader from "@/components/olive-stayz/Header";
import OliveStayzFooter from "@/components/olive-stayz/Footer";
import Image from "next/image";
import { motion } from "framer-motion";
import { RupeeAmount } from "@/components/ui/RupeeAmount";
import { 
    FaWifi, FaBuilding, FaUtensils, FaCar, FaBolt, FaWheelchair, 
    FaUserTie, FaBroom, FaCamera, FaShieldAlt, FaFireExtinguisher, 
    FaSuitcase, FaCheckCircle, FaStar, FaConciergeBell
} from "react-icons/fa";

export default function FacilitiesClient() {
    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <OliveStayzHeader />

            {/* Hero Section */}
            <section className="relative h-[50vh] mt-20 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/background_2.png"
                        alt="Facilities Hero"
                        fill
                        className="object-cover brightness-50"
                        priority
                    />
                </div>
                <div className="relative z-10 text-center px-6">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-[#C5A04D] font-black uppercase tracking-[0.4em] text-sm block mb-4"
                    >
                        Comfort & Convenience
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase"
                    >
                        Our Facilities
                    </motion.h1>
                </div>
            </section>

            {/* Introduction & Rating */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl font-black mb-8 leading-tight">Thoughtfully Curated for Your Lifestyle</h2>
                        <p className="text-xl text-gray-600 leading-relaxed mb-10">
                            Step into a thoughtfully curated studio designed for comfort and style. The space features a comfortable bed with fresh, clean linens, a modern bathroom, and a fully equipped kitchen for all your cooking needs. 
                        </p>
                        <p className="text-lg text-gray-500 leading-relaxed">
                            Whether you&apos;re visiting for a short trip or an extended stay, this studio is designed to feel like home while offering the convenience and cleanliness of a hotel. Stay connected with high-speed free Wi-Fi and unwind with your favourite shows on the smart TV.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-[#1A321A] text-white p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="bg-[#C5A04D] p-4 rounded-2xl">
                                    <FaStar className="text-3xl text-white" />
                                </div>
                                <div>
                                    <div className="text-4xl font-black text-white">4.8 / 5</div>
                                    <div className="text-[#C5A04D] font-bold uppercase tracking-widest text-xs">Guest Rating</div>
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold mb-6 italic text-[#C5A04D]">&quot;Excellent amenities provided at the property.&quot;</h3>
                            <p className="text-gray-300 leading-relaxed mb-8">
                                Guests praised the well-maintained rooms, modern furnishings, and fully equipped kitchens. The self-check-in system and responsive host ensure a pleasant, memorable stay.
                            </p>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <FaStar key={s} className="text-[#C5A04D]" />
                                ))}
                            </div>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#C5A04D]/10 rounded-full blur-3xl"></div>
                    </motion.div>
                </div>
            </section>

            {/* Main Amenities Grid */}
            <section className="py-24 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-[#C5A04D] font-black uppercase tracking-widest text-sm block mb-4">The Essentials</span>
                        <h2 className="text-4xl md:text-5xl font-black">Building & Services</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {FACILITIES_DATA.map((category, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100"
                            >
                                <h3 className="text-xl font-black mb-8 border-b pb-4 border-gray-50 flex items-center gap-3">
                                    <span className="text-[#C5A04D]">{category.categoryIcon}</span>
                                    {category.title}
                                </h3>
                                <ul className="space-y-6">
                                    {category.items.map((item, i) => (
                                        <li key={i} className="flex items-start gap-4 group">
                                            <div className="mt-1 text-[#C5A04D] opacity-60 group-hover:opacity-100 transition-opacity">
                                                {item.icon}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{item.name}</div>
                                                {item.desc && <div className="text-sm text-gray-500 mt-1">{item.desc}</div>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Food & Dining Section */}
            <section className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-16 items-stretch">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="bg-[#1A321A] text-white p-12 rounded-[3.5rem] flex flex-col justify-center relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <span className="text-[#C5A04D] font-black uppercase tracking-widest text-sm block mb-4">Gastronomy</span>
                                <h2 className="text-4xl font-black mb-8 tracking-tight text-white">Food & Dining</h2>
                                <p className="text-gray-300 mb-10 text-lg leading-relaxed">
                                    Experience authentic South Indian and local cuisines with our flexible meal plans. We allow outside food and offer seamless delivery services to your studio.
                                </p>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#C5A04D]/20 flex items-center justify-center text-[#C5A04D]">
                                            <FaCheckCircle />
                                        </div>
                                        <span className="font-bold tracking-wide">Pure Veg Meals Available</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-[#C5A04D]/20 flex items-center justify-center text-[#C5A04D]">
                                            <FaCheckCircle />
                                        </div>
                                        <span className="font-bold tracking-wide">Flexible Dining Timings</span>
                                    </div>
                                </div>
                            </div>
                            {/* Texture overlay */}
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {MEAL_PLANS.map((meal, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="border border-gray-100 p-8 rounded-[2.5rem] hover:border-[#C5A04D]/30 transition-colors bg-white shadow-sm flex flex-col h-full"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <h4 className="text-2xl font-black uppercase tracking-tighter">{meal.type}</h4>
                                        <div className="text-[#C5A04D] font-black text-xl">
                                            <RupeeAmount value={meal.price} />
                                        </div>
                                    </div>
                                    <p className="text-gray-500 mb-6 text-sm flex-grow">{meal.desc}</p>
                                    <ul className="space-y-3">
                                        {meal.features.map((feat, i) => (
                                            <li key={i} className="flex items-center gap-3 text-xs font-bold text-gray-700 uppercase tracking-widest">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#C5A04D]" />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Additional Info CTA */}
            <section className="py-24 px-6 bg-[#C5A04D] text-white">
                <div className="max-w-5xl mx-auto text-center">
                    <h2 className="text-4xl md:text-6xl font-black mb-10 tracking-tighter uppercase leading-none">Your comfort is our priority</h2>
                    <p className="text-xl md:text-2xl font-medium mb-12 opacity-90 max-w-3xl mx-auto">
                        Fully equipped for long-term stays with professional support available on-site.
                    </p>
                    <div className="flex flex-wrap justify-center gap-12 text-sm font-black uppercase tracking-[0.3em]">
                        <div className="flex items-center gap-3">
                            <FaWheelchair className="text-2xl" /> Wheelchair Accessible
                        </div>
                        <div className="flex items-center gap-3">
                            <FaCamera className="text-2xl" /> 24/7 CCTV Security
                        </div>
                        <div className="flex items-center gap-3">
                            <FaBolt className="text-2xl" /> 100% Power Backup
                        </div>
                    </div>
                </div>
            </section>

            <OliveStayzFooter />
        </div>
    );
}

const FACILITIES_DATA = [
    {
        title: "Basic Facilities",
        categoryIcon: <FaBuilding />,
        items: [
            { icon: <FaWifi />, name: "High-Speed Wi-Fi", desc: "Free, suitable for working remotedly." },
            { icon: <FaArrowUp />, name: "Elevator / Lift", desc: "Seamless access to all floors." },
            { icon: <FaUtensils />, name: "Kitchenette", desc: "Fully equipped for your cooking needs." },
            { icon: <FaCar />, name: "Parking Area", desc: "Gated and secure parking available." },
            { icon: <FaBolt />, name: "Power Backup", desc: "Uninterrupted power supply 24/7." },
        ]
    },
    {
        title: "Staff & Support",
        categoryIcon: <FaUserTie />,
        items: [
            { icon: <FaConciergeBell />, name: "On-site Caretaker", desc: "Assistance available throughout the stay." },
            { icon: <FaBroom />, name: "Housekeeping", desc: "Professional daily cleaning services." },
            { icon: <FaUtensils />, name: "Utensil Cleaning", desc: "Let our staff handle the dishes for you." },
            { icon: <FaSuitcase />, name: "Luggage Assistance", desc: "Help with your bags upon arrival/departure." },
            { icon: <FaConciergeBell />, name: "24/7 Reception", desc: "Dedicated desk for check-in and queries." },
        ]
    },
    {
        title: "Safety & Others",
        categoryIcon: <FaShieldAlt />,
        items: [
            { icon: <FaCamera />, name: "CCTV Surveillance", desc: "Monitored common areas and entry points." },
            { icon: <FaFireExtinguisher />, name: "Fire Safety", desc: "Extinguishers placed on every floor." },
            { icon: <FaSuitcase />, name: "Cloak Room", desc: "Secure storage for your belongings." },
            { icon: <FaCheckCircle />, name: "Self Check-in", desc: "Modern digital entry system." },
            { icon: <FaStar />, name: "Responsive Host", desc: "Quick support for a pleasant stay." },
        ]
    }
];

const MEAL_PLANS = [
    {
        type: "Breakfast",
        price: "350",
        desc: "Opt for a freshly prepared hot dish served with your choice of tea, coffee, fresh bread, and cereal.",
        features: ["Flexible Timings", "1 Hot Dish Opt", "Tea/Coffee Included"]
    },
    {
        type: "Lunch / Dinner",
        price: "450",
        desc: "Wholesome meals including a hot dish served with fresh Roti and Salad. Pure Veg options available.",
        features: ["Flexible Timings", "Hot Serving", "Roti & Salad Incl."]
    }
];

import { FaArrowUp } from "react-icons/fa";
