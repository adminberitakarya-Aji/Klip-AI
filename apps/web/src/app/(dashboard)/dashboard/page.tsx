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

/* ── Studio Cards (HeyGen Image 4 Style) ── */
const studioCards = [
  {
    id: "avatar",
    title: "Create an Avatar",
    actionText: "Go to Avatars →",
    image: "/images/cards/card_avatar.jpg",
    badge: "Avatar AI",
    badgeColor: "bg-emerald-500/80 text-white",
    href: "/generate?mode=avatar",
  },
  {
    id: "ai-image",
    title: "AI Image Generator",
    actionText: "Create now →",
    image: "/images/cards/card_ai_image.jpg",
    badge: "AI Image",
    badgeColor: "bg-purple-500/80 text-white",
    href: "/generate?type=text-to-image",
  },
  {
    id: "text-to-video",
    title: "AI Video Generator",
    actionText: "Create now →",
    image: "/images/cards/card_ai_video.jpg",
    badge: "AI Video",
    badgeColor: "bg-cyan-500/80 text-white",
    href: "/generate?type=text-to-video",
  },
  {
    id: "photo-to-video",
    title: "Photo to Video",
    actionText: "Try it now →",
    image: "/images/cards/card_photo_video.jpg",
    badge: "Motion",
    badgeColor: "bg-pink-500/80 text-white",
    href: "/generate?type=image-to-video",
  },
  {
    id: "ai-clipping",
    title: "AI Clipping",
    actionText: "Create now →",
    image: "/images/cards/card_ai_clipping.jpg",
    badge: "Auto Clip",
    badgeColor: "bg-amber-500/80 text-white",
    href: "/generate?mode=clipping",
  },
  {
    id: "upscale",
    title: "Upscale Video",
    actionText: "Create now →",
    image: "/images/cards/card_upscale.jpg",
    badge: "4K UHD",
    badgeColor: "bg-blue-500/80 text-white",
    href: "/generate?mode=upscale",
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

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* ── HERO HEADING & PROMPT COMPOSER ── */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-4">
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

          {/* Clean Interactive Prompt Composer Box */}
          <div
            className="relative rounded-3xl p-5 text-left transition-all duration-300 shadow-2xl space-y-3"
            style={{
              background: "oklch(0.08 0.015 260 / 0.8)",
              border: "1px solid oklch(0.82 0.15 205 / 0.3)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 20px 60px -20px oklch(0.82 0.15 205 / 0.2)",
            }}
          >
            {/* Prompt input textarea */}
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Ketik ide video, skrip, atau deskripsi visual Anda... (contoh: A cinematic shot of a coffee shop artisan brewing espresso in 4K, slow motion)"
              rows={3}
              className="w-full bg-transparent px-2 py-1 text-sm text-white placeholder:text-neutral-500 focus:outline-none resize-none"
            />

            {/* Action button inside composer */}
            <div className="flex items-center justify-end pt-3 border-t border-[oklch(1_0_0/0.06)] px-2">
              <button
                onClick={handleStartGenerate}
                className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-xs tracking-wide transition-all duration-200 hover:scale-105"
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
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-xs text-neutral-500 mr-1">Contoh Ide:</span>
            {quickPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => setPromptInput(preset)}
                className="text-xs px-3.5 py-1.5 rounded-full transition-all duration-200"
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

        {/* ── FEATURE CARDS GRID (HeyGen Image 4 Style with Rich Image Banners) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {studioCards.map((card) => {
            return (
              <Link
                key={card.id}
                href={card.href}
                className="group relative rounded-3xl h-52 overflow-hidden transition-all duration-300 border border-white/10 hover:border-cyan-400/50 shadow-lg hover:shadow-cyan-500/20 flex flex-col justify-between p-5"
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform =
                    "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.transform =
                    "translateY(0)";
                }}
              >
                {/* Background Image with Dark Gradient Overlay */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url('${card.image}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                {/* Top Badge */}
                <div className="relative z-10 flex justify-end">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-md ${card.badgeColor}`}
                  >
                    {card.badge}
                  </span>
                </div>

                {/* Bottom Content: Title & Action Link */}
                <div className="relative z-10 space-y-1">
                  <h3 className="text-xl font-black text-white tracking-tight drop-shadow-md group-hover:text-cyan-300 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-xs font-semibold text-neutral-300 group-hover:text-white transition-colors flex items-center gap-1">
                    {card.actionText}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── RECENT GENERATIONS ── */}
        <div className="max-w-6xl mx-auto pt-4">
          <RecentGenerations />
        </div>
      </div>
    </div>
  );
}
