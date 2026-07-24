"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap, Film } from "lucide-react";
import { Button } from "@klipai/ui/components/button";

export function CTA() {
  return (
    <section className="relative py-16 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-purple-600/15 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-pink-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-600/8 blur-[100px] rounded-full pointer-events-none" />

      {/* Top border glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />

      <div className="max-w-5xl mx-auto relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Badge */}
          <motion.span
            className="inline-flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-purple-300 mb-6 sm:mb-8 backdrop-blur-md shadow-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            Dapatkan 10 Free Credits Instant
            <Sparkles className="h-3.5 w-3.5 text-pink-400" />
          </motion.span>

          {/* Headline */}
          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-4 sm:mb-6 leading-tight sm:leading-[1.1]">
            Siap membuat video AI <br className="hidden sm:block" />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
                berkualitas sinematik?
              </span>
              {/* Underline glow */}
              <span className="absolute -bottom-2 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 rounded-full opacity-60" />
            </span>
          </h2>

          {/* Subtext */}
          <p className="text-base sm:text-xl text-neutral-400 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed font-light">
            Daftar sekarang tanpa kartu kredit.{" "}
            <span className="text-white font-medium">
              Nikmati 10 kredit gratis
            </span>{" "}
            langsung di akun Anda dan buat video AI pertama dalam hitungan
            detik.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button
              size="lg"
              className="w-full sm:w-auto group gap-2.5 sm:gap-3 px-6 sm:px-10 py-5 sm:py-7 text-sm sm:text-lg rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-2xl shadow-purple-600/40 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/50"
              asChild
            >
              <a
                href="/signup"
                className="flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-purple-200" />
                <span>Mulai Buat Video Gratis</span>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>

            <Button
              size="lg"
              variant="ghost"
              className="w-full sm:w-auto gap-2 px-6 sm:px-8 py-5 sm:py-7 text-sm sm:text-lg rounded-full border border-white/15 hover:border-white/30 hover:bg-white/5 text-white transition-all duration-300"
              asChild
            >
              <a
                href="/gallery"
                className="flex items-center justify-center gap-2"
              >
                <Film className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-400" />
                <span>Lihat Contoh Karya</span>
              </a>
            </Button>
          </div>

          {/* Trust micro-copy */}
          <motion.p
            className="mt-8 text-xs text-neutral-600 flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <span>✓ Tanpa kartu kredit</span>
            <span className="w-1 h-1 rounded-full bg-neutral-700" />
            <span>✓ Tanpa batas waktu</span>
            <span className="w-1 h-1 rounded-full bg-neutral-700" />
            <span>✓ Kredit aktif selamanya</span>
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
