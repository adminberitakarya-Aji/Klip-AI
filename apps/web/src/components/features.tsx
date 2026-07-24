"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const features = [
  {
    id: "t2v",
    number: "01",
    badge: "MODUL UTAMA",
    title: "Text to Video",
    description:
      "Ketik ide, dapat video cinematic siap upload ke Reels & TikTok.",
    longDesc:
      "Deskripsikan adegan yang Anda bayangkan — AI kami mengubahnya menjadi klip video sinematik 4K dengan gerakan kamera alami, konsistensi karakter, dan kualitas broadcast dalam hitungan menit.",
    tags: ["CINEMATIC", "6D / 12D", "9:16 · 16:9", "PROMPT BOOST"],
    href: "/generate",
    available: true,
    accentColor: "purple",
    thumbnail: "/assets/feat-t2v.jpg",
    gradient: "from-purple-900/80 via-violet-950/60 to-black",
    glowColor: "rgba(168,85,247,0.35)",
    tagline: "KLIP // FEATURE_01",
  },
  {
    id: "t2i",
    number: "02",
    badge: "MODUL KREATIF",
    title: "Text to Image",
    description: "Konsep gambar apapun, dari mockup produk sampai poster.",
    longDesc:
      "Dari brief singkat menjadi visual berkualitas tinggi. Buat mockup produk, poster promosi, aset media sosial, atau concept art dalam resolusi hingga 4K — tanpa skill desain.",
    tags: ["4K", "PHOTOREALISTIC", "COMMERCIAL USE", "NO WATERMARK"],
    href: "/generate",
    available: true,
    accentColor: "cyan",
    thumbnail: "/assets/feat-t2i.jpg",
    gradient: "from-cyan-900/80 via-teal-950/60 to-black",
    glowColor: "rgba(6,182,212,0.35)",
    tagline: "KLIP // FEATURE_02",
  },
  {
    id: "i2v",
    number: "03",
    badge: "MODUL ANIMASI",
    title: "Image to Video",
    description:
      "Hidupkan foto produk jadi video animasi yang bikin scroll berhenti.",
    longDesc:
      "Upload foto produk, portrait, atau ilustrasi apapun — AI menganalisis komposisi dan menghidupkannya dengan gerakan alami, parallax sinematik, dan ekspresi yang meyakinkan.",
    tags: ["PHOTO ANIMATE", "PARALLAX", "EXPRESSION", "MOTION BLUR"],
    href: "/generate",
    available: true,
    accentColor: "pink",
    thumbnail: "/assets/feat-i2v.jpg",
    gradient: "from-pink-900/80 via-rose-950/60 to-black",
    glowColor: "rgba(236,72,153,0.35)",
    tagline: "KLIP // FEATURE_03",
  },
  {
    id: "v2v",
    number: "04",
    badge: "MODUL TRANSFORM",
    title: "Video to Video",
    description: "Repurpose 1 video jadi banyak versi & gaya berbeda.",
    longDesc:
      "Transfer gaya artistik, ubah setting, ganti pencahayaan, atau restyle seluruh video. Satu rekaman mentah bisa menjadi puluhan aset konten yang unik dan berbeda.",
    tags: ["STYLE TRANSFER", "RESTYLE", "MULTI-OUTPUT", "BATCH"],
    href: "/generate",
    available: true,
    accentColor: "amber",
    thumbnail: "/assets/gallery-4.jpg",
    gradient: "from-amber-900/80 via-orange-950/60 to-black",
    glowColor: "rgba(245,158,11,0.35)",
    tagline: "KLIP // FEATURE_04",
  },
  {
    id: "i2i",
    number: "05",
    badge: "MODUL EDIT",
    title: "Image to Image",
    description: "Edit, ubah gaya, atau upscale gambar tanpa Photoshop.",
    longDesc:
      "Transformasi gambar yang sudah ada — ubah gaya artistik, perbaiki pencahayaan, upscale resolusi, atau edit elemen tertentu menggunakan instruksi teks natural.",
    tags: ["UPSCALE 4×", "STYLE EDIT", "INPAINT", "OUTPAINT"],
    href: "/generate",
    available: true,
    accentColor: "emerald",
    thumbnail: "/assets/feat-i2i.jpg",
    gradient: "from-emerald-900/80 via-green-950/60 to-black",
    glowColor: "rgba(52,211,153,0.35)",
    tagline: "KLIP // FEATURE_05",
  },
  {
    id: "motion",
    number: "06",
    badge: "MODUL PRESISI",
    title: "Motion & Consistency",
    description:
      "Kontrol gerakan kamera & jaga karakter tetap konsisten antar frame.",
    longDesc:
      "Tentukan jalur kamera (pan, tilt, zoom, orbit 3D) dengan keyframe presisi. Jaga identitas visual karakter tetap konsisten di seluruh klip — fondasi untuk narasi panjang.",
    tags: ["KEYFRAME", "3D ORBIT", "CHAR LOCK", "SEGERA HADIR"],
    href: "#pricing",
    available: false,
    accentColor: "blue",
    thumbnail: "/assets/feat-motion.jpg",
    gradient: "from-blue-900/80 via-indigo-950/60 to-black",
    glowColor: "rgba(99,102,241,0.35)",
    tagline: "KLIP // FEATURE_06",
  },
];

