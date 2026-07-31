"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Wand2,
  Plus,
  Sliders,
  X,
  Image as ImageIcon,
  Check,
  ChevronDown,
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

/* ── Settings Options ── */
const ASPECT_RATIOS = [
  { label: "16:9", desc: "Landscape" },
  { label: "9:16", desc: "Portrait" },
  { label: "1:1", desc: "Square" },
  { label: "4:3", desc: "Standard" },
];

const DURATIONS = [
  { label: "5s", value: 5 },
  { label: "10s", value: 10 },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
];

const QUALITY_OPTIONS = [
  { label: "Standard", desc: "Faster, lower cost" },
  { label: "High", desc: "Balanced speed & quality" },
  { label: "Ultra", desc: "Best quality, slower" },
];

const MODEL_OPTIONS = [
  { label: "Kling 2.1 Master", tag: "Latest" },
  { label: "Kling 1.6 Pro", tag: null },
  { label: "Seedance 2.5", tag: "Fast" },
  { label: "Wan 2.1 T2V", tag: null },
];

/* ── Settings state interface ── */
interface GenerationSettings {
  aspectRatio: string;
  duration: number;
  quality: string;
  model: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [promptInput, setPromptInput] = useState("");

  // Upload state
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings popover
  const [showSettings, setShowSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<GenerationSettings>({
    aspectRatio: "16:9",
    duration: 10,
    quality: "High",
    model: "Kling 2.1 Master",
  });

  // Close settings popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(e.target as Node)
      ) {
        setShowSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  /* ── Handle image upload via "+" button ── */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setUploadedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedFileName(null);
  };

