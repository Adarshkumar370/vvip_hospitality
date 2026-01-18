"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    Wifi,
    Tv,
    Wind,
    Car,
    Coffee,
    ShieldCheck,
    Users,
    Bed,
    Bath,
    MapPin,
    Phone,
    FileText,
    DoorOpen,
    Info
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PropertyDetails from "@/components/PropertyDetails";

const amenities = [
    { icon: ShieldCheck, label: "24 x 7 Security surveillance" },
    { icon: Wind, label: "Air Conditioning" },
    { icon: Tv, label: "Smart TV" },
    { icon: Car, label: "Car Parking" },
    { icon: Coffee, label: "Electric kettle" },
    { icon: FileText, label: "GST Invoicing" },
    { icon: Wifi, label: "High speed Wi-Fi" },
    { icon: Bath, label: "Hot & Cold showers" },
    { icon: DoorOpen, label: "Open Terrace" },
    { icon: Bed, label: "Workstation" },
];

const policies = [
    {
        title: "General Policy",
        content: "In keeping with Government regulations, we request all guests (on single/double/triple occupancy) to carry a photo identity to present at check-in. Foreign nationals are required to present their valid passport and visa. PAN Card will not be accepted. Also do keep handy proof of corporate affiliations, if you have made a corporate booking."
    },
    {
        title: "Payment Policy",
        content: "For Group & Bulk Bookings (More than 3 Rooms or Total 10 Room nights), Corporate and Social Event and Conferences, all bookings must be guaranteed at the time of reservation by a 25% pre-payment of the booking amount."
    },
    {
        title: "House Rules",
        details: [
            { label: "Smoking", value: "Allowed (Only in Rooms with Balcony)" },
            { label: "Visitors Allowed", value: "Yes" },
            { label: "Unmarried Couples", value: "Allowed" },
            { label: "Children Allowed", value: "Yes" },
        ]
    }
];

export default function KaushambiPage() {
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
                            <h1 className="text-4xl md:text-6xl font-bold mb-4">Olive Stayz - Kaushambi</h1>
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

            {/* Main Content */}
            {/* Property Details Section */}
            <PropertyDetails location="Kaushambi" />

            <div className="h-20" /> {/* Spacer */}

            <Footer />
        </main>
    );
}
