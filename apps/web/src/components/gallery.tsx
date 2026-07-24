"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Maximize2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@klipai/ui/components/button";
import { cn } from "@klipai/ui/lib/utils";

const galleryItems = [
  {
    id: "1",
    type: "video",
    title: "Kota Cyberpunk Malam Hari",
    prompt:
      "Metropolis cyberpunk bercahaya neon di malam hari, mobil terbang, kabut volumetrik, sinematik 8K",
    model: "SVD-XT",
    duration: "4d",
    resolution: "1080p",
    thumbnail: "/assets/gallery-1.jpg",
    tags: ["T2V", "Sinematik"],
    accent: "from-purple-600/30 to-pink-600/20",
    tagColor: "bg-purple-500/20 border-purple-500/30 text-purple-200",
  },
  {
    id: "2",
    type: "video",
    title: "Ombak Laut Makro Emas",
    prompt:
      "Close-up ekstrem gelombang laut kristal, pencahayaan golden hour, fotografi makro, 4K",
    model: "Gen-2",
    duration: "3d",
    resolution: "4K",
    thumbnail: "/assets/gallery-2.jpg",
    tags: ["T2V", "Alam"],
    accent: "from-cyan-600/30 to-blue-600/20",
    tagColor: "bg-cyan-500/20 border-cyan-500/30 text-cyan-200",
  },
  {
    id: "3",
    type: "video",
    title: "Animasi Potret dari Foto",
    prompt:
      "Animasi potret halus, pernapasan alami, gerakan mata, senyum lembut, pencahayaan sinematik",
    model: "AnimateDiff",
    duration: "5d",
    resolution: "1080p",
    thumbnail: "/assets/gallery-3.jpg",
    tags: ["I2V", "Potret"],
    accent: "from-pink-600/30 to-rose-600/20",
    tagColor: "bg-pink-500/20 border-pink-500/30 text-pink-200",
  },
  {
    id: "4",
    type: "video",
    title: "Alih Gaya: Lukisan Minyak",
    prompt:
      "Alih gaya malam berbintang Van Gogh pada timelapse kota, sapuan kuas tebal, warna vibrant",
    model: "Ebsynth",
    duration: "6d",
    resolution: "1080p",
    thumbnail: "/assets/gallery-4.jpg",
    tags: ["V2V", "Artistik"],
    accent: "from-amber-600/30 to-orange-600/20",
    tagColor: "bg-amber-500/20 border-amber-500/30 text-amber-200",
  },
  {
    id: "5",
    type: "image",
    title: "Seni Konsep: Lanskap Alien",
    prompt:
      "Dunia alien dengan flora bioluminesensi, dua matahari, pulau melayang, concept art ArtStation",
    model: "SDXL",
    resolution: "1024×1024",
    thumbnail: "/assets/feat-t2i.jpg",
    tags: ["T2I", "Sci-Fi"],
    accent: "from-violet-600/30 to-indigo-600/20",
    tagColor: "bg-violet-500/20 border-violet-500/30 text-violet-200",
  },
  {
    id: "6",
    type: "video",
    title: "Kontrol Gerakan: Orbit Kamera",
    prompt:
      "Foto produk jam tangan mewah, jalur kamera orbital presisi, detail makro, pencahayaan studio",
    model: "MotionCtrl",
    duration: "4d",
    resolution: "4K",
    thumbnail: "/assets/feat-motion.jpg",
    tags: ["CTRL", "Produk"],
    accent: "from-emerald-600/30 to-teal-600/20",
    tagColor: "bg-emerald-500/20 border-emerald-500/30 text-emerald-200",
  },
  {
    id: "7",
    type: "video",
    title: "Animasi Karakter: Tarian",
    prompt:
      "Karakter anime menari di taman sakura, gerakan fluid, kelopak sakura, 60fps",
    model: "AnimateDiff",
    duration: "5d",
    resolution: "1080p",
    thumbnail: "/assets/feat-i2v.jpg",
    tags: ["I2V", "Anime"],
    accent: "from-pink-600/30 to-fuchsia-600/20",
    tagColor: "bg-pink-500/20 border-pink-500/30 text-pink-200",
  },
  {
    id: "8",
    type: "image",
    title: "Visualisasi Arsitektur",
    prompt:
      "Rumah kaca modern di tebing, matahari terbenam, pemandangan laut, fotografi arsitektur, 8K",
    model: "Midjourney v6",
    resolution: "2048×2048",
    thumbnail: "/assets/feat-i2i.jpg",
    tags: ["T2I", "Arsitektur"],
    accent: "from-sky-600/30 to-blue-600/20",
    tagColor: "bg-sky-500/20 border-sky-500/30 text-sky-200",
  },
];