  /* ── Handle generate ── */
  const handleStartGenerate = () => {
    const params = new URLSearchParams();
    if (promptInput.trim()) params.set("prompt", promptInput.trim());
    if (uploadedImage) params.set("type", "image-to-video");
    params.set("aspectRatio", settings.aspectRatio);
    params.set("duration", String(settings.duration));
    params.set("quality", settings.quality);
    params.set("model", settings.model);
    router.push(`/generate?${params.toString()}`);
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

          {/* ═══ PROMPT COMPOSER BOX ═══ */}
          <div
            className="relative rounded-3xl p-5 text-left transition-all duration-300 shadow-2xl space-y-3"
            style={{
              background: "oklch(0.08 0.015 260 / 0.8)",
              border: "1px solid oklch(0.82 0.15 205 / 0.3)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 20px 60px -20px oklch(0.82 0.15 205 / 0.2)",
            }}
          >
            {/* Uploaded image preview strip */}
            {uploadedImage && (
              <div className="flex items-center gap-3 px-2 pt-1 pb-2 border-b border-white/5">
                <div className="relative w-14 h-10 rounded-lg overflow-hidden border border-cyan-400/40 flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadedImage}
                    alt="Reference"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-cyan-300 truncate">
                    {uploadedFileName}
                  </p>
                  <p className="text-[10px] text-neutral-500">
                    Image reference · Photo to Video mode
                  </p>
                </div>
                <button
                  onClick={handleRemoveImage}
                  className="w-6 h-6 rounded-full flex items-center justify-center bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Prompt input textarea */}
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={
                uploadedImage
                  ? "Describe how you want this image to move... (e.g., slow zoom in, camera pans left)"
                  : "Ketik ide video, skrip, atau deskripsi visual Anda... (contoh: A cinematic shot of a coffee shop artisan brewing espresso in 4K, slow motion)"
              }
              rows={3}
              className="w-full bg-transparent px-2 py-1 text-sm text-white placeholder:text-neutral-500 focus:outline-none resize-none"
            />

            {/* Bottom toolbar */}
            <div className="flex items-center justify-between pt-3 border-t border-[oklch(1_0_0/0.06)] px-1">
              {/* LEFT: + and Settings buttons */}
              <div className="flex items-center gap-2">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* + Upload button */}
                <button
                  onClick={handleUploadClick}
                  title="Upload image or video reference"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                  style={{
                    background: uploadedImage
                      ? "oklch(0.82 0.15 205 / 0.15)"
                      : "oklch(1 0 0 / 0.06)",
                    border: `1px solid ${uploadedImage ? "oklch(0.82 0.15 205 / 0.4)" : "oklch(1 0 0 / 0.1)"}`,
                    color: uploadedImage
                      ? "oklch(0.82 0.15 205)"
                      : "oklch(1 0 0 / 0.6)",
                  }}
                >
                  {uploadedImage ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">
                    {uploadedImage ? "Image Added" : "Add Reference"}
                  </span>
                </button>

                {/* ⚙ Settings button with popover */}
                <div ref={settingsRef} className="relative">
                  <button
                    onClick={() => setShowSettings((v) => !v)}
                    title="Generation settings"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: showSettings
                        ? "oklch(0.82 0.15 205 / 0.15)"
                        : "oklch(1 0 0 / 0.06)",
                      border: `1px solid ${showSettings ? "oklch(0.82 0.15 205 / 0.4)" : "oklch(1 0 0 / 0.1)"}`,
                      color: showSettings
                        ? "oklch(0.82 0.15 205)"
                        : "oklch(1 0 0 / 0.6)",
                    }}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Settings</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${showSettings ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* ─── Settings Popover ─── */}
                  {showSettings && (
                    <div
                      className="absolute left-0 bottom-full mb-3 w-80 rounded-2xl p-5 space-y-5 z-50"
                      style={{
                        background: "oklch(0.08 0.015 260 / 0.98)",
                        border: "1px solid oklch(0.82 0.15 205 / 0.25)",
                        backdropFilter: "blur(32px)",
                        boxShadow:
                          "0 -20px 60px -10px oklch(0.82 0.15 205 / 0.15)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-white">
                          Generation Settings
                        </p>
                        <button
                          onClick={() => setShowSettings(false)}
                          className="w-6 h-6 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-neutral-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Aspect Ratio */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                          Aspect Ratio
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {ASPECT_RATIOS.map((ar) => (
                            <button
                              key={ar.label}
                              onClick={() =>
                                setSettings((s) => ({
                                  ...s,
                                  aspectRatio: ar.label,
                                }))
                              }
                              className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-semibold transition-all duration-200"
                              style={{
                                background:
                                  settings.aspectRatio === ar.label
                                    ? "oklch(0.82 0.15 205 / 0.2)"
                                    : "oklch(1 0 0 / 0.04)",
                                border: `1px solid ${settings.aspectRatio === ar.label ? "oklch(0.82 0.15 205 / 0.5)" : "oklch(1 0 0 / 0.08)"}`,
                                color:
                                  settings.aspectRatio === ar.label
                                    ? "oklch(0.82 0.15 205)"
                                    : "oklch(1 0 0 / 0.5)",
                              }}
                            >
                              <span className="text-[13px] font-bold">
                                {ar.label}
                              </span>
                              <span style={{ color: "oklch(1 0 0 / 0.35)" }}>
                                {ar.desc}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Duration */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                          Duration
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {DURATIONS.map((d) => (
                            <button
                              key={d.value}
                              onClick={() =>
                                setSettings((s) => ({
                                  ...s,
                                  duration: d.value,
                                }))
                              }
                              className="py-2 rounded-xl text-[11px] font-bold transition-all duration-200"
                              style={{
                                background:
                                  settings.duration === d.value
                                    ? "oklch(0.82 0.15 205 / 0.2)"
                                    : "oklch(1 0 0 / 0.04)",
                                border: `1px solid ${settings.duration === d.value ? "oklch(0.82 0.15 205 / 0.5)" : "oklch(1 0 0 / 0.08)"}`,
                                color:
                                  settings.duration === d.value
                                    ? "oklch(0.82 0.15 205)"
                                    : "oklch(1 0 0 / 0.5)",
                              }}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Quality */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                          Quality
                        </label>
                        <div className="space-y-1.5">
                          {QUALITY_OPTIONS.map((q) => (
                            <button
                              key={q.label}
                              onClick={() =>
                                setSettings((s) => ({ ...s, quality: q.label }))
                              }
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 text-left"
                              style={{
                                background:
                                  settings.quality === q.label
                                    ? "oklch(0.82 0.15 205 / 0.15)"
                                    : "oklch(1 0 0 / 0.04)",
                                border: `1px solid ${settings.quality === q.label ? "oklch(0.82 0.15 205 / 0.4)" : "oklch(1 0 0 / 0.08)"}`,
                              }}
                            >
                              <div>
                                <p
                                  className="text-xs font-semibold"
                                  style={{
                                    color:
                                      settings.quality === q.label
                                        ? "oklch(0.82 0.15 205)"
                                        : "oklch(1 0 0 / 0.7)",
                                  }}
                                >
                                  {q.label}
                                </p>
                                <p className="text-[10px] text-neutral-500">
                                  {q.desc}
                                </p>
                              </div>
                              {settings.quality === q.label && (
                                <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Model */}
                      <div className="space-y-2">
                        <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                          AI Model
                        </label>
                        <div className="space-y-1.5">
                          {MODEL_OPTIONS.map((m) => (
                            <button
                              key={m.label}
                              onClick={() =>
                                setSettings((s) => ({ ...s, model: m.label }))
                              }
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 text-left"
                              style={{
                                background:
                                  settings.model === m.label
                                    ? "oklch(0.82 0.15 205 / 0.15)"
                                    : "oklch(1 0 0 / 0.04)",
                                border: `1px solid ${settings.model === m.label ? "oklch(0.82 0.15 205 / 0.4)" : "oklch(1 0 0 / 0.08)"}`,
                              }}
                            >
                              <span
                                className="text-xs font-semibold"
                                style={{
                                  color:
                                    settings.model === m.label
                                      ? "oklch(0.82 0.15 205)"
                                      : "oklch(1 0 0 / 0.7)",
                                }}
                              >
                                {m.label}
                              </span>
                              <div className="flex items-center gap-2">
                                {m.tag && (
                                  <span
                                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                                    style={{
                                      background: "oklch(0.82 0.15 205 / 0.2)",
                                      color: "oklch(0.82 0.15 205)",
                                      border:
                                        "1px solid oklch(0.82 0.15 205 / 0.3)",
                                    }}
                                  >
                                    {m.tag}
                                  </span>
                                )}
                                {settings.model === m.label && (
                                  <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Active settings summary */}
                      <div
                        className="rounded-xl px-3 py-2 text-[10px] space-y-0.5"
                        style={{
                          background: "oklch(1 0 0 / 0.03)",
                          border: "1px solid oklch(1 0 0 / 0.06)",
                        }}
                      >
                        <p className="text-neutral-400 font-semibold uppercase tracking-wide text-[9px] mb-1">
                          Current Config
                        </p>
                        <p style={{ color: "oklch(1 0 0 / 0.6)" }}>
                          📐 {settings.aspectRatio} · ⏱ {settings.duration}s ·
                          ✨ {settings.quality} · 🤖 {settings.model}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: Generate button */}
              <button
                onClick={handleStartGenerate}
                className="flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-xs tracking-wide transition-all duration-200 hover:scale-105 active:scale-95"
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