const accentMap: Record<
  string,
  { text: string; border: string; bg: string; dot: string }
> = {
  purple: {
    text: "text-purple-300",
    border: "border-purple-500/50",
    bg: "bg-purple-500/10",
    dot: "bg-purple-400",
  },
  cyan: {
    text: "text-cyan-300",
    border: "border-cyan-500/50",
    bg: "bg-cyan-500/10",
    dot: "bg-cyan-400",
  },
  pink: {
    text: "text-pink-300",
    border: "border-pink-500/50",
    bg: "bg-pink-500/10",
    dot: "bg-pink-400",
  },
  amber: {
    text: "text-amber-300",
    border: "border-amber-500/50",
    bg: "bg-amber-500/10",
    dot: "bg-amber-400",
  },
  emerald: {
    text: "text-emerald-300",
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/10",
    dot: "bg-emerald-400",
  },
  blue: {
    text: "text-blue-300",
    border: "border-blue-500/50",
    bg: "bg-blue-500/10",
    dot: "bg-blue-400",
  },
};

export function Features() {
  const [active, setActive] = useState(features[0]);
  const accent = accentMap[active.accentColor];

  return (
    <section
      id="features"
      className="relative py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden"
    >
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Ambient glow that follows active feature */}
      <div
        className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] blur-[160px] rounded-full pointer-events-none transition-colors duration-700"
        style={{ background: active.glowColor, opacity: 0.4 }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          className="mb-14"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-widest text-purple-300 mb-5 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                Fitur & Kapabilitas
              </span>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
                Satu studio. <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent italic">
                  Enam kekuatan AI.
                </span>
              </h2>
            </div>
            <p className="text-neutral-400 leading-relaxed max-w-sm text-sm sm:text-base">
              Nggak perlu langganan lima aplikasi berbeda. Klip menyatukan
              seluruh workflow generatif — dari ide hingga video siap tayang —
              dalam satu ruang kerja.
              <span className="flex items-center gap-2 mt-3 text-xs text-neutral-500">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live · {features.filter((f) => f.available).length} modul aktif
              </span>
            </p>
          </div>
        </motion.div>

        {/* Interactive Split Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 items-stretch">
          {/* LEFT: Camera Monitor Display */}
          <motion.div
            className="relative rounded-2xl overflow-hidden border border-white/10 bg-neutral-950 min-h-[400px] sm:min-h-[480px]"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                className={`absolute inset-0 bg-gradient-to-br ${active.gradient}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              />
            </AnimatePresence>

            {/* Background visual / thumbnail */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`img-${active.id}`}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src={active.thumbnail}
                  alt={active.title}
                  className="w-full h-full object-cover"
                  style={{ filter: "brightness(0.45) saturate(1.3)" }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                {/* Cinematic vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
              </motion.div>
            </AnimatePresence>

            {/* HUD Overlay — Top */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
              <div className="flex items-center gap-4 text-[10px] font-mono tracking-[0.2em] text-white/40 uppercase">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  REC
                </span>
                <span>4K</span>
                <span>24FPS</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.span
                  key={active.tagline}
                  className="text-[10px] font-mono tracking-[0.2em] text-white/30 uppercase"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {active.tagline}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Corner scan lines */}
            <div className="absolute top-12 left-3 sm:left-4 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-l-2 border-white/20 pointer-events-none" />
            <div className="absolute top-12 right-3 sm:right-4 w-4 h-4 sm:w-6 sm:h-6 border-t-2 border-r-2 border-white/20 pointer-events-none" />
            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-l-2 border-white/20 pointer-events-none" />
            <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-4 h-4 sm:w-6 sm:h-6 border-b-2 border-r-2 border-white/20 pointer-events-none" />

            {/* Content — Bottom */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-5 sm:p-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  {/* Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em] rounded-md border ${accent.border} ${accent.bg} ${accent.text} mb-2 sm:mb-3`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${accent.dot}`}
                    />
                    {active.badge}
                  </span>

                  {/* Feature title */}
                  <h3 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-2 sm:mb-3 leading-tight">
                    {active.title}
                  </h3>

                  {/* Description */}
                  <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5 max-w-lg line-clamp-3 sm:line-clamp-none">
                    {active.longDesc}
                  </p>

                  {/* Capability tags */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-4 sm:mb-5">
                    {active.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase rounded-full bg-white/10 border border-white/15 text-white/80 backdrop-blur-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA */}
                  {active.available ? (
                    <a
                      href={active.href}
                      className={`inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white border ${accent.border} ${accent.bg} backdrop-blur-sm hover:brightness-110 transition-all duration-200 group`}
                    >
                      Coba Sekarang
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:translate-x-0.5 transition-transform" />
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-neutral-500 border border-neutral-800 bg-neutral-900/50">
                      Segera Hadir
                    </span>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* RIGHT: Feature List */}
          <motion.div
            className="flex flex-col gap-2.5"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {features.map((feat) => {
              const isActive = feat.id === active.id;
              const fa = accentMap[feat.accentColor];
              return (
                <button
                  key={feat.id}
                  onClick={() => setActive(feat)}
                  className={`group relative text-left rounded-2xl border p-4 transition-all duration-300 flex items-center gap-4 ${
                    isActive
                      ? `${fa.border} ${fa.bg} shadow-lg`
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                  }`}
                >
                  {/* Number */}
                  <span
                    className={`flex-shrink-0 text-xs font-mono font-bold tabular-nums w-6 ${isActive ? fa.text : "text-neutral-600"}`}
                  >
                    {feat.number}
                  </span>

                  {/* Thumbnail */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border ${isActive ? fa.border : "border-white/10"} relative`}
                  >
                    <img
                      src={feat.thumbnail}
                      alt={feat.title}
                      className="w-full h-full object-cover"
                      style={{
                        filter: isActive
                          ? "brightness(0.8) saturate(1.2)"
                          : "brightness(0.5) saturate(0.8)",
                      }}
                      onError={(e) => {
                        const el = e.target as HTMLImageElement;
                        el.style.display = "none";
                      }}
                    />
                    {/* Gradient fallback overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${feat.gradient} opacity-80`}
                    />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4
                        className={`font-bold text-sm truncate transition-colors ${isActive ? "text-white" : "text-neutral-400 group-hover:text-white"}`}
                      >
                        {feat.title}
                      </h4>
                      {!feat.available && (
                        <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500 border border-neutral-700">
                          SOON
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs leading-relaxed line-clamp-2 transition-colors ${isActive ? "text-neutral-300" : "text-neutral-600 group-hover:text-neutral-500"}`}
                    >
                      {feat.description}
                    </p>
                  </div>

                  {/* Active indicator arrow */}
                  <ArrowRight
                    className={`flex-shrink-0 h-4 w-4 transition-all duration-300 ${isActive ? `${fa.text} opacity-100` : "text-neutral-700 opacity-0 group-hover:opacity-50"}`}
                  />

                  {/* Active left bar */}
                  {isActive && (
                    <motion.div
                      layoutId="activeBar"
                      className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${fa.dot}`}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 35,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
