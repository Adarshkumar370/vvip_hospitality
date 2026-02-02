"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Hotel, Utensils } from "lucide-react";
import { SITE_CONFIG } from "@/lib/constants";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const Verticals = dynamic(() => import("@/components/home/Verticals").then(mod => mod.Verticals));
const TrustSection = dynamic(() => import("@/components/home/TrustSection").then(mod => mod.TrustSection));

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section - Airy & Light */}
      <section className="relative h-screen min-h-[700px] w-full overflow-hidden flex items-center justify-center bg-white">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-soft-gray -skew-x-12 translate-x-1/2 z-0" />
        <div className="absolute bottom-0 left-0 w-1/4 h-64 bg-brand-gold-bright/5 rounded-full blur-3xl z-0" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center lg:text-left flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <motion.div
            initial={{ opacity: 0.1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex-1 lg:pr-10"
          >
            <span className="inline-block px-5 py-2 rounded-full bg-brand-gold-bright/10 text-brand-gold-bright text-xs font-black uppercase tracking-[0.3em] mb-8">
              Welcome to Excellence
            </span>
            <h1 className="text-5xl md:text-7xl lg:text-[6.5rem] font-serif font-black mb-10 leading-[1.1] text-brand-olive-dark tracking-tight">
              Elevating <span className="text-brand-gold-bright">Hospitality</span> <br className="hidden lg:block" />
              to an Art Form
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mb-12 font-medium leading-relaxed">
              Every visitor is treated as a Very Very Important Person. Discover boutique stays and gourmet B2B solutions tailored for excellence.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start">
              <Link
                href="/olive-stayz"
                className="group flex items-center gap-3 bg-brand-olive-dark text-white px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-brand-gold-bright transition-all shadow-[0_20px_50px_rgba(45,62,45,0.2)] active:scale-95 w-full sm:w-auto justify-center"
              >
                Explore Olive Stayz
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/bakery"
                className="group flex items-center gap-3 bg-white text-brand-olive-dark border border-gray-100 px-10 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:border-brand-gold-bright hover:text-brand-gold-bright transition-all shadow-sm active:scale-95 w-full sm:w-auto justify-center"
              >
                VVIP Bakery B2B
              </Link>
            </div>
          </motion.div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0.1, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 w-full max-w-lg aspect-[4/5] md:aspect-square bg-brand-soft-gray rounded-[3rem] md:rounded-[5rem] relative overflow-hidden shadow-premium"
          >
            <Image
              src="/images/hero_hospitality.png"
              alt="Premium Hospitality"
              fill
              priority
              {...({ fetchPriority: "high" } as any)}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>
        </div>
      </section>

      <Verticals />
      <TrustSection />
    </div>
  );
}
