"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin, Send, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-charcoal text-white pt-24 pb-12 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="mb-24">
                    {/* Company Info */}
                    <div className="max-w-2xl">
                        <Link href="/" className="text-3xl font-bold tracking-tighter mb-8 block">
                            VVIP<span className="text-gold">HOSPITALITY</span>
                        </Link>
                        <p className="text-white/80 text-lg mb-8 max-w-md font-medium">
                            A diversified hospitality group committed to excellence in urban living
                            and gourmet bakery solutions. Redefining standards since inception.
                        </p>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-4 text-white/80">
                                <MapPin className="text-gold" size={20} />
                                <span>Sector 142, Near Advant Business Park, Noida, UP</span>
                            </div>
                            <div className="flex items-center gap-4 text-white/80">
                                <Phone className="text-gold" size={20} />
                                <span>+91 9999 000 000</span>
                            </div>
                            <div className="flex items-center gap-4 text-white/80">
                                <Mail className="text-gold" size={20} />
                                <span>hello@vviphospitality.com</span>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            {[{ Icon: Instagram, label: "Instagram" }, { Icon: Facebook, label: "Facebook" }, { Icon: Linkedin, label: "LinkedIn" }].map((social, i) => (
                                <a
                                    key={i}
                                    href="#"
                                    className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center hover:bg-gold hover:text-white transition-all"
                                    aria-label={social.label}
                                >
                                    <social.Icon size={20} aria-hidden="true" />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-white/10 flex flex-col md:row items-center justify-between gap-6">
                    <p className="text-white/40 text-sm">
                        © 2026 VVIP Hospitality Group. All rights reserved.
                    </p>
                    <div className="flex gap-8 text-sm text-white/40">
                        <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
