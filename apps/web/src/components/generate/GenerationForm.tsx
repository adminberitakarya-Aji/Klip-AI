"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wand2,
  Upload,
  X,
  Coins,
  Loader2,
  Check,
  Sparkles,
  Camera,
  Clock,
  Tv,
  Film,
} from "lucide-react";
import { Button } from "@klipai/ui/components/button";
import { Textarea } from "@klipai/ui/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@klipai/ui/components/select";
import { cn } from "@klipai/ui/lib/utils";
import { ErrorState } from "@klipai/ui/components/state-components";
import { toast } from "sonner";

type GenerationType = "text-to-video" | "image-to-video" | "video-to-video";
type Resolution = "720p" | "1080p";
type Quality = "standard" | "high";

const studioPresets = [
  "Multi-Scene Cut",
  "UGC-Style Ad",
  "Dynamic Camera Move",
  "Multi-Character Scene",
  "Cinematic Lighting 4K",
];

export function GenerationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("prompt") || "";
  const initialType =
    (searchParams.get("type") as GenerationType) || "text-to-video";

  const [step, setStep] = useState<
    "config" | "preview" | "generating" | "done"
  >("config");
  const [generationType, setGenerationType] =
    useState<GenerationType>(initialType);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [quality, setQuality] = useState<Quality>("standard");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);

  // Fetch balance
  useEffect(() => {
    fetch("/api/credits/balance")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setUserBalance(res.data?.balance ?? res.balance ?? 0);
        }
      })
      .catch(() => {});
  }, []);

  const cost = resolution === "1080p" ? 3 : 2;

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file terlalu besar. Maksimal 10MB");
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const canGenerate = useCallback(() => {
    if (!prompt.trim()) return false;
    if (cost > userBalance) return false;
    if (generationType !== "text-to-video" && !imageFile) return false;
    return true;
  }, [prompt, cost, userBalance, generationType, imageFile]);

  // Handle generate
  const handleGenerate = async () => {
    if (!canGenerate()) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("type", generationType);
      formData.append("prompt", prompt);
      formData.append("resolution", resolution);
      formData.append("quality", quality);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch(`/api/generate/${generationType}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Generation failed");
      }

      if (result.success) {
        setGenerationId(result.data?.jobId || result.data?.id);
        setStep("generating");
        toast.success("Generasi video dimulai!");
        pollStatus(result.data?.jobId || result.data?.id);
      } else {
        throw new Error(result.error?.message || "Generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLoading(false);
    }
  };

  // Poll status
  const pollStatus = async (jobId: string) => {
    let attempts = 0;
    const poll = async () => {
      if (attempts >= 60) {
        setError("Waktu pemrosesan habis. Silakan cek di riwayat.");
        setStep("config");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch(`/api/generations/${jobId}`);
        const result = await response.json();

        if (result.data?.status === "completed") {
          setStep("done");
          toast.success("Video berhasil dibuat!");
          setLoading(false);
          return;
        }
        if (result.data?.status === "failed") {
          setError("Generasi gagal. Silakan coba lagi.");
          setStep("config");
          setLoading(false);
          return;
        }
        attempts++;
        setTimeout(poll, 4000);
      } catch {
        attempts++;
        setTimeout(poll, 4000);
      }
    };
    poll();
  };

  if (error && step === "config") {
    return (
      <ErrorState
        title="Terjadi Kesalahan"
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  if (step === "done") {
    return (
      <div
        className="rounded-3xl p-12 text-center max-w-xl mx-auto"
        style={{
          background: "oklch(0.08 0.015 260 / 0.8)",
          border: "1px solid oklch(0.72 0.2 150 / 0.3)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            background: "oklch(0.72 0.2 150 / 0.15)",
            border: "2px solid oklch(0.72 0.2 150 / 0.4)",
          }}
        >
          <Check className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Video Berhasil Dibuat!
        </h2>
        <p className="text-sm text-neutral-400 mb-8">
          Hasil video AI Anda sudah tersimpan di studio history.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => setStep("config")}
            className="rounded-xl border-neutral-700 text-white hover:bg-neutral-800"
          >
            Generate Lagi
          </Button>
          <Button
            onClick={() => router.push("/credits/history")}
            className="rounded-xl font-bold"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.15 205) 0%, oklch(0.7 0.18 230) 100%)",
              color: "oklch(0.05 0 0)",
            }}
          >
            Lihat di Studio History
          </Button>
        </div>
      </div>
    );
  }

  if (step === "generating") {
    return (
      <div
        className="rounded-3xl p-12 text-center max-w-xl mx-auto"
        style={{
          background: "oklch(0.08 0.015 260 / 0.8)",
          border: "1px solid oklch(0.82 0.15 205 / 0.3)",
          backdropFilter: "blur(20px)",
        }}
      >
        <Loader2 className="w-16 h-16 animate-spin text-cyan-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Membuat Video AI...
        </h2>
        <p className="text-sm text-neutral-400 mb-4">
          Model AI sedang merender frame video. Membutuhkan waktu sekitar 1-2
          menit.
        </p>
        <p className="text-xs text-neutral-500">
          Proses akan otomatis selesai saat video siap.
        </p>
        {generationId && (
          <p className="text-[11px] font-mono text-neutral-600 mt-3">
            ID: {generationId}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* ── STUDIO HEADER (HeyGen Image 4 Style) ── */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          AI Video Generator
        </h1>
        <p className="text-sm text-neutral-400">
          Buat video sinematik berkualitas tinggi dengan AI Seedance 2.5
        </p>
      </div>

      {/* ── MAIN STUDIO PROMPT BUILDER CARD (HeyGen Image 4 Style) ── */}
      <div
        className="rounded-3xl p-6 transition-all duration-300 shadow-2xl space-y-5"
        style={{
          background: "oklch(0.08 0.015 260 / 0.85)",
          border: "1px solid oklch(0.82 0.15 205 / 0.25)",
          backdropFilter: "blur(24px)",
          boxShadow: "0 20px 60px -20px oklch(0.82 0.15 205 / 0.15)",
        }}
      >
        {/* Top Pills Row: Model & Prompt Type Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[oklch(1_0_0/0.06)] pb-4">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"
              style={{
                background: "oklch(0.82 0.15 205 / 0.15)",
                border: "1px solid oklch(0.82 0.15 205 / 0.3)",
                color: "oklch(0.82 0.15 205)",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Seedance 2.5 AI Engine
            </span>

            {/* Generation Type Pills */}
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-neutral-800">
              {(
                [
                  { id: "text-to-video", label: "Text to Video" },
                  { id: "image-to-video", label: "Image to Video" },
                  { id: "video-to-video", label: "Video to Video" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setGenerationType(t.id)}
                  className={cn(
                    "text-xs px-3 py-1 rounded-full font-medium transition-all",
                    generationType === t.id
                      ? "bg-neutral-800 text-white shadow-sm"
                      : "text-neutral-400 hover:text-white",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Saldo Anda:</span>
            <span className="text-xs font-bold text-white bg-neutral-800 px-2.5 py-1 rounded-full border border-neutral-700">
              {userBalance.toLocaleString("id-ID")} credits
            </span>
          </div>
        </div>

        {/* Prompt Textarea */}
        <div className="space-y-2">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
            placeholder="Ketik deskripsi prompt visual video Anda... (Contoh: High quality 4K shot of a futuristic sports car driving through a neon cyber city, dramatic lighting, slow motion 60fps)"
            rows={4}
            className="w-full bg-transparent border-0 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus-visible:ring-0 resize-none p-0"
          />
          <div className="flex justify-end">
            <span className="text-[11px] text-neutral-500">
              {prompt.length} / 500
            </span>
          </div>
        </div>

        {/* Image/Video Upload Box (For Image-to-Video & Video-to-Video) */}
        {generationType !== "text-to-video" && (
          <div className="pt-2 border-t border-[oklch(1_0_0/0.06)]">
            <p className="text-xs font-medium text-neutral-300 mb-2">
              Upload{" "}
              {generationType === "image-to-video"
                ? "Gambar Referensi"
                : "Video Asal"}
            </p>
            {imagePreview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-36 rounded-2xl border border-neutral-700 object-cover"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white shadow-lg"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-3 p-4 rounded-2xl border border-dashed border-neutral-700 bg-black/30 hover:bg-black/50 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-cyan-400" />
                <span className="text-xs text-neutral-400">
                  Klik untuk upload{" "}
                  {generationType === "image-to-video"
                    ? "gambar (JPG/PNG)"
                    : "video (MP4)"}{" "}
                  max 10MB
                </span>
                <input
                  type="file"
                  className="hidden"
                  accept={
                    generationType === "image-to-video" ? "image/*" : "video/*"
                  }
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
        )}

        {/* Parameter Pills Bar (Image 4 Style) */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[oklch(1_0_0/0.06)]">
          <Select
            value={resolution}
            onValueChange={(v) => setResolution(v as Resolution)}
          >
            <SelectTrigger className="w-auto h-8 px-3 rounded-full text-xs bg-neutral-800/80 border-neutral-700 text-white gap-1.5">
              <Tv className="w-3.5 h-3.5 text-cyan-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
              <SelectItem value="720p">720p (HD)</SelectItem>
              <SelectItem value="1080p">1080p (Full HD)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={quality}
            onValueChange={(v) => setQuality(v as Quality)}
          >
            <SelectTrigger className="w-auto h-8 px-3 rounded-full text-xs bg-neutral-800/80 border-neutral-700 text-white gap-1.5">
              <Camera className="w-3.5 h-3.5 text-purple-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-neutral-900 border-neutral-800 text-white">
              <SelectItem value="standard">Standard Quality</SelectItem>
              <SelectItem value="high">High Quality</SelectItem>
            </SelectContent>
          </Select>

          <span className="text-xs px-3 py-1.5 rounded-full bg-neutral-800/80 border border-neutral-700 text-neutral-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            10s Duration
          </span>

          <span className="text-xs px-3 py-1.5 rounded-full bg-neutral-800/80 border border-neutral-700 text-neutral-300 flex items-center gap-1.5">
            <Film className="w-3.5 h-3.5 text-emerald-400" />
            16:9 Aspect Ratio
          </span>
        </div>

        {/* Footer Row: Biaya & Generate Button */}
        <div className="flex items-center justify-between pt-4 border-t border-[oklch(1_0_0/0.06)]">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">Estimasi Biaya:</span>
            <span className="text-sm font-extrabold text-cyan-400 flex items-center gap-1">
              <Coins className="w-4 h-4" />
              {cost} credits
            </span>
            {cost > userBalance && (
              <button
                onClick={() => router.push("/credits")}
                className="text-xs text-red-400 underline ml-2 hover:text-red-300"
              >
                (Saldo kurang - Beli Credits)
              </button>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate() || loading}
            className="flex items-center gap-2 px-8 py-3 rounded-2xl font-extrabold text-sm tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.15 205) 0%, oklch(0.7 0.18 230) 100%)",
              color: "oklch(0.05 0 0)",
              boxShadow: "0 4px 24px -4px oklch(0.82 0.15 205 / 0.6)",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                Generate Video
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Chips Below Box (HeyGen Image 4 Style) */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {studioPresets.map((preset) => (
          <button
            key={preset}
            onClick={() => setPrompt(preset)}
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
  );
}

export default GenerationForm;
