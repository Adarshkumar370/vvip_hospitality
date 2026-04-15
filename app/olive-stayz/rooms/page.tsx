"use client";

import React from "react";
import OliveStayzHeader from "@/components/olive-stayz/Header";
import OliveStayzFooter from "@/components/olive-stayz/Footer";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { FaWifi, FaPlane, FaUserTie, FaShieldAlt, FaSuitcase, FaTv, FaCoffee, FaWind, FaBed, FaShower, FaCouch } from "react-icons/fa";
import { GiWashingMachine, GiTowel } from "react-icons/gi";

const ROOM_DETAILS = [
    {
        name: "Superior Rooms",
        size: "225 Sq. Ft.",
        shortDesc: "A perfect blend of style and functional comfort.",
        longDesc: "Our Superior Rooms are designed for the modern traveler who values both aesthetics and utility. Each room features meticulously curated boutique interiors, a dedicated designer workspace, and high-quality furnishings that create a home-away-from-home atmosphere.",
        image: "/images/IMG_20260320_180335.jpg",
        amenities: [
            { icon: <FaBed />, text: "Queen Size Bed" },
            { icon: <FaWifi />, text: "High-Speed Wi-Fi" },
            { icon: <FaTv />, text: "Smart TV" },
            { icon: <FaShower />, text: "Rain Shower" },
            { icon: <FaCoffee />, text: "Kitchenette" },
            { icon: <FaWind />, text: "Air Conditioning" },
        ],
        specifications: [
            "Orthopedic Mattresses",
            "Designer Work Desk",
            "Premium Linen",
            "Electronic Safe",
            "Daily Housekeeping"
        ]
    },
    {
        name: "Executive Rooms",
        size: "275 Sq. Ft.",
        shortDesc: "The ultimate luxury experience with a view.",
        longDesc: "Experience elevated living in our Executive Rooms. These spacious units offer additional living space and a private balcony, allowing guests to enjoy Delhi's morning sun and evening breeze. Ideal for extended stays, these rooms combine premium amenities with architectural elegance.",
        image: "/images/IMG_20260319_202803.jpg",
        badge: "Most Popular",
        amenities: [
            { icon: <FaBed />, text: "Queen Size Bed" },
            { icon: <FaWifi />, text: "Ultra-Fast Wi-Fi" },
            { icon: <FaTv />, text: "55\" Smart TV" },
            { icon: <FaShower />, text: "Luxury Rain Shower" },
            { icon: <FaCouch />, text: "Lounge Area" },
            { icon: <FaWind />, text: "Climate Control" },
        ],
        specifications: [
            "Private Balcony",
            "En-suite Living Area",
            "Mini-Bar Access",
            "Premium Toiletry Kit",
            "Soundproof Windows"
        ]
    }
];

export default function RoomsPage() {
    return (
        <div className="min-h-screen bg-white text-black font-sans">
            <OliveStayzHeader />

            {/* Hero Section */}
            <section className="relative h-[60vh] mt-20 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/backrgound_1.png"
                        alt="Rooms Hero"
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
                        Accommodation
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter uppercase"
                    >
                        Our Rooms
                    </motion.h1>
                </div>
            </section>

            {/* Room Listings */}
            <section className="py-24 px-6 max-w-7xl mx-auto">
                {ROOM_DETAILS.map((room, index) => (
                    <div key={index} className={`mb-32 last:mb-0 flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-12 lg:gap-20 items-center`}>
                        {/* Image Column */}
                        <motion.div
                            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="w-full lg:w-1/2 relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl"
                        >
                            <Image
                                src={room.image}
                                alt={room.name}
                                fill
                                className="object-cover"
                            />
                            {room.badge && (
                                <div className="absolute top-8 left-8 bg-[#C5A04D] text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                                    {room.badge}
                                </div>
                            )}
                        </motion.div>

                        {/* Content Column */}
                        <motion.div
                            initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="w-full lg:w-1/2"
                        >
                            <span className="text-[#C5A04D] font-bold text-lg block mb-2">{room.size}</span>
                            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">{room.name}</h2>
                            <p className="text-xl text-gray-600 mb-8 leading-relaxed italic">
                                "{room.shortDesc}"
                            </p>
                            <p className="text-gray-500 mb-10 leading-relaxed text-lg">
                                {room.longDesc}
                            </p>

                            {/* Amenities Icons */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-10">
                                {room.amenities.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                                        <div className="text-[#C5A04D] text-xl">
                                            {item.icon}
                                        </div>
                                        {item.text}
                                    </div>
                                ))}
                            </div>

                            {/* Specifications List */}
                            <div className="space-y-3 mb-12">
                                {room.specifications.map((spec, i) => (
                                    <div key={i} className="flex items-center gap-3 text-gray-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-black" />
                                        <span className="text-sm">{spec}</span>
                                    </div>
                                ))}
                            </div>

                            <Link href="https://wa.me/919599519696">
                                <button className="px-10 py-5 bg-black text-white font-black uppercase tracking-widest text-sm rounded-full shadow-xl hover:bg-[#C5A04D] transition-all active:scale-95">
                                    Enquire Now
                                </button>
                            </Link>
                        </motion.div>
                    </div>
                ))}
            </section>

            {/* Standard Amenities Section */}
            <section className="py-24 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto text-center mb-20">
                    <span className="text-[#C5A04D] font-black uppercase tracking-widest text-sm block mb-4">Comfort First</span>
                    <h2 className="text-4xl md:text-5xl font-black">Standard Amenities</h2>
                </div>
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {STANDARD_AMENITIES.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col items-center text-center p-8 bg-white rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-lg transition-all"
                        >
                            <div className="text-[#C5A04D] mb-6 text-4xl">
                                {item.icon}
                            </div>
                            <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                            <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-4xl md:text-6xl font-black mb-10 tracking-tighter">Ready to experience boutique living?</h2>
                    <p className="text-xl text-gray-500 mb-12 italic">
                        Contact us today for reservations and long-term stay enquiries.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-6 justify-center">
                        <Link href="tel:+919599519696">
                            <button className="w-full sm:w-auto px-12 py-6 bg-black text-white font-black uppercase tracking-widest rounded-full shadow-2xl hover:bg-[#376C34] transition-all">
                                Call Us Directly
                            </button>
                        </Link>
                        <Link href="https://wa.me/919599519696">
                            <button className="w-full sm:w-auto px-12 py-6 border-2 border-black text-black font-black uppercase tracking-widest rounded-full hover:bg-black hover:text-white transition-all">
                                WhatsApp Us
                            </button>
                        </Link>
                    </div>
                </div>
            </section>

            <OliveStayzFooter />
        </div>
    );
}

const STANDARD_AMENITIES = [
    { icon: <FaWifi />, title: "Fiber Wi-Fi", desc: "Dedicated high-speed connectivity for work and leisure." },
    { icon: <GiWashingMachine />, title: "Laundry Service", desc: "Professional dry cleaning and laundry services on-site." },
    { icon: <FaShieldAlt />, title: "Secure Entry", desc: "Biometric and smart card access for maximum safety." },
    { icon: <GiTowel />, title: "Daily Cleaning", desc: "Rigorous daily housekeeping to maintain hygiene standards." },
    { icon: <FaPlane />, title: "Airport Pickup", desc: "Convenient airport transfers available on request." },
    { icon: <FaUserTie />, title: "Concierge", desc: "24/7 dedicated assistance for all your travel needs." },
    { icon: <FaSuitcase />, title: "Storage", desc: "Safe and secure luggage storage for your convenience." },
    { icon: <FaShower />, title: "Modern Bath", desc: "Rain showers and premium toiletries in every room." },
];
