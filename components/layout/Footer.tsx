import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants/config";
import { Mail, MapPin, Phone, Instagram, Facebook, Clock } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-brand-soft-gray text-brand-olive-dark pt-20 pb-10 px-6 border-t border-gray-100">
            <div className="mx-auto max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand & Tagline */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <span className="font-serif text-2xl font-extrabold tracking-tight">
                                VVIP <span className="text-brand-gold-dark">HOSPITALITY</span>
                            </span>
                        </Link>
                        <p className="text-gray-600 text-sm leading-relaxed max-w-xs font-medium">
                            {SITE_CONFIG.tagline}. Providing premium stays and professional B2B bakery solutions.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" aria-label="Instagram" className="h-10 w-10 flex items-center justify-center rounded-full border border-brand-olive-dark/10 hover:bg-brand-gold-bright hover:border-brand-gold-bright hover:text-white transition-colors">
                                <Instagram size={18} />
                            </a>
                            <a href="#" aria-label="Facebook" className="h-10 w-10 flex items-center justify-center rounded-full border border-brand-olive-dark/10 hover:bg-brand-gold-bright hover:border-brand-gold-bright hover:text-white transition-colors">
                                <Facebook size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="text-lg font-bold font-serif">Quick Links</h4>
                        <ul className="space-y-4">
                            <li><Link href="/olive-stayz" className="text-gray-500 hover:text-brand-gold-bright transition-colors text-sm font-semibold">Olive Stayz</Link></li>
                            <li><Link href="/bakery" className="text-gray-500 hover:text-brand-gold-bright transition-colors text-sm font-semibold">VVIP Bakery</Link></li>
                            <li><Link href="/about-us" className="text-gray-500 hover:text-brand-gold-bright transition-colors text-sm font-semibold">About Us</Link></li>
                            <li><Link href="/contact" className="text-gray-500 hover:text-brand-gold-bright transition-colors text-sm font-semibold">Contact Us</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-6">
                        <h4 className="text-lg font-bold font-serif">Contact Info</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 group">
                                <MapPin size={18} className="text-brand-gold-bright shrink-0 mt-1" />
                                <span className="text-gray-600 text-sm leading-relaxed group-hover:text-brand-olive-dark transition-colors font-medium">
                                    {SITE_CONFIG.hq}
                                </span>
                            </li>
                            <li className="flex items-center gap-3 group">
                                <Phone size={18} className="text-brand-gold-bright shrink-0" />
                                <a href={`tel:${SITE_CONFIG.whatsapp}`} className="text-gray-600 text-sm group-hover:text-brand-olive-dark transition-colors font-medium">
                                    {SITE_CONFIG.whatsapp}
                                </a>
                            </li>
                            <li className="flex items-center gap-3 group">
                                <Clock size={18} className="text-brand-gold-bright shrink-0" />
                                <span className="text-gray-600 text-sm font-medium">
                                    {SITE_CONFIG.operations}
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Locations & SEO */}
                    <div className="space-y-6">
                        <h4 className="text-lg font-bold font-serif">Locations</h4>
                        <ul className="space-y-4">
                            <li className="text-gray-500 text-xs italic leading-relaxed font-medium">
                                Serving Kaushambi and surrounding areas.
                            </li>
                            <li className="pt-2">
                                <h5 className="text-[10px] uppercase tracking-widest text-brand-olive-dark font-bold mb-2">Service Keywords</h5>
                                <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                                    {SITE_CONFIG.keywords.map((k) => (
                                        <span key={k}>{k}</span>
                                    ))}
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-tighter text-gray-400">
                    <p>© {new Date().getFullYear()} VVIP Hospitality Group. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/privacy-policy" className="hover:text-brand-olive-dark transition-colors">Privacy Policy</Link>
                        <Link href="/terms-of-service" className="hover:text-brand-olive-dark transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
