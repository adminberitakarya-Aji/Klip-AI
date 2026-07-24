"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const steps = [
  {
    number: "01",
    label: "LANGKAH PERTAMA",
    title: "Tulis Prompt atau Upload",
    description:
      "Deskripsikan adegan yang Anda bayangkan — atau cukup upload foto/video. Prompt bisa sepanjang kalimat biasa atau sesingkat dua kata.",
    detail:
      "Tersedia panduan prompt & template siap pakai untuk memulai dalam detik.",
    accentColor: "purple",
    border: "border-purple-500/30",
    bg: "bg-purple-500/5",
    badgeColor: "text-purple-300 bg-purple-500/10 border-purple-500/20",
    dotColor: "bg-purple-500",
    lineColor: "from-purple-500/60",
    visual: (
      <div className="relative w-full h-full flex items-center justify-center p-6">
        <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-red-500/70" />
            <div className="w-2 h-2 rounded-full bg-amber-500/70" />
            <div className="w-2 h-2 rounded-full bg-emerald-500/70" />
            <span className="text-[10px] font-mono text-neutral-600 ml-2">
              prompt_input.txt
            </span>
          </div>
          <div className="font-mono text-xs text-purple-200 leading-relaxed">
            <span className="text-neutral-600">→ </span>
            <span className="text-white">Pengambilan gambar</span>
            <br />
            <span className="text-white">sinematik seorang wanita</span>
            <br />
            <span className="text-white">bergaun merah berjalan</span>
            <br />
            <span className="text-purple-300">di hutan lebat, 4K</span>
            <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse" />
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {["CINEMATIC", "4K", "MOTION BLUR"].map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-purple-500/20 border border-purple-500/20 text-purple-300"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  {
    number: "02",
    label: "LANGKAH KEDUA",
    title: "AI Proses dalam Detik",
    description:
      "Model AI kami menganalisis prompt, membangun adegan, dan merender video dengan GPU cluster berkecepatan tinggi — biasanya 1–3 menit.",
    detail: "Anda bisa pantau progress real-time dan estimasi waktu selesai.",
    accentColor: "cyan",
    border: "border-cyan-500/30",
    bg: "bg-cyan-500/5",
    badgeColor: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
    dotColor: "bg-cyan-500",
    lineColor: "from-cyan-500/60",
    visual: (
      <div className="relative w-full h-full flex items-center justify-center p-6">
        <div className="w-full max-w-xs space-y-3">
          {[
            { label: "Analisis Prompt", pct: 100, color: "bg-cyan-500" },
            { label: "Render Frame", pct: 78, color: "bg-cyan-400" },
            { label: "Motion Synthesis", pct: 45, color: "bg-cyan-300" },
            { label: "4K Upscale", pct: 12, color: "bg-cyan-200" },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-[10px] font-mono mb-1">
                <span className="text-neutral-400">{item.label}</span>
                <span className="text-cyan-300">{item.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${item.color}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
                />
              </div>
            </div>
          ))}
          <div className="pt-2 flex items-center gap-2 text-xs text-neutral-500 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            GPU Cluster · Estimasi: ~1m 45d
          </div>
        </div>
      </div>
    ),
  },
  {
    number: "03",
    label: "LANGKAH KETIGA",
    title: "Download & Publish",
    description:
      "Video siap dalam format MP4 resolusi hingga 4K. Download langsung atau share ke TikTok, Instagram Reels, dan YouTube Shorts.",
    detail: "Tanpa watermark. Hak komersial penuh. Kredit aktif selamanya.",
    accentColor: "pink",
    border: "border-pink-500/30",
    bg: "bg-pink-500/5",
    badgeColor: "text-pink-300 bg-pink-500/10 border-pink-500/20",
    dotColor: "bg-pink-500",
    lineColor: "from-pink-500/60",
    visual: (
      <div className="relative w-full h-full flex items-center justify-center p-6">
        <div className="w-full max-w-xs space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-white text-xs font-semibold">
                  output_final.mp4
                </p>
                <p className="text-neutral-500 text-[10px]">
                  4K · 1080p · 12s · 48MB
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["TikTok", "Reels", "Shorts"].map((p) => (
                <div
                  key={p}
                  className="text-center py-1.5 rounded-lg bg-white/5 border border-white/10"
                >
                  <p className="text-[10px] font-semibold text-neutral-300">
                    {p}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] text-neutral-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Tanpa watermark
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
              Hak komersial penuh
            </span>
          </div>
        </div>
      </div>
    ),
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 bg-neutral-950 overflow-hidden">
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-purple-600/8 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-widest text-purple-300 mb-5 backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            Cara Kerja
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Dari ide ke video{" "}
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
              dalam 3 langkah
            </span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Tidak perlu keahlian desain atau editing. Klip AI dirancang agar
            siapapun bisa menghasilkan video berkualitas profesional.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              className={`relative rounded-3xl border ${step.border} ${step.bg} backdrop-blur-sm overflow-hidden`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.65, delay: index * 0.08 }}
            >
              {/* Top accent line */}
              <div
                className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${step.lineColor} to-transparent`}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[280px]">
                {/* Text Side */}
                <div className="p-8 sm:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-5">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-[0.18em] px-2.5 py-1 rounded-lg border ${step.badgeColor}`}
                    >
                      {step.label}
                    </span>
                    <span
                      className={`text-5xl font-extrabold font-mono tabular-nums ${step.badgeColor.split(" ")[0]} opacity-20`}
                    >
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-neutral-400 leading-relaxed mb-4 text-base">
                    {step.description}
                  </p>
                  <p className="text-sm text-neutral-600 italic">
                    {step.detail}
                  </p>
                </div>

                {/* Visual Side */}
                <div
                  className={`relative min-h-[220px] border-t lg:border-t-0 lg:border-l border-white/[0.06] flex items-center`}
                >
                  {step.visual}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="text-center mt-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <a
            href="/generate"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-base shadow-xl shadow-purple-600/30 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105 group"
          >
            <Sparkles className="h-5 w-5 text-purple-200" />
            Coba Gratis Sekarang
            <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <p className="mt-3 text-xs text-neutral-600">
            Tidak perlu kartu kredit · 10 kredit gratis otomatis
          </p>
        </motion.div>
      </div>
    </section>
  );
}
