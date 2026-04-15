"use client";

import React, { useState, useEffect } from "react";
import OliveStayzHeader from "@/components/olive-stayz/Header";
import OliveStayzFooter from "@/components/olive-stayz/Footer";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const BACKGROUND_IMAGES = [
    "/images/backrgound_1.png",
    "/images/background_2.png"
];

export default function OliveStayz() {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
        }, 5000); // 5 seconds

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <OliveStayzHeader />

            {/* Hero Section with Responsive Slider Layout - Padded for Header */}
            <section className="relative h-[calc(100vh-80px)] mt-20 w-full flex flex-col lg:grid lg:grid-cols-[45%_55%] overflow-hidden bg-white">

                {/* Left Side: Content (Desktop) / Overlay (Mobile) */}
                <div className="relative z-20 flex flex-col justify-center px-6 md:px-12 lg:px-20 py-20 h-full bg-white order-2 lg:order-1 border-r border-gray-100">
                    {/* Mobile Background (Hidden on Desktop) */}
                    <div className="absolute inset-0 lg:hidden pointer-events-none">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={BACKGROUND_IMAGES[currentImageIndex]}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.5, ease: "easeInOut" }}
                                className="absolute inset-0 z-0"
                            >
                                <Image
                                    src={BACKGROUND_IMAGES[currentImageIndex]}
                                    alt="Olive Stayz Background Mobile"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                                {/* Dark Overlay for mobile readability */}
                                <div className="absolute inset-0 bg-black/60 backdrop-brightness-75" />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Content Area */}
                    <div className="relative z-10 text-left">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 1 }}
                            className="mb-4"
                        >
                            <span className="text-[#C5A04D] font-black uppercase tracking-[0.3em] text-xs">Premium Living</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="text-5xl md:text-7xl lg:text-8xl font-black text-black mb-8 tracking-tighter leading-[0.9] lg:max-w-md"
                        >
                            <span className="lg:text-black text-white brightness-200 lg:brightness-100 uppercase">Olive <br /> Stayz</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7, duration: 1 }}
                            className="text-lg md:text-xl lg:text-2xl text-black/70 lg:text-black/60 max-w-lg font-medium leading-relaxed mb-12"
                        >
                            <span className="lg:text-inherit text-gray-200">
                                Affordable luxury for long-term stays. Experience premium comfort and boutique style without the premium price tag.
                            </span>
                        </motion.p>

                        {/* Desktop Action */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.9, duration: 1 }}
                            className="hidden lg:block"
                        >
                            <Link href="/olive-stayz/rooms">
                                <button className="px-10 py-5 bg-black text-white font-black uppercase tracking-widest text-sm rounded-full shadow-2xl hover:bg-[#C5A04D] transition-all active:scale-95">
                                    Explore Our Collection
                                </button>
                            </Link>
                        </motion.div>
                    </div>
                </div>

                {/* Right Side: Image Slider (Desktop) */}
                <div className="hidden lg:block relative h-full w-full overflow-hidden order-1 lg:order-2 bg-black">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={BACKGROUND_IMAGES[currentImageIndex]}
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                            className="absolute inset-0"
                        >
                            <Image
                                src={BACKGROUND_IMAGES[currentImageIndex]}
                                alt="Olive Stayz Background Desktop"
                                fill
                                className="object-cover"
                                priority
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            {/* Property Highlights Section */}
            <section className="py-24 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <span className="text-[#C5A04D] font-black uppercase tracking-widest text-sm block mb-4">The Experience</span>
                        <h2 className="text-4xl md:text-5xl font-black text-black">Property Highlights</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {HIGHLIGHTS_DATA.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group"
                            >
                                <div className="text-[#C5A04D] mb-6 transition-transform group-hover:scale-110 duration-300">
                                    {item.icon}
                                </div>
                                <p className="text-gray-700 leading-relaxed font-medium">
                                    {item.text}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Room Types Section - Animated List */}
            <section className="py-24 px-6 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="mb-16"
                    >
                        <span className="text-[#C5A04D] font-black uppercase tracking-widest text-sm block mb-4">Accommodation</span>
                        <h2 className="text-4xl md:text-5xl font-black text-black">Choose Your Stay</h2>
                        <p className="mt-6 text-gray-500 max-w-2xl text-lg">
                            Discover our elegantly designed rooms featuring modern interiors, premium furniture, and all the comforts of home.
                        </p>
                    </motion.div>

                    <div className="space-y-6">
                        {ROOM_DATA.map((room, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="group relative bg-gray-50 rounded-[3rem] overflow-hidden flex flex-col lg:flex-row items-stretch min-h-[400px] border border-gray-100 hover:border-[#C5A04D]/30 transition-colors"
                            >
                                <div className="w-full lg:w-1/2 relative h-64 lg:h-auto">
                                    <Image
                                        src={room.image}
                                        alt={room.name}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    {room.badge && (
                                        <div className="absolute top-8 left-8 bg-[#C5A04D] text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                                            {room.badge}
                                        </div>
                                    )}
                                </div>
                                <div className="w-full lg:w-1/2 p-10 lg:p-16 flex flex-col justify-center">
                                    <h3 className="text-3xl font-black text-black mb-4">{room.name}</h3>
                                    <p className="text-[#C5A04D] font-bold mb-6">{room.size}</p>
                                    <p className="text-gray-600 mb-8 leading-relaxed text-lg">
                                        {room.description}
                                    </p>
                                    <div className="grid grid-cols-2 gap-4">
                                        {room.features.slice(0, 4).map((feat, i) => (
                                            <div key={i} className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-[#C5A04D]" />
                                                {feat}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-10">
                                        <Link href="/olive-stayz/rooms">
                                            <button className="text-black font-black uppercase tracking-widest text-xs border-b-2 border-black pb-1 hover:text-[#C5A04D] hover:border-[#C5A04D] transition-all">
                                                View Details
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Activities & Connectivity - Combined Section */}
            <section className="py-24 px-6 bg-black text-white">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">
                    {/* Activities */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-12"
                        >
                            <span className="text-[#C5A04D] font-black uppercase tracking-widest text-sm block mb-4">Explore</span>
                            <h2 className="text-4xl font-black text-white">Nearby Attractions</h2>
                        </motion.div>

                        <div className="space-y-8">
                            {ATTRACTIONS_DATA.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex items-start gap-6 group"
                                >
                                    <div className="text-3xl font-black text-[#C5A04D] opacity-40 group-hover:opacity-100 transition-opacity">
                                        {String(index + 1).padStart(2, '0')}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2 text-white group-hover:text-[#C5A04D] transition-colors">{item.name}</h4>
                                        <p className="text-gray-400 text-sm leading-relaxed">{item.details}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Reachability */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="mb-12"
                        >
                            <span className="text-[#C5A04D] font-black uppercase tracking-widest text-sm block mb-4">Location</span>
                            <h2 className="text-4xl font-black text-white">How to Reach Us</h2>
                        </motion.div>

                        <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/10 backdrop-blur-sm">
                            <div className="space-y-6">
                                {REACH_DATA.map((item, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.05 }}
                                        className="flex justify-between items-center py-4 border-b border-white/5 last:border-0"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-gray-500 group-hover:text-white transition-colors">
                                                {item.icon}
                                            </div>
                                            <span className="text-gray-300 font-medium">{item.point}</span>
                                        </div>
                                        <span className="text-sm font-black text-[#C5A04D]">{item.dist}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <OliveStayzFooter />
        </div>
    );
}

// --- Data ---

const HIGHLIGHTS_DATA = [
    { icon: <FaWifi size={32} />, text: "Complimentary high-speed Wi-Fi access throughout the property." },
    { icon: <FaPlane size={32} />, text: "Seamless airport transfers for a hassle-free travel experience." },
    { icon: <FaUserTie size={32} />, text: "Professional concierge services available for your every need." },
    { icon: <GiWashingMachine size={32} />, text: "Efficient dry cleaning and laundry services on-site." },
    { icon: <FaShieldAlt size={32} />, text: "In-room electronic safes for secure storage of your belongings." },
    { icon: <FaSuitcase size={32} />, text: "Dedicated luggage storage and a travel desk for trip planning." },
];

const ROOM_DATA = [
    {
        name: "Superior Rooms",
        size: "225 Sq. Ft.",
        description: "Our Superior Rooms offer a perfect blend of style and comfort, featuring designer workspaces and premium boutique interiors.",
        image: "/images/IMG_20260320_180335.jpg",
        features: ["Queen Size Bed", "Free Wi-Fi", "Smart TV", "Modern Kitchenette", "Rain Shower"],
        badge: null
    },
    {
        name: "Executive Rooms",
        size: "275 Sq. Ft.",
        description: "Experience the ultimate in luxury with our Executive cases. These rooms feature a private balcony to enjoy fresh air and morning sunlight.",
        image: "/images/IMG_20260319_202803.jpg",
        features: ["Queen Size Bed", "Private Balcony", "Designer Workspace", "Smart TV", "Rain Shower", "Electronic Safe"],
        badge: "Most Popular"
    }
];

const ATTRACTIONS_DATA = [
    { name: "Sanjay Lake", details: "Enjoy serene boating experiences just 8.6 km away." },
    { name: "Retail Therapy", details: "Shipra Mall (4.5 km) and Mahagun Metro Mall (2.2 km) nearby." },
    { name: "Akshardham Temple", details: "A magnificent spiritual site just a 10-minute drive away." },
    { name: "Red Fort", details: "Historical exploration within a 25-minute scenic drive." },
    { name: "City Landmarks", details: "India Gate and Connaught Place are just 20 minutes away." },
];

const REACH_DATA = [
    { point: "IGI Airport", dist: "30.5 KM", icon: <FaPlane /> },
    { point: "Hindon Airport", dist: "12.2 KM", icon: <FaPlane /> },
    { point: "Anand Vihar Terminal", dist: "1.5 KM", icon: <FaTrain /> },
    { point: "Kaushambi Metro", dist: "0.8 KM", icon: <FaSubway /> },
];

import { FaWifi, FaPlane, FaUserTie, FaShieldAlt, FaSuitcase, FaTrain, FaSubway } from "react-icons/fa";
import { GiWashingMachine } from "react-icons/gi";
