"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Loader2,
  Sparkles,
  X,
  Copy,
  Check,
  ArrowRight,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@klipai/ui/components/button";
import { cn } from "@klipai/ui/lib/utils";

interface GalleryItem {
  id: string;
  type: "video" | "image";
  title: string;
  prompt: string;
  model: string;
  duration?: string;
  resolution: string;
  thumbnail: string;
  videoUrl: string;
  tags: string[];
  accent: string;
  tagColor: string;
}

const galleryItems: GalleryItem[] = [
  {
    id: "1",
    type: "video",
    title: "Wanita Bergaun Merah Sinematik",
    prompt:
      "Pengambilan gambar sinematik seorang wanita bergaun merah berjalan di hutan lebat, gerakan alami 60fps, 4K",
    model: "SVD-XT",
    duration: "6d",
    resolution: "4K",
    thumbnail: "/assets/gallery-1.jpg",
    videoUrl: "/assets/Woman_in_red_gown_jungle.mp4",
    tags: ["T2V", "Sinematik", "4K"],
    accent: "from-purple-600/40 via-pink-600/20 to-transparent",
    tagColor: "bg-purple-500/20 border-purple-500/30 text-purple-200",
  },
  {
    id: "2",
    type: "video",
    title: "Pengrajin Batik Tulis Tradisional",
    prompt:
      "Dokumenter makro pengrajin wanita menggoreskan canting batik tulis di atas kain sutra, lilin hangat, pencahayaan alami, 4K",
    model: "Gen-2",
    duration: "5d",
    resolution: "4K",
    thumbnail: "/assets/gallery-2.jpg",
    videoUrl: "/assets/Batik_artisan_producing_Batik_Tulis_202607281507.mp4",
    tags: ["I2V", "Budaya", "Detail"],
    accent: "from-amber-600/40 via-orange-600/20 to-transparent",
    tagColor: "bg-amber-500/20 border-amber-500/30 text-amber-200",
  },
  {
    id: "3",
    type: "video",
    title: "Iklan Kuliner: Mie Wok Panas",
    prompt:
      "Video promosi kuliner slow motion aksi memasak mie di wajan wok dengan nyala api besar dan asap membumbung, 60fps 4K",
    model: "AnimateDiff",
    duration: "4d",
    resolution: "4K",
    thumbnail: "/assets/gallery-3.jpg",
    videoUrl: "/assets/Cooking_noodles_in_wok_202607281504.mp4",
    tags: ["T2V", "Kuliner", "Aksi"],
    accent: "from-orange-600/40 via-red-600/20 to-transparent",
    tagColor: "bg-orange-500/20 border-orange-500/30 text-orange-200",
  },
  {
    id: "4",
    type: "video",
    title: "Digital Angel Kota Cyberpunk",
    prompt:
      "Malaikat digital bercahaya neon melayang di atas langit metropolis cyberpunk malam hari, sinar holografik, 8K sinematik",
    model: "SVD-XT",
    duration: "6d",
    resolution: "8K",
    thumbnail: "/assets/gallery-4.jpg",
    videoUrl: "/assets/Digital_angel_above_cyber_city_202607281503.mp4",
    tags: ["T2V", "Sci-Fi", "VFX"],
    accent: "from-cyan-600/40 via-blue-600/20 to-transparent",
    tagColor: "bg-cyan-500/20 border-cyan-500/30 text-cyan-200",
  },
  {
    id: "5",
    type: "video",
    title: "Iklan Produk: Maria Sips Aji Kopi",
    prompt:
      "Iklan komersial gaya hidup seorang wanita tersenyum sambil menikmati secangkir Aji Kopi hangat di kafe estetis, pencahayaan lembut",
    model: "Gen-2",
    duration: "5d",
    resolution: "1080p",
    thumbnail: "/assets/feat-t2i.jpg",
    videoUrl: "/assets/Maria_sips_Aji_Kopi_smiles_202607281505.mp4",
    tags: ["I2V", "Iklan", "Lifestyle"],
    accent: "from-emerald-600/40 via-teal-600/20 to-transparent",
    tagColor: "bg-emerald-500/20 border-emerald-500/30 text-emerald-200",
  },
  {
    id: "6",
    type: "video",
    title: "Review TikTok: Keripik Pedas Viral",
    prompt:
      "Konten kreator wanita membuat video review reaksi jujur keripik pedas viral untuk TikTok & Reels, ekspresi dinamis",
    model: "AnimateDiff",
    duration: "4d",
    resolution: "1080p",
    thumbnail: "/assets/feat-motion.jpg",
    videoUrl: "/assets/Woman_reviewing_spicy_chips_202607281507.mp4",
    tags: ["I2V", "Kreator", "Reels"],
    accent: "from-rose-600/40 via-pink-600/20 to-transparent",
    tagColor: "bg-rose-500/20 border-rose-500/30 text-rose-200",
  },
  {
    id: "7",
    type: "video",
    title: "Fajar di Dataran Tinggi Dieng",
    prompt:
      "Lanskap Dataran Tinggi Dieng saat fajar, kabut pagi membumbung di antara perbukitan hijau, pencahayaan alami, sinema Indonesia 4K",
    model: "Gen-2",
    duration: "5d",
    resolution: "4K",
    thumbnail: "/assets/feat-i2v.jpg",
    videoUrl: "/assets/Dieng_Plateau_dawn_landscape_202607242207.mp4",
    tags: ["T2V", "Alam", "Indonesia"],
    accent: "from-teal-600/40 via-cyan-600/20 to-transparent",
    tagColor: "bg-teal-500/20 border-teal-500/30 text-teal-200",
  },
  {
    id: "8",
    type: "video",
    title: "Lompatan Gargoyle & Sihir VFX",
    prompt:
      "Gargoyle melompat dari menara gothic, Thalia melepaskan kekuatan sihir bercahaya neon, pencahayaan dramatis, cinematic VFX, 4K",
    model: "MotionCtrl",
    duration: "4d",
    resolution: "4K",
    thumbnail: "/assets/feat-i2i.jpg",
    videoUrl: "/assets/Gargoyle_leaps,_Thalia_unleashes…_202607242237.mp4",
    tags: ["CTRL", "VFX", "Aksi"],
    accent: "from-violet-600/40 via-purple-600/20 to-transparent",
    tagColor: "bg-violet-500/20 border-violet-500/30 text-violet-200",
  },
];

