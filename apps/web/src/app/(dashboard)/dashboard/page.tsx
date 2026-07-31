"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Wand2,
  Plus,
  SlidersHorizontal,
  X,
  Check,
  ChevronDown,
} from "lucide-react";
import { RecentGenerations } from "@/components/dashboard/RecentGenerations";
import { UserBalance } from "@/components/dashboard/UserBalance";

/* ── Studio Cards ── */
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

/* ── Aspect Ratio visual icons (Compact) ── */
const ASPECT_RATIOS = [
  { label: "16:9", w: 22, h: 13 },
  { label: "4:3", w: 19, h: 14 },
  { label: "1:1", w: 16, h: 16 },
  { label: "3:4", w: 14, h: 19 },
  { label: "9:16", w: 13, h: 22 },
];

const VIDEO_ASPECT_RATIOS = [
  { label: "16:9", w: 22, h: 13 },
  { label: "9:16", w: 13, h: 22 },
];

const SCALE_OPTIONS = ["x1", "x2", "x3", "x4"];

/* ── Mini Aspect Ratio Icon ── */
function AspectIcon({
  w,
  h,
  active,
}: {
  w: number;
  h: number;
  active: boolean;
}) {
  const svgW = 28;
  const svgH = 24;
  const rx = (svgW - w) / 2;
  const ry = (svgH - h) / 2;
  return (
    <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      <rect
        x={rx}
        y={ry}
        width={w}
        height={h}
        rx={2}
        fill="none"
        stroke={active ? "oklch(0.82 0.15 205)" : "oklch(1 0 0 / 0.3)"}
        strokeWidth={1.5}
      />
    </svg>
  );
}

