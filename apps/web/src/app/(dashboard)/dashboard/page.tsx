"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Wand2,
  Video,
  ImageIcon,
  Mic,
  Sliders,
  Plus,
  ArrowUpRight,
  Bot,
  Maximize,
  Layers,
} from "lucide-react";
import { RecentGenerations } from "@/components/dashboard/RecentGenerations";
import { UserBalance } from "@/components/dashboard/UserBalance";

/* ── Studio Cards ── */
const studioCards = [
  {
    id: "text-to-video",
    title: "AI Video Generator",
    desc: "Generate video cinematic dari prompt teks atau skrip",
    badge: "Populer",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    gradient: "from-cyan-600/30 via-blue-600/20 to-transparent",
    icon: Video,
    href: "/generate?type=text-to-video",
  },
  {
    id: "photo-to-video",
    title: "Photo to Video",
    desc: "Animasi gambar & foto portrait menjadi gerakan nyata",
    badge: "Hot",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    gradient: "from-purple-600/30 via-pink-600/20 to-transparent",
    icon: ImageIcon,
    href: "/generate?type=image-to-video",
  },
  {
    id: "avatar",
    title: "Create an Avatar",
    desc: "Avatar AI juru bicara yang berbicara natural dengan AI voice",
    badge: "AI Voice",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    gradient: "from-amber-600/30 via-orange-600/20 to-transparent",
    icon: Bot,
    href: "/generate?mode=avatar",
  },
  {
    id: "templates",
    title: "Storyboard Templates",
    desc: "100+ template video iklan & UGC Siap pakai untuk brand Anda",
    badge: "100+ Template",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    gradient: "from-emerald-600/30 via-teal-600/20 to-transparent",
    icon: Layers,
    href: "/templates",
  },
  {
    id: "upscale",
    title: "Upscale Video 4K",
    desc: "Tingkatkan resolusi & kejernihan video hingga 4K UHD",
    badge: "4K UHD",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    gradient: "from-blue-600/30 via-indigo-600/20 to-transparent",
    icon: Maximize,
    href: "/generate?mode=upscale",
  },
  {
    id: "speech-cleanup",
    title: "Speech Cleanup & Voice",
    desc: "Bersihkan audio & dubbing suara profesional dengan AI",
    badge: "Voice AI",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    gradient: "from-rose-600/30 via-pink-600/20 to-transparent",
    icon: Mic,
    href: "/generate?mode=voice",
  },
];