const filters = ["Semua", "Video", "Gambar", "Kontrol Gerakan"];

export function Gallery() {
  const [activeFilter, setActiveFilter] = useState("Semua");

  const filtered = galleryItems.filter((item) => {
    if (activeFilter === "Semua") return true;
    if (activeFilter === "Video") return item.type === "video";
    if (activeFilter === "Gambar") return item.type === "image";
    if (activeFilter === "Kontrol Gerakan") return item.tags.includes("CTRL");
    return true;
  });

  return (
    <section
      id="gallery"
      className="relative py-16 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 bg-neutral-950 overflow-hidden"
    >
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glow */}
      <div className="absolute top-0 right-1/3 w-[600px] h-[500px] bg-cyan-600/8 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[400px] bg-purple-600/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-10 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-cyan-300 mb-4 sm:mb-5 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            Galeri Karya
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight">
            Dibuat oleh{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              komunitas kami
            </span>
          </h2>
          <p className="text-base sm:text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            Hasil generasi asli dari para kreator. Temukan berbagai karya video
            dan gambar luar biasa yang dihasilkan oleh AI kami.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-10 sm:mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300",
                activeFilter === filter
                  ? "bg-white text-black shadow-lg shadow-white/10"
                  : "bg-white/[0.04] border border-white/10 text-neutral-400 hover:text-white hover:border-white/25 hover:bg-white/[0.07]",
              )}
            >
              {filter}
            </button>
          ))}
        </motion.div>

        {/* Gallery Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((item, index) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <GalleryCard item={item} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* View More CTA */}
        <motion.div
          className="text-center mt-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button
            size="lg"
            className="gap-2 px-8 py-6 text-base rounded-full border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/30 text-white backdrop-blur-sm transition-all duration-300 hover:scale-105"
            asChild
          >
            <a href="/gallery">
              <Maximize2 className="h-5 w-5" />
              Lihat Galeri Lengkap
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

function GalleryCard({ item }: { item: (typeof galleryItems)[0] }) {
  const isVideo = item.type === "video";
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm hover:border-white/20 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl cursor-pointer flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        {/* Hover overlay gradient */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br transition-opacity duration-500 z-10",
            item.accent,
          )}
          style={{ opacity: isHovered ? 1 : 0 }}
        />

        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onLoad={() => setIsLoading(false)}
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900 z-20">
            <Loader2 className="h-6 w-6 text-neutral-500 animate-spin" />
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-3 left-3 z-20">
          <span
            className={cn(
              "px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg",
              isVideo
                ? "bg-purple-600/90 text-white backdrop-blur-sm"
                : "bg-cyan-600/90 text-white backdrop-blur-sm",
            )}
          >
            {isVideo ? "▶ VIDEO" : "◼ IMAGE"}
          </span>
        </div>

        {/* Play button on hover */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="p-4 rounded-full bg-white/15 backdrop-blur-md border border-white/30 shadow-xl"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isVideo ? (
              <Play className="h-6 w-6 text-white ml-0.5" />
            ) : (
              <Maximize2 className="h-5 w-5 text-white" />
            )}
          </motion.div>
        </motion.div>

        {/* Duration / resolution badges */}
        <div className="absolute bottom-3 right-3 flex gap-1.5 z-20">
          {isVideo && item.duration && (
            <span className="px-2 py-0.5 text-[10px] font-mono bg-black/70 backdrop-blur-sm text-white rounded-md">
              {item.duration}
            </span>
          )}
          <span className="px-2 py-0.5 text-[10px] font-mono bg-black/70 backdrop-blur-sm text-white rounded-md">
            {item.resolution}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 text-[10px] font-mono bg-white/5 border border-white/10 rounded text-neutral-500">
            {item.model}
          </span>
        </div>

        <h3 className="font-semibold text-white text-sm mb-1.5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-300 group-hover:to-purple-300 transition-all duration-300">
          {item.title}
        </h3>

        <p className="text-xs text-neutral-600 mb-3 line-clamp-2 flex-1 leading-relaxed">
          {item.prompt}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "px-2 py-0.5 text-[10px] font-medium rounded-md border",
                item.tagColor,
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
