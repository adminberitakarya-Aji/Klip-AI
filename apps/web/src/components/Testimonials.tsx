"use client";

import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Siti Rahmawati",
    role: "Kreator Konten Digital",
    handle: "@siti.rahma",
    initials: "SR",
    avatarGradient: "from-pink-500 to-rose-600",
    content:
      "Klip AI benar-benar mengubah cara kerja saya. Sekarang saya bisa membuat video promosi berkualitas tinggi dalam hitungan menit. Kualitas AI-nya luar biasa — tidak ada tools lain yang setara!",
    platform: "TikTok",
    platformColor: "bg-black border-white/10 text-white",
    platformDot: "bg-cyan-400",
    cardGlow: "from-pink-600/20 via-rose-500/10",
    borderHover: "hover:border-pink-500/40",
    rating: 5,
  },
  {
    name: "Andi Pratama",
    role: "Pemilik Usaha UMKM, Jakarta",
    handle: "@andipratama.biz",
    initials: "AP",
    avatarGradient: "from-violet-500 to-purple-700",
    content:
      "Sebagai pemilik usaha kecil, Klip AI membantu saya membuat iklan produk yang terlihat sangat profesional tanpa harus menyewa tim kreatif mahal. Sangat merekomendasikan untuk semua pelaku bisnis!",
    platform: "Instagram",
    platformColor: "bg-gradient-to-r from-purple-600 to-pink-500 text-white",
    platformDot: null,
    cardGlow: "from-purple-600/20 via-violet-500/10",
    borderHover: "hover:border-purple-500/40",
    rating: 5,
  },
  {
    name: "Budi Santoso",
    role: "Video Editor & Animator",
    handle: "@budi.vfx",
    initials: "BS",
    avatarGradient: "from-red-500 to-rose-700",
    content:
      "Fitur kontrol pergerakan kamera 3D-nya sangat luar biasa. Saya bisa mengendalikan pergerakan kamera dan karakter secara presisi — jauh melampaui alat AI video lainnya yang pernah saya coba.",
    platform: "YouTube",
    platformColor: "bg-red-600 text-white",
    platformDot: null,
    cardGlow: "from-red-600/20 via-rose-500/10",
    borderHover: "hover:border-red-500/40",
    rating: 5,
  },
  {
    name: "Dian Wulandari",
    role: "Digital Marketer",
    handle: "@dianwulandari",
    initials: "DW",
    avatarGradient: "from-blue-500 to-indigo-700",
    content:
      "Kami menggunakan Klip AI untuk seluruh alur konten pemasaran kami. Dari ide konsep hingga video final kurang dari 5 menit. Tingkat interaksi audiens kami meningkat drastis dalam sebulan pertama!",
    platform: "LinkedIn",
    platformColor: "bg-blue-600 text-white",
    platformDot: null,
    cardGlow: "from-blue-600/20 via-indigo-500/10",
    borderHover: "hover:border-blue-500/40",
    rating: 5,
  },
];

const StarIcon = () => (
  <svg
    className="w-4 h-4 text-amber-400"
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export function Testimonials() {
  return (
    <section
      id="testimonials"
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

      {/* Ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-600/8 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-10 sm:mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-amber-300 mb-4 sm:mb-5 backdrop-blur-sm">
            <svg
              className="w-3.5 h-3.5 text-amber-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Testimoni Kreator
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight">
            Dipercayai oleh{" "}
            <span className="bg-gradient-to-r from-amber-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
              kreator di seluruh Indonesia
            </span>
          </h2>
          <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Lihat bagaimana para kreator hebat menggunakan Klip AI untuk
            mentransformasi ide mereka menjadi karya sinematik.
          </p>
        </motion.div>

        {/* Testimonial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.name}
              className={`group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-xl p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${item.borderHover}`}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
            >
              {/* Card ambient hover glow */}
              <div
                className={`absolute -top-12 -right-12 w-56 h-56 bg-gradient-to-bl ${item.cardGlow} to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`}
              />

              {/* Giant quote mark watermark */}
              <Quote className="absolute bottom-6 right-6 h-24 w-24 text-white/[0.03] fill-white/[0.03] pointer-events-none" />

              {/* Top: Avatar + Info + Platform */}
              <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.avatarGradient} flex items-center justify-center text-white font-bold text-lg shadow-lg flex-shrink-0`}
                  >
                    {item.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-bold text-white text-base">
                        {item.name}
                      </h4>
                      {/* Verified badge */}
                      <svg
                        className="w-4 h-4 text-sky-400"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <p className="text-sm text-neutral-500">{item.role}</p>
                    <p className="text-xs text-neutral-600">{item.handle}</p>
                  </div>
                </div>
                {/* Platform badge */}
                <span
                  className={`flex-shrink-0 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-xl border ${item.platformColor} flex items-center gap-1.5`}
                >
                  {item.platformDot && (
                    <span
                      className={`w-2 h-2 rounded-full ${item.platformDot}`}
                    />
                  )}
                  {item.platform}
                </span>
              </div>

              {/* Stars */}
              <div className="flex gap-1 mb-4 relative z-10">
                {Array.from({ length: item.rating }).map((_, j) => (
                  <StarIcon key={j} />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-neutral-300 leading-relaxed text-[15px] relative z-10">
                &ldquo;{item.content}&rdquo;
              </blockquote>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