const filters = [
  "Semua",
  "Sinematik",
  "Iklan & Produk",
  "Budaya & Alam",
  "Sci-Fi & VFX",
];

export function Gallery() {
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  const filtered = galleryItems.filter((item) => {
    if (activeFilter === "Semua") return true;
    if (activeFilter === "Sinematik")
      return item.tags.includes("Sinematik") || item.tags.includes("T2V");
    if (activeFilter === "Iklan & Produk")
      return (
        item.tags.includes("Iklan") ||
        item.tags.includes("Kuliner") ||
        item.tags.includes("Reels")
      );
    if (activeFilter === "Budaya & Alam")
      return (
        item.tags.includes("Budaya") ||
        item.tags.includes("Alam") ||
        item.tags.includes("Indonesia")
      );
    if (activeFilter === "Sci-Fi & VFX")
      return (
        item.tags.includes("Sci-Fi") ||
        item.tags.includes("VFX") ||
        item.tags.includes("CTRL")
      );
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
            Galeri Karya Video AI
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight">
            Hasil generasi asli{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              kreator kami
            </span>
          </h2>
          <p className="text-base sm:text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            Arahkan kursor atau sentuh untuk melihat animasi video bergerak
            secara langsung. Klik untuk menyalin prompt & mencobanya sendiri.
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
                  ? "bg-white text-black shadow-lg shadow-white/10 font-bold"
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
                <GalleryCard
                  item={item}
                  onOpenModal={() => setSelectedItem(item)}
                />
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
            <a href="/generate">
              <Sparkles className="h-5 w-5 text-purple-300" />
              Mulai Buat Karya Anda Sendiri
              <ArrowRight className="h-5 w-5" />
            </a>
          </Button>
        </motion.div>
      </div>

      {/* Lightbox / Video Showcase Modal */}
      <AnimatePresence>
        {selectedItem && (
          <VideoModal
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function GalleryCard({
  item,
  onOpenModal,
}: {
  item: GalleryItem;
  onOpenModal: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play video on hover or keep muted loop playing
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      onClick={onOpenModal}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm hover:border-purple-500/40 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-500/10 cursor-pointer flex flex-col h-full"
    >
      {/* Visual Area (Video) */}
      <div className="relative aspect-video overflow-hidden bg-neutral-900">
        {/* Ambient Overlay Gradient on Hover */}
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br transition-opacity duration-500 z-10 pointer-events-none",
            item.accent,
          )}
          style={{ opacity: isHovered ? 1 : 0 }}
        />

        {/* Video Element for live motion */}
        <video
          ref={videoRef}
          src={item.videoUrl}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={() => setIsLoading(false)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/80 z-20">
            <Loader2 className="h-6 w-6 text-neutral-500 animate-spin" />
          </div>
        )}

        {/* Type badge */}
        <div className="absolute top-3 left-3 z-20">
          <span className="px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-lg shadow-lg backdrop-blur-md flex items-center gap-1 bg-purple-600/90 text-white border border-purple-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            VIDEO
          </span>
        </div>

        {/* Play/Expand Overlay Icon */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.9 }}
          transition={{ duration: 0.2 }}
        >
          <div className="p-3.5 rounded-full bg-black/60 backdrop-blur-md border border-white/30 shadow-2xl text-white">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </motion.div>

        {/* Duration & Resolution Badges */}
        <div className="absolute bottom-3 right-3 flex gap-1.5 z-20">
          {item.duration && (
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-black/75 backdrop-blur-md text-white rounded-md border border-white/10">
              {item.duration}
            </span>
          )}
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-black/75 backdrop-blur-md text-white rounded-md border border-white/10">
            {item.resolution}
          </span>
        </div>
      </div>

      {/* Card Content Info */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-white/5 border border-white/10 rounded text-purple-300">
              {item.model}
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              Klik untuk prompt
            </span>
          </div>

          <h3 className="font-bold text-white text-sm mb-1.5 group-hover:text-purple-200 transition-colors line-clamp-1">
            {item.title}
          </h3>

          <p className="text-xs text-neutral-400 mb-3 line-clamp-2 leading-relaxed font-light">
            {item.prompt}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/[0.05]">
          {item.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold rounded-md border",
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

// Modal Showcase Component for Video Preview & Copy Prompt
function VideoModal({
  item,
  onClose,
}: {
  item: GalleryItem;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleModalMute = () => {
    if (modalVideoRef.current) {
      modalVideoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl rounded-3xl border border-white/15 bg-neutral-950 shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-white/20 transition-all"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Video Side */}
        <div className="relative md:w-3/5 bg-black flex items-center justify-center aspect-video md:aspect-auto min-h-[260px]">
          <video
            ref={modalVideoRef}
            src={item.videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <button
            onClick={toggleModalMute}
            className="absolute bottom-4 right-4 p-2.5 rounded-full bg-black/60 border border-white/20 text-white hover:bg-black/80 transition-all z-20"
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Info & Prompt Side */}
        <div className="p-6 md:w-2/5 flex flex-col justify-between bg-neutral-950 border-t md:border-t-0 md:border-l border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 text-xs font-mono font-bold bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-md">
                {item.model}
              </span>
              <span className="px-2.5 py-1 text-xs font-mono bg-white/5 border border-white/10 text-neutral-400 rounded-md">
                {item.resolution}
              </span>
            </div>

            <h3 className="text-2xl font-extrabold text-white mb-4 leading-tight">
              {item.title}
            </h3>

            {/* Prompt Box */}
            <div className="mb-6">
              <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-2 block">
                Prompt AI
              </label>
              <div className="relative p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-sm text-neutral-200 leading-relaxed font-mono">
                {item.prompt}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-4 border-t border-white/10">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="w-full gap-2 py-5 rounded-xl border-white/20 text-white hover:bg-white/10"
            >
              {copied ? (
                <Check className="h-4 w-4 text-emerald-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span>{copied ? "Prompt Tersalin!" : "Salin Prompt"}</span>
            </Button>

            <Button
              className="w-full gap-2 py-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-600/30 font-semibold"
              asChild
            >
              <a href={`/generate?prompt=${encodeURIComponent(item.prompt)}`}>
                <Sparkles className="h-4 w-4" />
                <span>Gunakan Prompt Ini</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
