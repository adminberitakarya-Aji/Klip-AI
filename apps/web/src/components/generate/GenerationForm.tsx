"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Image as ImageIcon,
  Wand2,
  Upload,
  X,
  Coins,
  Loader2,
  Check,
} from "lucide-react";
import { Card } from "@klipai/ui/components/card";
import { Button } from "@klipai/ui/components/button";
import { Textarea } from "@klipai/ui/components/textarea";
import { Label } from "@klipai/ui/components/label";
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

interface GenerationCost {
  credits: number;
  breakdown: {
    base: number;
    resolution: number;
    quality: number;
  };
}

const generationTypes = [
  {
    value: "text-to-video" as const,
    label: "Text to Video",
    description: "Generate video dari prompt teks",
    icon: Video,
  },
  {
    value: "image-to-video" as const,
    label: "Image to Video",
    description: "Animasi gambar jadi video",
    icon: ImageIcon,
  },
  {
    value: "video-to-video" as const,
    label: "Video to Video",
    description: "Transform video yang ada",
    icon: Wand2,
  },
];

const resolutionOptions = [
  { value: "720p" as const, label: "720p (HD)", multiplier: 1.0 },
  { value: "1080p" as const, label: "1080p (Full HD)", multiplier: 1.5 },
];

const qualityOptions = [
  { value: "standard" as const, label: "Standard", multiplier: 1.0 },
  { value: "high" as const, label: "High Quality", multiplier: 1.3 },
];

