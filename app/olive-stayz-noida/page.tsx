"use client";

import Image from "next/image";
import Link from "next/link";
import {
    ChevronLeft,
    MapPin,
    Info
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyDetails from "@/components/PropertyDetails";

export default function NoidaPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Hero Header */}
            <section className="relative pt-32 pb-20 bg-charcoal text-white overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full opacity-20">
                    <Image
                        src="/images/olive_stayz_room_1768770065041.png"
                        alt="Background Deco"
                        fill
                        className="object-cover"
                    />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <Link href="/#olive-stayz" className="inline-flex items-center gap-2 text-white/60 hover:text-gold transition-colors mb-8">
                        <ChevronLeft size={20} /> Back to Home
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div>
                            <h1 className="text-4xl md:text-6xl font-bold mb-4">Olive Stayz - Noida</h1>
                            <div className="flex items-center gap-2 text-white font-medium bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg inline-flex">
                                <MapPin size={20} className="text-gold" />
                                <span>Sector 144, Noida, UP (Near Advant & Oxygen Business Park)</span>
                            </div>
                        </div>
                        <button className="bg-olive text-white px-10 py-4 rounded-full font-bold shadow-xl hover:bg-olive/90 transition-all hover:-translate-y-1">
                            Book Direct: +91 9999 000 000
                        </button>
                    </div>
                </div>
            </section>

            {/* Property Details Section */}
            <PropertyDetails location="Noida" />

            <div className="h-20" /> {/* Spacer */}

            <Footer />
        </main>
    );
}
