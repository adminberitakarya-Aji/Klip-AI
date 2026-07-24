"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, Sparkles, Coins, Zap, Star } from "lucide-react";
import { Button } from "@klipai/ui/components/button";
import { cn } from "@klipai/ui/lib/utils";

interface CreditPackagePlan {
  name: string;
  priceIdr: string;
  credits: string;
  creditsPerRupiah: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  popular: boolean;
  badge?: string;
  theme: {
    border: string;
    borderHover: string;
    glow: string;
    iconBg: string;
    badgeBg: string;
    badgeText: string;
    ctaClass: string;
    accentLine: string;
    cardBg: string;
  };
}

const creditPlans: CreditPackagePlan[] = [
  {
    name: "Free Trial",
    priceIdr: "Rp 0",
    credits: "10 Credits",
    creditsPerRupiah: "Coba Gratis",
    description: "Gratis untuk pengguna baru saat mendaftar.",
    features: [
      "10 Credits gratis instant",
      "Akses semua model AI",
      "Text-to-Video & Image-to-Video",
      "Resolusi standar",
      "Hasil dengan watermark",
    ],
    cta: "Mulai Gratis",
    href: "/signup",
    popular: false,
    theme: {
      border: "border-white/10",
      borderHover: "hover:border-white/25",
      glow: "",
      iconBg: "bg-white/10",
      badgeBg: "bg-white/5 border border-white/10",
      badgeText: "text-neutral-400",
      ctaClass:
        "bg-white/10 hover:bg-white/15 text-white border border-white/15 hover:border-white/30",
      accentLine: "from-white/20 to-transparent",
      cardBg: "bg-white/[0.02]",
    },
  },
  {
    name: "Starter Pack",
    priceIdr: "Rp 50.000",
    credits: "20 Credits",
    creditsPerRupiah: "Rp 2.500 / credit",
    description: "Cocok untuk mencoba dan eksperimen awal.",
    features: [
      "20 Credits instant",
      "Akses semua template",
      "Tanpa watermark",
      "Dukungan via email",
      "Hasil resolusi HD",
    ],
    cta: "Beli Starter",
    href: "/signup?package=starter",
    popular: false,
    theme: {
      border: "border-blue-500/20",
      borderHover: "hover:border-blue-400/50",
      glow: "",
      iconBg: "bg-blue-500/10",
      badgeBg: "bg-blue-500/10 border border-blue-500/20",
      badgeText: "text-blue-300",
      ctaClass:
        "bg-blue-600/80 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20",
      accentLine: "from-blue-500/60 via-indigo-500/30 to-transparent",
      cardBg: "bg-blue-950/20",
    },
  },
  {
    name: "Pro Pack",
    priceIdr: "Rp 200.000",
    credits: "100 Credits",
    creditsPerRupiah: "Rp 2.000 / credit",
    description: "Paling populer untuk kreator konten aktif.",
    badge: "Paling Populer",
    features: [
      "100 Credits instant",
      "Semua fitur & template",
      "Motion Control (Kamera 3D)",
      "Priority GPU Queue (2× lebih cepat)",
      "Lisensi penggunaan komersial",
      "Akses early feature & 4K",
    ],
    cta: "Beli Pro",
    href: "/signup?package=pro",
    popular: true,
    theme: {
      border: "border-purple-500/40",
      borderHover: "hover:border-purple-400/80",
      glow: "shadow-[0_0_60px_-10px_rgba(168,85,247,0.5)] hover:shadow-[0_0_80px_-5px_rgba(168,85,247,0.6)]",
      iconBg: "bg-purple-500/20",
      badgeBg: "bg-purple-500/15 border border-purple-500/30",
      badgeText: "text-purple-300",
      ctaClass:
        "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-xl shadow-purple-600/40",
      accentLine: "from-purple-500 via-pink-500 to-transparent",
      cardBg: "bg-purple-950/30",
    },
  },
  {
    name: "Business Pack",
    priceIdr: "Rp 800.000",
    credits: "500 Credits",
    creditsPerRupiah: "Rp 1.600 / credit",
    description: "Untuk studio, agency & bisnis volume tinggi.",
    features: [
      "500 Credits instant",
      "Harga per credit paling hemat",
      "Priority Queue tertinggi",
      "Lisensi komersial penuh",
      "Dukungan prioritas 24/7",
      "Integrasi API & Custom",
    ],
    cta: "Beli Business",
    href: "/signup?package=business",
    popular: false,
    theme: {
      border: "border-cyan-500/20",
      borderHover: "hover:border-cyan-400/50",
      glow: "",
      iconBg: "bg-cyan-500/10",
      badgeBg: "bg-cyan-500/10 border border-cyan-500/20",
      badgeText: "text-cyan-300",
      ctaClass:
        "bg-cyan-600/80 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20",
      accentLine: "from-cyan-500/60 via-teal-500/30 to-transparent",
      cardBg: "bg-cyan-950/20",
    },
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative py-16 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 overflow-hidden bg-black"
    >
      {/* Grid texture */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-10 sm:mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-purple-300 mb-4 sm:mb-5 backdrop-blur-sm">
            <Coins className="h-3.5 w-3.5 text-purple-400" />
            Paket Kredit Pay-As-You-Go
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 sm:mb-6 leading-tight">
            Bayar sesuai{" "}
            <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent">
              kebutuhan Anda
            </span>
          </h2>
          <p className="text-base sm:text-xl text-neutral-400 max-w-3xl mx-auto leading-relaxed">
            Tanpa biaya berlangganan bulanan yang mengikat.{" "}
            <span className="text-white font-medium">
              Beli kredit kapan saja
            </span>
            , aktif selamanya tanpa kadaluarsa.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {creditPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              className="relative"
            >
              {/* Popular badge above card */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[11px] font-bold uppercase tracking-wider rounded-full shadow-lg shadow-purple-600/50 whitespace-nowrap">
                    <Star className="h-3 w-3 fill-current" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div
                className={cn(
                  "relative overflow-hidden h-full flex flex-col rounded-3xl border backdrop-blur-xl p-7 transition-all duration-500 hover:-translate-y-1",
                  plan.theme.cardBg,
                  plan.theme.border,
                  plan.theme.borderHover,
                  plan.theme.glow,
                  plan.popular ? "pt-9" : "",
                )}
              >
                {/* Top accent line */}
                <div
                  className={`absolute top-0 left-6 right-6 h-px bg-gradient-to-r ${plan.theme.accentLine}`}
                />

                {/* Animated background glow for pro card */}
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 via-transparent to-pink-600/5 pointer-events-none" />
                )}

                <div className="relative z-10 flex flex-col h-full">
                  {/* Plan name & description */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-xl ${plan.theme.iconBg}`}>
                        {plan.popular ? (
                          <Zap className="h-4 w-4 text-purple-300" />
                        ) : (
                          <Coins className="h-4 w-4 text-neutral-400" />
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        {plan.name}
                      </h3>
                    </div>
                    <p className="text-neutral-500 text-xs leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price block */}
                  <div className="mb-6 pb-6 border-b border-white/[0.07]">
                    <div className="text-3xl font-extrabold text-white mb-1">
                      {plan.priceIdr}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[11px] font-semibold rounded-full",
                          plan.theme.badgeBg,
                          plan.theme.badgeText,
                        )}
                      >
                        {plan.credits}
                      </span>
                      <span className="text-xs text-neutral-600 font-mono">
                        {plan.creditsPerRupiah}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2.5 text-sm text-neutral-300"
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center",
                            plan.popular ? "bg-purple-500/20" : "bg-white/5",
                          )}
                        >
                          <Check
                            className={cn(
                              "h-2.5 w-2.5",
                              plan.popular
                                ? "text-purple-300"
                                : "text-neutral-400",
                            )}
                          />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    size="lg"
                    className={cn(
                      "w-full gap-2 rounded-2xl mt-auto font-semibold transition-all duration-300 hover:scale-[1.02]",
                      plan.theme.ctaClass,
                    )}
                    asChild
                  >
                    <Link href={plan.href}>
                      <span>{plan.cta}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Guarantee strip */}
        <motion.div
          className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-neutral-500"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {[
            { icon: "🔒", text: "Pembayaran aman via Midtrans" },
            { icon: "⚡", text: "Kredit aktif instan setelah bayar" },
            { icon: "♾️", text: "Tidak ada kadaluarsa kredit" },
            { icon: "🇮🇩", text: "Harga dalam Rupiah" },
          ].map((item) => (
            <div key={item.text} className="flex items-center gap-2">
              <span>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
