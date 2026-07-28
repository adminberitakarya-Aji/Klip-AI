"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { formatDuration, cn } from "@/lib/utils";
import { toast } from "sonner";

interface Shot {
  id: string;
  index: number;
  timeRange: string;
  duration: number;
  description: string;
  prompt: string;
  negativePrompt?: string | null;
  camera?: string | null;
  lighting?: string | null;
  generationType: string;
  resolution: string;
  fps: number;
  cameraMotion?: string | null;
  motionStrength?: number | null;
  referenceImageUrl?: string | null;
  referenceRole?: string | null;
  referenceWeight?: number | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  brandKitOverlays?: any;
}

interface BrandKit {
  id: string;
  name: string;
  logoUrl: string | null;
  colorPalette: string[];
  primaryFont: string | null;
  secondaryFont: string | null;
  jingleUrl: string | null;
  textValues: Record<string, string>;
}

interface TemplateCustomizeProps {
  template: {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    tags: string[];
    industry: string | null;
    format: string;
    style: string;
    totalDuration: number;
    aspectRatio: string;
    shotCount: number;
    previewThumbnailUrl: string | null;
    previewVideoUrl: string | null;
    creditsCost: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    brandKitSlots: any;
    shots: Shot[];
    createdAt: string;
  };
  brandKits: BrandKit[];
  userCredits: number;
}