export function GenerationForm() {
  const router = useRouter();
  const [step, setStep] = useState<
    "config" | "preview" | "generating" | "done"
  >("config");
  const [generationType, setGenerationType] =
    useState<GenerationType>("text-to-video");
  const [prompt, setPrompt] = useState("");
  const [resolution, setResolution] = useState<Resolution>("1080p");
  const [quality, setQuality] = useState<Quality>("standard");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<GenerationCost | null>(
    null,
  );
  const [userBalance, setUserBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);

  // Fetch user balance
  useEffect(() => {
    async function fetchBalance() {
      try {
        const response = await fetch("/api/credits/balance");
        const result = await response.json();
        if (result.success) {
          setUserBalance(result.data.balance);
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    }
    fetchBalance();
  }, []);

  // Calculate estimated cost
  useEffect(() => {
    const baseCost = 2; // Base cost in credits
    const resMultiplier =
      resolutionOptions.find((r) => r.value === resolution)?.multiplier || 1;
    const qualMultiplier =
      qualityOptions.find((q) => q.value === quality)?.multiplier || 1;

    const cost = Math.ceil(baseCost * resMultiplier * qualMultiplier);

    setEstimatedCost({
      credits: cost,
      breakdown: {
        base: baseCost,
        resolution: cost - baseCost,
        quality: 0,
      },
    });
  }, [resolution, quality]);

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
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  // Check if can generate
  const canGenerate = useCallback(() => {
    if (!prompt.trim()) return false;
    if (!estimatedCost) return false;
    if (estimatedCost.credits > userBalance) return false;
    if (generationType !== "text-to-video" && !imageFile) return false;
    return true;
  }, [prompt, estimatedCost, userBalance, generationType, imageFile]);

  // Handle generate
  const handleGenerate = async () => {
    if (!canGenerate()) return;

    setLoading(true);
    setError(null);

    try {
      // Create form data
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
        setGenerationId(result.data.jobId || result.data.id);
        setStep("generating");
        toast.success("Generation started!");

        // Poll for status
        pollGenerationStatus(result.data.jobId || result.data.id);
      } else {
        throw new Error(result.error?.message || "Generation failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  };

  // Poll generation status
  const pollGenerationStatus = async (jobId: string) => {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError("Generation timed out. Please try again.");
        setStep("config");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/generations/${jobId}`);
        const result = await response.json();

        if (result.data?.status === "completed") {
          setStep("done");
          toast.success("Video generated successfully!");
          setLoading(false);
          return;
        }

        if (result.data?.status === "failed") {
          setError("Generation failed. Please try again.");
          setStep("config");
          setLoading(false);
          return;
        }

        attempts++;
        setTimeout(poll, 5000); // Poll every 5 seconds
      } catch {
        attempts++;
        setTimeout(poll, 5000);
      }
    };

    poll();
  };

  // Redirect to view result
  const handleViewResult = () => {
    if (generationId) {
      router.push(`/dashboard/history?highlight=${generationId}`);
    } else {
      router.push("/dashboard");
    }
  };

  // Error state
  if (error && step === "config") {
    return (
      <ErrorState
        title="Terjadi Kesalahan"
        message={error}
        onRetry={() => setError(null)}
      />
    );
  }

  // Done state
  if (step === "done") {
    return (
      <Card className="p-8 text-center bg-neutral-900/50 border-green-500/30">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Video Generated!</h2>
        <p className="text-neutral-400 mb-6">
          Video Anda sedang diproses. Cek di dashboard untuk melihat hasilnya.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => setStep("config")}>
            Generate Lagi
          </Button>
          <Button
            onClick={handleViewResult}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
          >
            Lihat di Dashboard
          </Button>
        </div>
      </Card>
    );
  }

  // Generating state
  if (step === "generating") {
    return (
      <Card className="p-8 text-center bg-neutral-900/50 border-purple-500/30">
        <Loader2 className="h-16 w-16 animate-spin text-purple-500 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Generating Video...
        </h2>
        <p className="text-neutral-400 mb-4">
          Mohon tunggu, proses ini biasanya memakan waktu 1-3 menit.
        </p>
        <p className="text-sm text-neutral-500">
          Halaman ini akan otomatis ter-update saat video siap.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Generation Type Selector */}
      <Card className="p-6 bg-neutral-900/50 border-neutral-800">
        <h3 className="text-lg font-semibold text-white mb-4">
          Pilih Tipe Generation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {generationTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = generationType === type.value;
            return (
              <button
                key={type.value}
                onClick={() => setGenerationType(type.value)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all duration-300 text-left",
                  isSelected
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-neutral-700 bg-neutral-800/50 hover:border-neutral-600",
                )}
              >
                <Icon
                  className={cn(
                    "h-6 w-6 mb-2",
                    isSelected ? "text-purple-400" : "text-neutral-400",
                  )}
                />
                <h4 className="font-semibold text-white">{type.label}</h4>
                <p className="text-xs text-neutral-400 mt-1">
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Prompt Input */}
      <Card className="p-6 bg-neutral-900/50 border-neutral-800">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="prompt" className="text-white">
              Prompt {generationType === "text-to-video" ? "Teks" : "Deskripsi"}
            </Label>
            <span className="text-sm text-neutral-500">
              {prompt.length} / 500
            </span>
          </div>
          <Textarea
            id="prompt"
            placeholder={
              generationType === "text-to-video"
                ? "Contoh: A cinematic shot of a tiger walking through a misty forest, slow motion, 4K..."
                : "Deskripsikan apa yang ingin Anda lihat di video..."
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
            className="min-h-[120px] bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500"
          />
        </div>

        {/* Image Upload (for image-to-video and video-to-video) */}
        {generationType !== "text-to-video" && (
          <div className="mt-4 space-y-2">
            <Label>
              Upload {generationType === "image-to-video" ? "Gambar" : "Video"}
            </Label>
            {imagePreview ? (
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-40 rounded-lg border border-neutral-700"
                />
                <button
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-700 border-dashed rounded-lg cursor-pointer bg-neutral-800/50 hover:bg-neutral-800 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-neutral-500 mb-2" />
                  <p className="text-sm text-neutral-400">
                    Klik untuk upload{" "}
                    {generationType === "image-to-video" ? "gambar" : "video"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Max 10MB, JPG/PNG/MP4
                  </p>
                </div>
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
      </Card>

      {/* Settings */}
      <Card className="p-6 bg-neutral-900/50 border-neutral-800">
        <h3 className="text-lg font-semibold text-white mb-4">Pengaturan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Resolusi</Label>
            <Select
              value={resolution}
              onValueChange={(v) => setResolution(v as Resolution)}
            >
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                {resolutionOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Kualitas</Label>
            <Select
              value={quality}
              onValueChange={(v) => setQuality(v as Quality)}
            >
              <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-800 border-neutral-700">
                {qualityOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Cost Preview */}
      <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Coins className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-neutral-400">Estimasi Biaya</p>
              <p className="text-2xl font-bold text-white">
                {estimatedCost?.credits || 0} credits
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-400">Saldo Anda</p>
            <p className="text-xl font-bold text-white">
              {userBalance.toLocaleString("id-ID")} credits
            </p>
            {estimatedCost && estimatedCost.credits > userBalance && (
              <p className="text-sm text-red-400 mt-1">Saldo tidak cukup</p>
            )}
          </div>
        </div>
      </Card>

      {/* Generate Button */}
      <div className="flex gap-4">
        <Button
          onClick={handleGenerate}
          disabled={!canGenerate() || loading}
          className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-lg font-semibold disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5 mr-2" />
              Generate Video
            </>
          )}
        </Button>
        {(estimatedCost?.credits || 0) > userBalance && (
          <Button
            variant="outline"
            onClick={() => router.push("/credits")}
            className="border-purple-500/50 text-purple-400"
          >
            Beli Credits
          </Button>
        )}
      </div>
    </div>
  );
}

export default GenerationForm;
