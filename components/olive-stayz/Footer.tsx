import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
    FaMapMarkerAlt,
    FaPhoneAlt,
    FaEnvelope,
    FaWhatsapp,
    FaClock,
    FaInstagram,
    FaFacebookF,
    FaGoogle,
} from "react-icons/fa";

const QUICK_LINKS = [
    { name: "Home", href: "/olive-stayz" },
    { name: "Rooms", href: "/olive-stayz/rooms" },
    { name: "Facilities", href: "/olive-stayz/facilities" },
    { name: "Gallery", href: "/olive-stayz/gallery" },
    { name: "Contact / Reception", href: "/receptionolivestayzk" },
];

const LEGAL_LINKS = [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/terms-of-service" },
    { name: "Sitemap", href: "/sitemap.xml" },
];

const SOCIAL_LINKS = [
    { icon: <FaInstagram size={16} />, href: "https://instagram.com", label: "Instagram" },
    { icon: <FaFacebookF size={16} />, href: "https://facebook.com", label: "Facebook" },
    {
        icon: <FaGoogle size={16} />,
        href: "https://maps.google.com",
        label: "Google",
    },
    {
        icon: <FaWhatsapp size={16} />,
        href: "https://wa.me/919599519696",
        label: "WhatsApp",
    },
];

export default function OliveStayzFooter() {
    return (
        <footer className="bg-[#0d1f0d] text-white">
            {/* Top Strip */}
            <div className="border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[#C5A04D] font-black uppercase tracking-[0.3em] text-xs">
                        Treating Every Visitor as a Very Very Important Person
                    </p>
                    <a
                        href="https://wa.me/919599519696"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#25D366] text-white text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-[#1ebe5d] transition-all active:scale-95 shadow-lg"
                    >
                        <FaWhatsapp size={14} />
                        Book via WhatsApp
                    </a>
                </div>
            </div>

            {/* Main Footer Grid */}
            <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

                {/* Column 1 — Brand */}
                <div className="flex flex-col gap-6">
                    <Link href="/olive-stayz" className="relative h-12 w-44 block">
                        <Image
                            src="/images/olive-stayz-logo-new.png"
                            alt="Olive Stayz Logo"
                            fill
                            className="object-contain brightness-0 invert"
                        />
                    </Link>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        Premium long-term accommodations redefined with affordable luxury, right in the heart of Kaushambi, Ghaziabad.
                    </p>

                    {/* Social Icons */}
                    <div className="flex gap-3 mt-2">
                        {SOCIAL_LINKS.map((s) => (
                            <a
                                key={s.label}
                                href={s.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={s.label}
                                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#C5A04D] flex items-center justify-center transition-all hover:scale-110"
                            >
                                {s.icon}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Column 2 — Contact Info */}
                <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#C5A04D] mb-7">
                        Contact Us
                    </h3>
                    <ul className="space-y-5">
                        <li className="flex items-start gap-3.5 text-gray-400 text-sm leading-relaxed group">
                            <FaMapMarkerAlt className="mt-0.5 text-[#C5A04D] shrink-0" size={14} />
                            <span>
                                A188, Sector 14, Seemant Vihar Kaushambi,<br />
                                Ghaziabad, Uttar Pradesh — 201010
                            </span>
                        </li>
                        <li>
                            <a
                                href="tel:+919599519696"
                                className="flex items-center gap-3.5 text-gray-400 text-sm hover:text-white transition-colors group"
                            >
                                <FaPhoneAlt className="text-[#C5A04D] shrink-0" size={13} />
                                +91 95995 19696
                            </a>
                        </li>
                        <li>
                            <a
                                href="mailto:info@olivestayz.com"
                                className="flex items-center gap-3.5 text-gray-400 text-sm hover:text-white transition-colors"
                            >
                                <FaEnvelope className="text-[#C5A04D] shrink-0" size={13} />
                                info@olivestayz.com
                            </a>
                        </li>
                        <li className="flex items-center gap-3.5 text-gray-400 text-sm">
                            <FaClock className="text-[#C5A04D] shrink-0" size={13} />
                            Open 24/7
                        </li>
                    </ul>
                </div>

                {/* Column 3 — Quick Links */}
                <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#C5A04D] mb-7">
                        Quick Links
                    </h3>
                    <ul className="space-y-3.5">
                        {QUICK_LINKS.map((link) => (
                            <li key={link.name}>
                                <Link
                                    href={link.href}
                                    className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group"
                                >
                                    <span className="w-0 h-[1px] bg-[#C5A04D] group-hover:w-4 transition-all duration-300" />
                                    {link.name}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Column 4 — Find Us */}
                <div>
                    <h3 className="text-sm font-black uppercase tracking-[0.25em] text-[#C5A04D] mb-7">
                        Find Us
                    </h3>
                    <a
                        href="https://maps.app.goo.gl/mymGSxHwBRo5eNDy8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#C5A04D]/40 transition-all duration-300 p-6"
                    >
                        <div className="flex items-start gap-4 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-[#C5A04D]/20 flex items-center justify-center shrink-0 group-hover:bg-[#C5A04D]/30 transition-colors">
                                <FaMapMarkerAlt className="text-[#C5A04D]" size={16} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm mb-1">Olive Stayz</p>
                                <p className="text-gray-400 text-xs leading-relaxed">
                                    A188, Sector 14, Seemant Vihar Kaushambi,<br />
                                    Ghaziabad, Uttar Pradesh — 201010
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-[#C5A04D] text-xs font-black uppercase tracking-widest group-hover:gap-3 transition-all">
                            <span>Open in Google Maps</span>
                            <span className="text-base">→</span>
                        </div>
                    </a>
                    <p className="mt-4 text-gray-500 text-xs leading-relaxed">
                        Open 24/7<br />
                        Next to Radisson Blu Hotel
                    </p>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-xs">
                        © {new Date().getFullYear()} Olive Stayz. A{" "}
                        <Link href="/" className="text-[#C5A04D] hover:text-white transition-colors">
                            VVIP Hospitality
                        </Link>{" "}
                        Venture. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        {LEGAL_LINKS.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-xs text-gray-500 hover:text-[#C5A04D] transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