/* ── Quick prompt presets ── */
const quickPresets = [
  "Iklan UGC Kopi Aji",
  "Sinematik Batik Artisan 4K",
  "Review Gadget Smartphone",
  "Promo Diskon Produk Fashion",
  "Tutorial Edukasi Singkat",
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [promptInput, setPromptInput] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  const handleStartGenerate = () => {
    if (promptInput.trim()) {
      router.push(`/generate?prompt=${encodeURIComponent(promptInput.trim())}`);
    } else {
      router.push("/generate");
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden text-white"
      style={{ background: "oklch(0.04 0 0)" }}
    >
      {/* Ambient aurora background glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.5 0.18 205 / 0.25) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 90%, oklch(0.7 0.18 55 / 0.15) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* ── TOP HEADER / ASSISTANT BAR ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5"
              style={{
                background: "oklch(0.82 0.15 205 / 0.1)",
                borderColor: "oklch(0.82 0.15 205 / 0.25)",
                color: "oklch(0.82 0.15 205)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Klip-AI Studio v2.5
            </span>
          </div>

          <button
            onClick={() => router.push("/generate")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
            style={{
              background: "oklch(1 0 0 / 0.05)",
              border: "1px solid oklch(1 0 0 / 0.1)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Tanya AI Assistant
          </button>
        </div>

        {/* ── HERO HEADING & PROMPT COMPOSER (HeyGen Image 3 Style) ── */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white"
            style={{ textShadow: "0 0 60px oklch(0.82 0.15 205 / 0.2)" }}
          >
            Ubah ide Anda menjadi video
            <br />
            <span style={{ color: "oklch(0.82 0.15 205)" }}>
              dalam hitungan menit
            </span>
          </h1>

          {/* Interactive Floating Prompt Composer Box */}
          <div
            className="relative rounded-3xl p-4 text-left transition-all duration-300 shadow-2xl"
            style={{
              background: "oklch(0.08 0.015 260 / 0.8)",
              border: "1px solid oklch(0.82 0.15 205 / 0.3)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 20px 60px -20px oklch(0.82 0.15 205 / 0.2)",
            }}
          >
            {/* Model selectors pill bar */}
            <div className="flex items-center gap-2 mb-3 px-2">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                Mode Prompt:
              </span>
              <span
                className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{
                  background: "oklch(0.82 0.15 205 / 0.15)",
                  color: "oklch(0.82 0.15 205)",
                  border: "1px solid oklch(0.82 0.15 205 / 0.3)",
                }}
              >
                Seedance 2.5 AI
              </span>
              <span
                className="text-xs font-medium px-2.5 py-0.5 rounded-full text-neutral-400"
                style={{
                  background: "oklch(1 0 0 / 0.04)",
                  border: "1px solid oklch(1 0 0 / 0.08)",
                }}
              >
                Ref to Video
              </span>
            </div>

            {/* Prompt input textarea */}
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Ketik ide video, skrip, atau deskripsi visual Anda... (contoh: A cinematic shot of a coffee shop artisan brewing espresso in 4K, slow motion)"
              rows={3}
              className="w-full bg-transparent px-2 py-1 text-sm text-white placeholder:text-neutral-500 focus:outline-none resize-none"
            />

            {/* Action bar inside composer */}
            <div className="flex items-center justify-between pt-3 border-t border-[oklch(1_0_0/0.06)] px-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/generate")}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-[oklch(1_0_0/0.06)] transition-all"
                  title="Upload referensi gambar"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push("/generate")}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-[oklch(1_0_0/0.06)] transition-all"
                  title="Pengaturan Kamera & Lighting"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleStartGenerate}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all duration-200 hover:scale-105"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.82 0.15 205) 0%, oklch(0.7 0.18 230) 100%)",
                  color: "oklch(0.05 0 0)",
                  boxShadow: "0 4px 20px -4px oklch(0.82 0.15 205 / 0.5)",
                }}
              >
                <Wand2 className="w-4 h-4" />
                Generate Sekarang
              </button>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs text-neutral-500 mr-1">Contoh Ide:</span>
            {quickPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => setPromptInput(preset)}
                className="text-xs px-3 py-1.5 rounded-full transition-all duration-200"
                style={{
                  background: "oklch(1 0 0 / 0.04)",
                  border: "1px solid oklch(1 0 0 / 0.08)",
                  color: "oklch(1 0 0 / 0.6)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "oklch(0.82 0.15 205 / 0.4)";
                  (e.currentTarget as HTMLButtonElement).style.color = "white";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "oklch(1 0 0 / 0.08)";
                  (e.currentTarget as HTMLButtonElement).style.color =
                    "oklch(1 0 0 / 0.6)";
                }}
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* ── USER BALANCE METER CARD ── */}
        <div className="max-w-4xl mx-auto">
          <UserBalance />
        </div>

        {/* ── STUDIO FEATURE CARDS GRID (HeyGen Image 3 Style) ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Studio Feature Hub
            </h2>
            <Link
              href="/generate"
              className="text-xs font-semibold transition-colors"
              style={{ color: "oklch(0.82 0.15 205)" }}
            >
              Lihat Semua Fitur →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {studioCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.id}
                  href={card.href}
                  className="group relative rounded-2xl p-6 flex flex-col justify-between h-48 transition-all duration-300 overflow-hidden"
                  style={{
                    background: "oklch(0.07 0.01 260)",
                    border: "1px solid oklch(1 0 0 / 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "oklch(0.82 0.15 205 / 0.4)";
                    (e.currentTarget as HTMLAnchorElement).style.transform =
                      "translateY(-4px)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "0 12px 30px -10px oklch(0.82 0.15 205 / 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "oklch(1 0 0 / 0.08)";
                    (e.currentTarget as HTMLAnchorElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "none";
                  }}
                >
                  {/* Background gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-40 group-hover:opacity-70 transition-opacity`}
                  />

                  {/* Top row: Badge + Icon */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${card.badgeColor}`}
                    >
                      {card.badge}
                    </span>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                      style={{
                        background: "oklch(1 0 0 / 0.06)",
                        border: "1px solid oklch(1 0 0 / 0.1)",
                      }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  {/* Bottom row: Title, Desc, Arrow */}
                  <div className="relative z-10 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {card.title}
                      </h3>
                      <ArrowUpRight className="w-4 h-4 text-neutral-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── RECENT GENERATIONS ── */}
        <div className="max-w-6xl mx-auto">
          <RecentGenerations />
        </div>
      </div>
    </div>
  );
}