interface GenerationSettings {
  imageAspectRatio: string;
  imageScale: string;
  videoAspectRatio: string;
  videoScale: string;
  confirmBeforeCreate: boolean;
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
    imageAspectRatio: "16:9",
    imageScale: "x1",
    videoAspectRatio: "16:9",
    videoScale: "x1",
    confirmBeforeCreate: true,
  });

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

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setUploadedFileName(null);
  };

  const handleStartGenerate = () => {
    const params = new URLSearchParams();
    if (promptInput.trim()) params.set("prompt", promptInput.trim());
    if (uploadedImage) params.set("type", "image-to-video");
    params.set("imageAspectRatio", settings.imageAspectRatio);
    params.set("imageScale", settings.imageScale);
    params.set("videoAspectRatio", settings.videoAspectRatio);
    params.set("videoScale", settings.videoScale);
    router.push(`/generate?${params.toString()}`);
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden text-white"
      style={{ background: "oklch(0.04 0 0)" }}
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.5 0.18 205 / 0.25) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 90%, oklch(0.7 0.18 55 / 0.15) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-10 space-y-12">
        {/* ── HERO (z-40 stacking context so popover floats above cards below) ── */}
        <div className="relative z-40 text-center max-w-3xl mx-auto space-y-6 pt-4">
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

          {/* ═══ PROMPT COMPOSER ═══ */}
          <div
            className="relative z-30 rounded-3xl p-5 text-left transition-all duration-300 shadow-2xl space-y-3"
            style={{
              background: "oklch(0.08 0.015 260 / 0.8)",
              border: "1px solid oklch(0.82 0.15 205 / 0.3)",
              backdropFilter: "blur(24px)",
              boxShadow: "0 20px 60px -20px oklch(0.82 0.15 205 / 0.2)",
            }}
          >
            {/* Uploaded image preview */}
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
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Textarea */}
            <textarea
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder={
                uploadedImage
                  ? "Describe how you want this image to move..."
                  : "Ketik ide video, skrip, atau deskripsi visual Anda... (contoh: A cinematic shot of a coffee shop artisan brewing espresso in 4K, slow motion)"
              }
              rows={3}
              className="w-full bg-transparent px-2 py-1 text-sm text-white placeholder:text-neutral-500 focus:outline-none resize-none"
            />

            {/* Toolbar */}
            <div className="flex items-center justify-between pt-3 border-t border-[oklch(1_0_0/0.06)] px-1">
              <div className="flex items-center gap-2">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />

                {/* + Upload */}
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

                {/* ⚙ Settings */}
                <div ref={settingsRef} className="relative">
                  <button
                    onClick={() => setShowSettings((v) => !v)}
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
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Settings</span>
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${showSettings ? "rotate-180" : ""}`}
                    />
                  </button>

                  {/* ─── SETTINGS POPOVER (High Z-Index z-[100] & Solid Dark Glass BG) ─── */}
                  {showSettings && (
                    <div
                      className="absolute left-0 top-full mt-2.5 w-[290px] rounded-2xl z-[100] p-4 space-y-3.5 shadow-2xl transition-all duration-200"
                      style={{
                        background: "oklch(0.1 0.015 260)",
                        border: "1px solid oklch(0.82 0.15 205 / 0.35)",
                        boxShadow:
                          "0 24px 64px 8px oklch(0 0 0 / 0.95), 0 0 24px oklch(0.82 0.15 205 / 0.15)",
                      }}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between pb-1 border-b border-white/10">
                        <span className="text-xs font-bold text-white tracking-wide">
                          Pengaturan Pembuatan
                        </span>
                        <button
                          onClick={() => setShowSettings(false)}
                          className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Konfirmasi sebelum membuat */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Konfirmasi pembuatan
                        </label>
                        <div className="p-0.5 rounded-xl bg-white/[0.04] border border-white/5 flex gap-1">
                          <button
                            onClick={() =>
                              setSettings((s) => ({
                                ...s,
                                confirmBeforeCreate: true,
                              }))
                            }
                            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center"
                            style={{
                              background: settings.confirmBeforeCreate
                                ? "oklch(0.82 0.15 205 / 0.2)"
                                : "transparent",
                              color: settings.confirmBeforeCreate
                                ? "oklch(0.82 0.15 205)"
                                : "oklch(1 0 0 / 0.5)",
                              border: settings.confirmBeforeCreate
                                ? "1px solid oklch(0.82 0.15 205 / 0.4)"
                                : "1px solid transparent",
                            }}
                          >
                            Selalu Minta
                          </button>
                          <button
                            onClick={() =>
                              setSettings((s) => ({
                                ...s,
                                confirmBeforeCreate: false,
                              }))
                            }
                            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all text-center"
                            style={{
                              background: !settings.confirmBeforeCreate
                                ? "oklch(0.82 0.15 205 / 0.2)"
                                : "transparent",
                              color: !settings.confirmBeforeCreate
                                ? "oklch(0.82 0.15 205)"
                                : "oklch(1 0 0 / 0.5)",
                              border: !settings.confirmBeforeCreate
                                ? "1px solid oklch(0.82 0.15 205 / 0.4)"
                                : "1px solid transparent",
                            }}
                          >
                            Otomatis
                          </button>
                        </div>
                      </div>

                      {/* Default pembuatan gambar */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Default Gambar
                        </label>
                        {/* Aspect ratios row */}
                        <div className="flex items-center gap-1">
                          {ASPECT_RATIOS.map((ar) => {
                            const active =
                              settings.imageAspectRatio === ar.label;
                            return (
                              <button
                                key={ar.label}
                                onClick={() =>
                                  setSettings((s) => ({
                                    ...s,
                                    imageAspectRatio: ar.label,
                                  }))
                                }
                                className="flex-1 flex flex-col items-center py-1.5 px-0.5 rounded-lg transition-all"
                                style={{
                                  background: active
                                    ? "oklch(0.82 0.15 205 / 0.15)"
                                    : "oklch(1 0 0 / 0.03)",
                                  border: `1px solid ${active ? "oklch(0.82 0.15 205 / 0.5)" : "oklch(1 0 0 / 0.06)"}`,
                                }}
                              >
                                <AspectIcon w={ar.w} h={ar.h} active={active} />
                                <span
                                  className="text-[9px] font-bold mt-0.5"
                                  style={{
                                    color: active
                                      ? "oklch(0.82 0.15 205)"
                                      : "oklch(1 0 0 / 0.4)",
                                  }}
                                >
                                  {ar.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {/* Scale pills */}
                        <div className="p-0.5 rounded-xl bg-white/[0.04] border border-white/5 grid grid-cols-4 gap-0.5">
                          {SCALE_OPTIONS.map((sc) => {
                            const active = settings.imageScale === sc;
                            return (
                              <button
                                key={sc}
                                onClick={() =>
                                  setSettings((s) => ({ ...s, imageScale: sc }))
                                }
                                className="py-1 rounded-lg text-[10px] font-bold transition-all text-center"
                                style={{
                                  background: active
                                    ? "oklch(0.82 0.15 205 / 0.25)"
                                    : "transparent",
                                  color: active
                                    ? "white"
                                    : "oklch(1 0 0 / 0.4)",
                                }}
                              >
                                {sc}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Default pembuatan video */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Default Video
                        </label>
                        {/* Aspect ratio options */}
                        <div className="flex items-center gap-1.5">
                          {VIDEO_ASPECT_RATIOS.map((ar) => {
                            const active =
                              settings.videoAspectRatio === ar.label;
                            return (
                              <button
                                key={ar.label}
                                onClick={() =>
                                  setSettings((s) => ({
                                    ...s,
                                    videoAspectRatio: ar.label,
                                  }))
                                }
                                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg transition-all"
                                style={{
                                  background: active
                                    ? "oklch(0.82 0.15 205 / 0.15)"
                                    : "oklch(1 0 0 / 0.03)",
                                  border: `1px solid ${active ? "oklch(0.82 0.15 205 / 0.5)" : "oklch(1 0 0 / 0.06)"}`,
                                }}
                              >
                                <AspectIcon w={ar.w} h={ar.h} active={active} />
                                <span
                                  className="text-[10px] font-bold"
                                  style={{
                                    color: active
                                      ? "oklch(0.82 0.15 205)"
                                      : "oklch(1 0 0 / 0.5)",
                                  }}
                                >
                                  {ar.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        {/* Scale pills */}
                        <div className="p-0.5 rounded-xl bg-white/[0.04] border border-white/5 grid grid-cols-4 gap-0.5">
                          {SCALE_OPTIONS.map((sc) => {
                            const active = settings.videoScale === sc;
                            return (
                              <button
                                key={sc}
                                onClick={() =>
                                  setSettings((s) => ({ ...s, videoScale: sc }))
                                }
                                className="py-1 rounded-lg text-[10px] font-bold transition-all text-center"
                                style={{
                                  background: active
                                    ? "oklch(0.82 0.15 205 / 0.25)"
                                    : "transparent",
                                  color: active
                                    ? "white"
                                    : "oklch(1 0 0 / 0.4)",
                                }}
                              >
                                {sc}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Generate button */}
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

        {/* ── USER BALANCE ── */}
        <div className="max-w-4xl mx-auto">
          <UserBalance />
        </div>

        {/* ── FEATURE CARDS GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {studioCards.map((card) => (
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
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ backgroundImage: `url('${card.image}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
              <div className="relative z-10 flex justify-end">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-md ${card.badgeColor}`}
                >
                  {card.badge}
                </span>
              </div>
              <div className="relative z-10 space-y-1">
                <h3 className="text-xl font-black text-white tracking-tight drop-shadow-md group-hover:text-cyan-300 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs font-semibold text-neutral-300 group-hover:text-white transition-colors">
                  {card.actionText}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── RECENT GENERATIONS ── */}
        <div className="max-w-6xl mx-auto pt-4">
          <RecentGenerations />
        </div>
      </div>
    </div>
  );
}
