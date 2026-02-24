"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { VVIP_BAKERY } from "@/lib/constants/bakery";

export default function BakeryProducts() {
    return (
        <section className="py-32 px-6 max-w-7xl mx-auto w-full">
            <div className="text-center mb-20">
                <span className="text-brand-gold-bright text-[10px] font-black uppercase tracking-[0.4em] mb-4 block">Our Gourmet Collection</span>
                <h2 className="text-4xl md:text-6xl font-serif font-black mb-6 text-brand-olive-dark tracking-tight">Signature <span className="text-brand-gold-bright italic">Creations</span></h2>
                <p className="text-gray-500 max-w-2xl mx-auto text-lg font-medium">Explore some of our most requested B2B items, crafted fresh daily.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {VVIP_BAKERY.products.map((product, idx) => (
                    <motion.div
                        key={product.name}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        viewport={{ once: true }}
                        className="group relative bg-brand-soft-gray rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-premium transition-all duration-500"
                    >
                        <div className="aspect-square relative overflow-hidden">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-olive-dark/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>
                        <div className="p-8 text-center relative z-10">
                            <span className="text-brand-gold-bright text-[10px] font-black uppercase tracking-[0.2em] mb-2 block">{product.category}</span>
                            <h3 className="text-2xl font-serif font-black text-brand-olive-dark tracking-tight">{product.name}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
