"use client";

import React, { useState, useCallback, useEffect } from "react";
import OliveStayzHeader from "@/components/olive-stayz/Header";
import OliveStayzFooter from "@/components/olive-stayz/Footer";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes, FaChevronLeft, FaChevronRight, FaExpand } from "react-icons/fa";

const GALLERY_IMAGES = [
  { src: "/images/gallery/DSC05989.jpg", alt: "Olive Stayz Property", category: "Property" },
  { src: "/images/gallery/DSC05999.jpg", alt: "Olive Stayz Interior", category: "Interior" },
  { src: "/images/gallery/DSC06076.jpg", alt: "Olive Stayz Room", category: "Rooms" },
  { src: "/images/gallery/DSC06079.jpg", alt: "Olive Stayz Room View", category: "Rooms" },
  { src: "/images/gallery/DSC06083.jpg", alt: "Olive Stayz Suite", category: "Rooms" },
  { src: "/images/gallery/DSC06090.jpg", alt: "Olive Stayz Amenities", category: "Amenities" },
  { src: "/images/gallery/DSC06091.jpg", alt: "Olive Stayz Amenities Detail", category: "Amenities" },
  { src: "/images/gallery/DSC06121.jpg", alt: "Olive Stayz Space", category: "Interior" },
  { src: "/images/gallery/DSC06122.jpg", alt: "Olive Stayz Living Area", category: "Interior" },
  { src: "/images/gallery/Digtal Safe.jpg", alt: "Digital Safe", category: "Amenities" },
  { src: "/images/gallery/IMG_20260319_175909.jpg", alt: "Olive Stayz View", category: "Property" },
  { src: "/images/gallery/IMG_20260319_181226.jpg", alt: "Olive Stayz Exterior", category: "Property" },
  { src: "/images/gallery/IMG_20260319_181702.jpg", alt: "Olive Stayz Surroundings", category: "Property" },
  { src: "/images/gallery/IMG_20260319_202803.jpg", alt: "Olive Stayz Evening", category: "Property" },
  { src: "/images/gallery/IMG_20260319_204138.jpg", alt: "Olive Stayz Night", category: "Property" },
  { src: "/images/gallery/IMG_20260320_180335.jpg", alt: "Olive Stayz Room Interior", category: "Rooms" },
  { src: "/images/gallery/IMG_20260320_181248.jpg", alt: "Olive Stayz Room Detail", category: "Rooms" },
  { src: "/images/gallery/IMG_20260320_195504.jpg", alt: "Olive Stayz Workspace", category: "Interior" },
  { src: "/images/gallery/IMG_20260320_214547.jpg", alt: "Olive Stayz Night View", category: "Property" },
  { src: "/images/gallery/IMG_20260323_201028.jpg", alt: "Olive Stayz Common Area", category: "Interior" },
  { src: "/images/gallery/Lift.jpg", alt: "Lift", category: "Amenities" },
  { src: "/images/gallery/Tea Coffee Maker.jpg", alt: "Tea & Coffee Maker", category: "Amenities" },
  { src: "/images/gallery/Wheelchair acessible.jpg", alt: "Wheelchair Accessible", category: "Amenities" },
  { src: "/images/gallery/olive stays-2Artboard 1.jpg", alt: "Olive Stayz Branding", category: "Property" },
];

const CATEGORIES = ["All", "Property", "Rooms", "Interior", "Amenities"];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredImages =
    activeCategory === "All"
      ? GALLERY_IMAGES
      : GALLERY_IMAGES.filter((img) => img.category === activeCategory);

  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + filteredImages.length) % filteredImages.length);
  }, [lightboxIndex, filteredImages.length]);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filteredImages.length);
  }, [lightboxIndex, filteredImages.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, goPrev, goNext]);

  return (
    <div className="min-h-screen bg-white">
      <OliveStayzHeader />

      {/* Page Hero */}
      <section className="pt-32 pb-16 px-6 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-[#C5A04D] font-black uppercase tracking-[0.3em] text-xs block mb-4">
              Visual Journey
            </span>
            <h1 className="text-5xl md:text-7xl font-black text-black tracking-tighter leading-[0.9] mb-6">
              Our Gallery
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mt-4">
              Explore our spaces — from elegantly designed rooms to thoughtfully curated amenities — all crafted for your perfect stay.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-10 px-6 bg-white sticky top-20 z-40 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 ${
                  activeCategory === cat
                    ? "bg-black text-white border-black shadow-lg scale-105"
                    : "bg-white text-black border-gray-200 hover:border-[#C5A04D] hover:text-[#C5A04D]"
                }`}
              >
                {cat}
              </button>
            ))}
            <span className="ml-auto self-center text-xs text-gray-400 font-medium">
              {filteredImages.length} photos
            </span>
          </div>
        </div>
      </section>

      {/* Masonry Gallery Grid */}
      <section className="py-12 px-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <motion.div
            layout
            className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredImages.map((image, index) => (
                <motion.div
                  key={image.src}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                  className="break-inside-avoid mb-4 group relative overflow-hidden rounded-2xl cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
                  onClick={() => setLightboxIndex(index)}
                >
                  <div className="relative w-full">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={600}
                      height={400}
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[#C5A04D] text-xs font-black uppercase tracking-widest block">
                            {image.category}
                          </span>
                          <p className="text-white text-sm font-bold mt-1">{image.alt}</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-full">
                          <FaExpand size={14} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredImages.length === 0 && (
            <div className="text-center py-32 text-gray-400">
              <p className="text-2xl font-black">No images found</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all z-10"
              onClick={closeLightbox}
            >
              <FaTimes size={20} />
            </button>

            {/* Counter */}
            <div className="absolute top-6 left-6 text-white text-sm font-bold z-10 bg-white/10 px-4 py-2 rounded-full">
              {lightboxIndex + 1} / {filteredImages.length}
            </div>

            {/* Prev Button */}
            <button
              className="absolute left-4 md:left-8 text-white bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all z-10"
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
            >
              <FaChevronLeft size={20} />
            </button>

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3 }}
              className="relative w-[calc(100vw-2rem)] max-w-5xl max-h-[75svh] mx-4 md:mx-24 flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={filteredImages[lightboxIndex].src}
                alt={filteredImages[lightboxIndex].alt}
                width={1200}
                height={800}
                className="max-h-[75svh] max-w-full w-full h-auto object-contain rounded-2xl shadow-2xl"
                priority
              />
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-2xl">
                <span className="text-[#C5A04D] text-xs font-black uppercase tracking-widest block">
                  {filteredImages[lightboxIndex].category}
                </span>
                <p className="text-white font-bold mt-1">{filteredImages[lightboxIndex].alt}</p>
              </div>
            </motion.div>

            {/* Next Button */}
            <button
              className="absolute right-4 md:right-8 text-white bg-white/10 hover:bg-white/20 p-4 rounded-full transition-all z-10"
              onClick={(e) => { e.stopPropagation(); goNext(); }}
            >
              <FaChevronRight size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <OliveStayzFooter />
    </div>
  );
}
