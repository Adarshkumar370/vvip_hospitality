"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Hotel, Utensils } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect } from "react";

const carouselImages = [
    "/images/hospitality_hero_bg_1768770099129.png",
    "/images/olive_stayz_room_1768770065041.png",
    "/images/vvip_bakery_kitchen_1768770081695.png",
];

export default function Hero() {
    const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

    return (
        <section className="relative h-screen flex items-center justify-center overflow-hidden bg-background">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 z-0 bg-mesh opacity-30" />
            <div className="absolute inset-0 z-0 bg-pattern opacity-[0.03] dark:opacity-[0.05]" />

            {/* Background Carousel */}
            <div className="absolute inset-0 z-0" ref={emblaRef}>
                <div className="flex h-full">
                    {carouselImages.map((src, index) => (
                        <div key={index} className="relative flex-[0_0_100%] h-full">
                            <Image
                                src={src}
                                alt={index === 0 ? "VVIP Hospitality luxurious hotel lobby" : index === 1 ? "Olive Stayz premium hotel room interior" : "VVIP Bakery professional kitchen"}
                                fill
                                className="object-cover opacity-40 dark:opacity-40 transition-opacity duration-1000"
                                priority={index === 0}
                                sizes="100vw"
                                quality={85}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/20 to-background z-[1]" />

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <h1 className="text-5xl md:text-8xl font-bold text-foreground mb-8 tracking-tighter leading-[1.1]">
                        VVIP Hospitality:<br />
                        <span className="text-gold">Excellence</span> Reimagined.
                    </h1>
                    <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 font-medium">
                        Redefining the standards of comfort and taste. From premium budget stays
                        to professional B2B bakery solutions.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link
                            href="/olive-stayz"
                            className="group relative inline-flex items-center gap-3 bg-olive hover:bg-olive/90 text-white px-10 py-5 rounded-full text-lg font-bold transition-all shadow-2xl hover:shadow-olive/20 hover:-translate-y-1"
                        >
                            <Hotel size={24} />
                            Explore Olive Stayz
                            <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
                        </Link>

                        <Link
                            href="/#vvip-bakery"
                            className="group relative inline-flex items-center gap-3 bg-gold hover:bg-gold/90 text-white px-10 py-5 rounded-full text-lg font-bold transition-all shadow-2xl hover:shadow-gold/20 hover:-translate-y-1"
                        >
                            <Utensils size={24} />
                            Visit VVIP Bakery
                            <ArrowRight className="transition-transform group-hover:translate-x-1" size={20} />
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Bottom Gradient for smooth transition */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[2]" />
        </section>
    );
}