export function TemplateCustomize({
  template,
  brandKits,
  userCredits,
}: TemplateCustomizeProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStep, setActiveStep] = useState<"shots" | "brandkit" | "review">(
    "shots",
  );
  const [selectedBrandKit, setSelectedBrandKit] = useState<string | null>(
    searchParams.get("brandKitId"),
  );
  const [shotOverrides, setShotOverrides] = useState<
    Record<
      string,
      {
        prompt?: string;
        negativePrompt?: string;
        camera?: string;
        lighting?: string;
        referenceImageUrl?: string;
      }
    >
  >({});
  const [referenceStyleUrl, setReferenceStyleUrl] = useState("");
  const [brandKitOverrides, setBrandKitOverrides] = useState<{
    logoUrl?: string;
    logoPosition?: string;
    logoOpacity?: number;
    colorPalette?: string[];
    primaryFont?: string;
    secondaryFont?: string;
    jingleUrl?: string;
    textValues?: Record<string, string>;
  }>({});
  const [generating, setGenerating] = useState(false);

  // Initialize shot overrides with defaults
  useEffect(() => {
    const initialOverrides: Record<string, Record<string, string>> = {};
    template.shots.forEach((shot) => {
      initialOverrides[shot.id] = {
        prompt: shot.prompt,
        negativePrompt: shot.negativePrompt || "",
        camera: shot.camera || "",
        lighting: shot.lighting || "",
        referenceImageUrl: shot.referenceImageUrl || "",
      };
    });
    setShotOverrides(initialOverrides);
  }, [template.shots]);

  // Initialize brand kit overrides from selected brand kit
  useEffect(() => {
    if (selectedBrandKit) {
      const bk = brandKits.find((b) => b.id === selectedBrandKit);
      if (bk) {
        setBrandKitOverrides({
          logoUrl: bk.logoUrl || "",
          logoPosition: "bottom-right",
          logoOpacity: 0.9,
          colorPalette: bk.colorPalette,
          primaryFont: bk.primaryFont || "",
          secondaryFont: bk.secondaryFont || "",
          jingleUrl: bk.jingleUrl || "",
          textValues: bk.textValues,
        });
      }
    }
  }, [selectedBrandKit, brandKits]);

  const handleShotPromptChange = (
    shotId: string,
    field: string,
    value: string,
  ) => {
    setShotOverrides((prev) => ({
      ...prev,
      [shotId]: { ...prev[shotId], [field]: value },
    }));
  };

  const handleBrandKitOverrideChange = (field: string, value: unknown) => {
    setBrandKitOverrides((prev) => ({ ...prev, [field]: value }));
  };

  const handleTextPlaceholderChange = (key: string, value: string) => {
    setBrandKitOverrides((prev) => ({
      ...prev,
      textValues: { ...prev.textValues, [key]: value },
    }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const customizations = {
        shotOverrides,
        referenceStyleUrl: referenceStyleUrl || undefined,
        brandKitOverrides:
          Object.keys(brandKitOverrides).length > 0
            ? brandKitOverrides
            : undefined,
      };

      const res = await fetch("/api/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          brandKitId: selectedBrandKit || undefined,
          customizations,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveStep("review");
        toast.success("Generate dimulai! Kredit sudah dipotong.");
        router.push(
          `/templates/${template.slug}/generate?jobId=${data.data.jobId}`,
        );
      } else {
        toast.error(data.error?.message || "Gagal memulai generate");
      }
    } catch (error) {
      console.error("Generate error:", error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setGenerating(false);
    }
  };

  const canGenerate = userCredits >= template.creditsCost;

  const formatLabels: Record<string, string> = {
    REELS: "Reels",
    TIKTOK: "TikTok",
    STORY: "Story",
    SHORTS: "Shorts",
    FEED: "Feed",
    LANDSCAPE: "Landscape",
  };

  const stepLabels = [
    { id: "shots", label: "Shot & Prompt", icon: "🎬" },
    { id: "brandkit", label: "Brand Kit", icon: "🎨" },
    { id: "review", label: "Review & Generate", icon: "✅" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Progress Steps */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {stepLabels.map((step, i) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                      activeStep === step.id
                        ? "bg-primary-600 text-white"
                        : stepLabels.findIndex((s) => s.id === activeStep) > i
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
                    )}
                  >
                    {stepLabels.findIndex((s) => s.id === activeStep) > i ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span>{step.icon}</span>
                    )}
                  </div>
                  {i < stepLabels.length - 1 && (
                    <div
                      className={cn(
                        "w-16 h-0.5 mx-2",
                        stepLabels.findIndex((s) => s.id === activeStep) > i
                          ? "bg-green-500"
                          : "bg-gray-200 dark:bg-gray-700",
                      )}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4 text-primary-600 dark:text-primary-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M12 2a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2h6z" />
                  <path d="M10 6a1 1 0 100-2 1 1 0 000 2z" />
                  <path d="M10 12a1 1 0 100 2 1 1 0 000-2z" />
                </svg>
                {template.creditsCost} kredit
              </span>
              <span className="flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 2a8 8 0 108 8A8 8 0 0010 2z" />
                </svg>
                {formatDuration(template.totalDuration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Template Preview Sidebar */}
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 space-y-6">
              {/* Preview */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="relative aspect-video bg-gray-900">
                  {template.previewVideoUrl ? (
                    <video
                      className="w-full h-full object-cover"
                      poster={template.previewThumbnailUrl || undefined}
                      playsInline
                      muted
                      loop
                    >
                      <source src={template.previewVideoUrl} type="video/mp4" />
                    </video>
                  ) : template.previewThumbnailUrl ? (
                    <Image
                      src={template.previewThumbnailUrl}
                      alt={template.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary-500/20 to-primary-600/20">
                      <svg
                        className="w-24 h-24 text-primary-500/50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
                      {formatLabels[template.format] || template.format}
                    </span>
                    <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                      {template.shotCount} Shot
                    </span>
                    <span className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                      {template.creditsCost} Kredit
                    </span>
                  </div>
                </div>
              </div>

              {/* Credits Balance */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Kredit Tersedia
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userCredits}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Biaya Template
                    </p>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {template.creditsCost}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (userCredits / template.creditsCost) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
                  {canGenerate
                    ? "Cukup kredit untuk generate"
                    : `Kurang ${template.creditsCost - userCredits} kredit`}
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {/* Step 1: Shot Customization */}
            {activeStep === "shots" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                      🎬
                    </span>
                    Kustomisasi Shot & Prompt
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Edit prompt, kamera, lighting per shot. Referensi visual
                    opsional.
                  </p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {template.shots.map((shot) => (
                    <div key={shot.id} className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xl">
                          {shot.index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              Shot {shot.index + 1}: {shot.description}
                            </h3>
                            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                              {shot.timeRange} ({shot.duration}s)
                            </span>
                          </div>

                          {/* Prompt Editor */}
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Prompt
                              </label>
                              <textarea
                                value={
                                  shotOverrides[shot.id]?.prompt || shot.prompt
                                }
                                onChange={(e) =>
                                  handleShotPromptChange(
                                    shot.id,
                                    "prompt",
                                    e.target.value,
                                  )
                                }
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                                placeholder={shot.prompt}
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Negative Prompt
                                </label>
                                <input
                                  type="text"
                                  value={
                                    shotOverrides[shot.id]?.negativePrompt ||
                                    shot.negativePrompt ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    handleShotPromptChange(
                                      shot.id,
                                      "negativePrompt",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="Apa yang TIDAK diinginkan..."
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Referensi Visual (URL)
                                </label>
                                <input
                                  type="url"
                                  value={
                                    shotOverrides[shot.id]?.referenceImageUrl ||
                                    shot.referenceImageUrl ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    handleShotPromptChange(
                                      shot.id,
                                      "referenceImageUrl",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder="https://..."
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Kamera
                                </label>
                                <input
                                  type="text"
                                  value={
                                    shotOverrides[shot.id]?.camera ||
                                    shot.camera ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    handleShotPromptChange(
                                      shot.id,
                                      "camera",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder={
                                    shot.camera ||
                                    "Contoh: Macro lens 100mm, f/2.8"
                                  }
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Lighting
                                </label>
                                <input
                                  type="text"
                                  value={
                                    shotOverrides[shot.id]?.lighting ||
                                    shot.lighting ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    handleShotPromptChange(
                                      shot.id,
                                      "lighting",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                  placeholder={
                                    shot.lighting ||
                                    "Contoh: Three-point lighting, rim light"
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Brand Kit */}
            {activeStep === "brandkit" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                      🎨
                    </span>
                    Brand Kit & Placeholder
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Pilih brand kit atau override manual. Placeholder teks akan
                    diganti otomatis saat generate.
                  </p>
                </div>
                <div className="p-6 space-y-8">
                  {/* Brand Kit Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Pilih Brand Kit
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <button
                        onClick={() => setSelectedBrandKit(null)}
                        className={cn(
                          "p-4 border-2 rounded-xl transition-all text-left",
                          !selectedBrandKit
                            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17a4 4 0 118 0h-8z"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              Tanpa Brand Kit
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Gunakan default template
                            </p>
                          </div>
                        </div>
                      </button>
                      {brandKits.map((bk) => (
                        <button
                          key={bk.id}
                          onClick={() => setSelectedBrandKit(bk.id)}
                          className={cn(
                            "p-4 border-2 rounded-xl transition-all text-left",
                            selectedBrandKit === bk.id
                              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                              : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                              {bk.logoUrl ? (
                                <Image
                                  src={bk.logoUrl}
                                  alt={bk.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <svg
                                  className="w-5 h-5 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17a4 4 0 118 0h-8z"
                                  />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {bk.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {bk.colorPalette.length} warna •{" "}
                                {bk.primaryFont || "Font default"}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Brand Kit Overrides */}
                  {selectedBrandKit && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-6">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Override Brand Kit (Opsional)
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Logo URL
                          </label>
                          <input
                            type="url"
                            value={brandKitOverrides.logoUrl || ""}
                            onChange={(e) =>
                              handleBrandKitOverrideChange(
                                "logoUrl",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Posisi Logo
                          </label>
                          <select
                            value={
                              brandKitOverrides.logoPosition || "bottom-right"
                            }
                            onChange={(e) =>
                              handleBrandKitOverrideChange(
                                "logoPosition",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          >
                            <option value="top-left">Kiri Atas</option>
                            <option value="top-right">Kanan Atas</option>
                            <option value="bottom-left">Kiri Bawah</option>
                            <option value="bottom-right">Kanan Bawah</option>
                            <option value="center">Tengah</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Opasitas Logo
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={brandKitOverrides.logoOpacity || 0.9}
                            onChange={(e) =>
                              handleBrandKitOverrideChange(
                                "logoOpacity",
                                parseFloat(e.target.value),
                              )
                            }
                            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Font Utama
                          </label>
                          <input
                            type="text"
                            value={brandKitOverrides.primaryFont || ""}
                            onChange={(e) =>
                              handleBrandKitOverrideChange(
                                "primaryFont",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Contoh: Inter, Poppins"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Font Sekunder
                          </label>
                          <input
                            type="text"
                            value={brandKitOverrides.secondaryFont || ""}
                            onChange={(e) =>
                              handleBrandKitOverrideChange(
                                "secondaryFont",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Contoh: Roboto, Montserrat"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Jingle URL
                          </label>
                          <input
                            type="url"
                            value={brandKitOverrides.jingleUrl || ""}
                            onChange={(e) =>
                              handleBrandKitOverrideChange(
                                "jingleUrl",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="https://... (audio file)"
                          />
                        </div>
                      </div>

                      {/* Color Palette */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Palet Warna
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(brandKitOverrides.colorPalette || []).map(
                            (color, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={color}
                                  onChange={(e) => {
                                    const newPalette = [
                                      ...(brandKitOverrides.colorPalette || []),
                                    ];
                                    newPalette[i] = e.target.value;
                                    handleBrandKitOverrideChange(
                                      "colorPalette",
                                      newPalette,
                                    );
                                  }}
                                  className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
                                />
                                <input
                                  type="text"
                                  value={color}
                                  onChange={(e) => {
                                    const newPalette = [
                                      ...(brandKitOverrides.colorPalette || []),
                                    ];
                                    newPalette[i] = e.target.value;
                                    handleBrandKitOverrideChange(
                                      "colorPalette",
                                      newPalette,
                                    );
                                  }}
                                  className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 font-mono text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPalette = (
                                      brandKitOverrides.colorPalette || []
                                    ).filter((_, idx) => idx !== i);
                                    handleBrandKitOverrideChange(
                                      "colorPalette",
                                      newPalette,
                                    );
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M6 18L18 6M6 6l12 12"
                                    />
                                  </svg>
                                </button>
                              </div>
                            ),
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handleBrandKitOverrideChange("colorPalette", [
                                ...(brandKitOverrides.colorPalette || []),
                                "#000000",
                              ])
                            }
                            className="px-3 py-1 text-sm border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600"
                          >
                            + Tambah Warna
                          </button>
                        </div>
                      </div>

                      {/* Text Placeholders */}
                      {template.brandKitSlots?.textPlaceholders?.length > 0 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-4">
                            Placeholder Teks (Wajib diisi)
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {template.brandKitSlots?.textPlaceholders?.map(
                              (ph: any) => (
                                <div key={ph.key}>
                                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                    {ph.label}
                                    {ph.required && (
                                      <span className="text-red-500">*</span>
                                    )}
                                  </label>
                                  <input
                                    type="text"
                                    value={
                                      brandKitOverrides.textValues?.[ph.key] ||
                                      ph.defaultValue ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      handleTextPlaceholderChange(
                                        ph.key,
                                        e.target.value,
                                      )
                                    }
                                    maxLength={ph.maxLength}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder={
                                      ph.defaultValue ||
                                      `Masukkan ${ph.label.toLowerCase()}`
                                    }
                                  />
                                  {ph.maxLength && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                                      Max {ph.maxLength} karakter
                                    </p>
                                  )}
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reference Style */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      Referensi Gaya Visual (Opsional)
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        URL Gambar Referensi Style
                      </label>
                      <input
                        type="url"
                        value={referenceStyleUrl}
                        onChange={(e) => setReferenceStyleUrl(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://... (akan diterapkan ke seluruh video)"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Gaya visual dari gambar ini akan dicampurkan ke semua
                        shot
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review & Generate */}
            {activeStep === "review" && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400">
                      ✅
                    </span>
                    Review & Generate
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Periksa konfigurasi sebelum memulai generate
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  {/* Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Ringkasan Template
                      </h3>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Template
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-white">
                            {template.name}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Durasi
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-white">
                            {formatDuration(template.totalDuration)}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Shot
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-white">
                            {template.shotCount} shot
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Format
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-white">
                            {formatLabels[template.format] || template.format}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Biaya
                          </dt>
                          <dd className="font-medium text-primary-600 dark:text-primary-400">
                            {template.creditsCost} kredit
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Brand Kit & Customisasi
                      </h3>
                      <dl className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Brand Kit
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-white">
                            {selectedBrandKit
                              ? brandKits.find((b) => b.id === selectedBrandKit)
                                  ?.name || "Dipilih"
                              : "Tidak menggunakan"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Shot Dikustomisasi
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-white">
                            {
                              Object.keys(shotOverrides).filter(
                                (k) =>
                                  shotOverrides[k].prompt !==
                                  template.shots.find((s) => s.id === k)
                                    ?.prompt,
                              ).length
                            }{" "}
                            dari {template.shotCount}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Referensi Style
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-white">
                            {referenceStyleUrl ? "Ya" : "Tidak"}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Kredit Tersedia
                          </dt>
                          <dd className="font-medium text-gray-900 dark:text-white">
                            {userCredits}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-500 dark:text-gray-400">
                            Sisa Setelah Generate
                          </dt>
                          <dd
                            className={`font-medium ${canGenerate ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                          >
                            {userCredits - template.creditsCost}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Shot Preview */}
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                      Preview Shot yang Akan Dibuat
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {template.shots.map((shot) => {
                        const override = shotOverrides[shot.id];
                        const hasChanges =
                          override &&
                          (override.prompt !== shot.prompt ||
                            override.negativePrompt !==
                              (shot.negativePrompt || "") ||
                            override.camera !== (shot.camera || "") ||
                            override.lighting !== (shot.lighting || "") ||
                            override.referenceImageUrl !==
                              (shot.referenceImageUrl || ""));
                        return (
                          <div
                            key={shot.id}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                          >
                            <span className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
                              {shot.index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {shot.description}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
                                {override?.prompt || shot.prompt}
                              </p>
                            </div>
                            {hasChanges && (
                              <span className="px-2 py-1 text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                                Dimodifikasi
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Generate Button */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col sm:flex-row gap-4 justify-end">
                    <button
                      onClick={() => setActiveStep("brandkit")}
                      className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={generating || !canGenerate}
                      className="px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {generating ? (
                        <>
                          <svg
                            className="animate-spin w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Memulai Generate...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          Generate Video ({template.creditsCost} kredit)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation for steps 1 & 2 */}
            {(activeStep === "shots" || activeStep === "brandkit") && (
              <div className="flex justify-between">
                {activeStep === "brandkit" && (
                  <button
                    onClick={() => setActiveStep("shots")}
                    className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    ← Kembali
                  </button>
                )}
                <div className="flex gap-3 ml-auto">
                  {activeStep === "shots" && (
                    <button
                      onClick={() => setActiveStep("brandkit")}
                      className="px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                    >
                      Lanjut: Brand Kit →
                    </button>
                  )}
                  {activeStep === "brandkit" && (
                    <button
                      onClick={() => setActiveStep("review")}
                      className="px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700"
                    >
                      Lanjut: Review →
                    </button>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
