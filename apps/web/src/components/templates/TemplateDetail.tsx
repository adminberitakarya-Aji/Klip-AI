"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDuration, cn } from "@/lib/utils";

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
  brandKitOverlays?: Record<string, any>;
}

interface TemplateDetailProps {
  template: {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    tags: string[];
    industry: string;
    format: string;
    style: string;
    totalDuration: number;
    aspectRatio: string;
    shotCount: number;
    previewThumbnailUrl: string | null;
    previewVideoUrl: string | null;
    creditsCost: number;
    usageCount: number;
    rating: number | null;
    isOfficial: boolean;
    brandKitSlots: Record<string, any>;
    shots: Shot[];
    createdAt: string;
    updatedAt: string;
  };
  onCustomize: () => void;
  onGenerate: () => void;
}

const formatLabels: Record<string, string> = {
  REELS: "Reels",
  TIKTOK: "TikTok",
  STORY: "Story",
  SHORTS: "Shorts",
  FEED: "Feed",
  LANDSCAPE: "Landscape",
};

const styleLabels: Record<string, string> = {
  Cinematic: "🎬 Cinematic",
  UGC: "📱 UGC",
  Commercial: "📺 Commercial",
  Educational: "📚 Educational",
  Documentary: "📹 Documentary",
  Vlog: "🎥 Vlog",
  "Music Video": "🎵 Music Video",
  Minimalist: "✨ Minimalist",
};

export function TemplateDetail({
  template,
  onCustomize,
  onGenerate,
}: TemplateDetailProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "shots" | "brandkit">(
    "overview",
  );
  const [previewPlaying, setPreviewPlaying] = useState(false);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {template.isOfficial && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-500 text-white rounded-full">
              Template Resmi
            </span>
          )}
          <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
            {formatLabels[template.format] || template.format}
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
            {template.category}
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full">
            {styleLabels[template.style] || template.style}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          {template.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
          {template.description}
        </p>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {formatDuration(template.totalDuration)}
          </span>
          <span className="flex items-center gap-1">
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
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            {template.shotCount} shot
          </span>
          <span className="flex items-center gap-1">
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
                d="M7 20l4-16m2 16l4-16M6 9l14 14"
              />
            </svg>
            {template.aspectRatio}
          </span>
          <span className="flex items-center gap-1">
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
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {template.creditsCost} kredit
          </span>
          <span className="flex items-center gap-1">
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
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            {template.usageCount.toLocaleString()} digunakan
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Preview + Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Preview Video */}
          <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video">
            {template.previewVideoUrl ? (
              <>
                <video
                  ref={(el) => {
                    if (el && previewPlaying) el.play().catch(() => {});
                  }}
                  className="w-full h-full object-cover"
                  poster={template.previewThumbnailUrl || undefined}
                  playsInline
                  muted
                  loop
                >
                  <source src={template.previewVideoUrl} type="video/mp4" />
                </video>
                <button
                  onClick={() => setPreviewPlaying(!previewPlaying)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors z-10"
                  aria-label={previewPlaying ? "Pause" : "Play"}
                >
                  {previewPlaying ? (
                    <svg
                      className="w-16 h-16 text-white/90"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-16 h-16 text-white/90 ml-1"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </>
            ) : template.previewThumbnailUrl ? (
              <Image
                src={template.previewThumbnailUrl}
                alt={template.name}
                fill
                className="object-cover"
                priority
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

            {/* Action Buttons Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex gap-3">
              <button
                onClick={onCustomize}
                className="flex-1 px-4 py-3 bg-white/90 text-gray-900 font-semibold rounded-lg hover:bg-white transition-colors shadow-lg"
              >
                Kustomisasi & Gunakan
              </button>
              <button
                onClick={onGenerate}
                className="flex-1 px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg"
              >
                Generate Langsung
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              {[
                { id: "overview", label: "Ringkasan", icon: "📋" },
                { id: "shots", label: "Shot Breakdown", icon: "🎬" },
                { id: "brandkit", label: "Brand Kit Slots", icon: "🎨" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2",
                    activeTab === tab.id
                      ? "text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/20"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800",
                  )}
                >
                  <span>{tab.icon}</span> {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Industri & Cocok Untuk
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                        {template.industry}
                      </span>
                      {template.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Struktur Template
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Template ini memiliki{" "}
                      <strong>{template.shotCount} shot</strong> dengan total
                      durasi{" "}
                      <strong>{formatDuration(template.totalDuration)}</strong>.
                      Setiap shot sudah dikonfigurasi dengan prompt, kamera,
                      lighting, dan gerakan kamera yang dioptimalkan.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Brand Kit yang Didukung
                    </h3>
                    <ul className="space-y-2 text-gray-600 dark:text-gray-300">
                      {template.brandKitSlots?.logo?.required && (
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-primary-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          Logo (wajib) - posisi:{" "}
                          {template.brandKitSlots.logo.positions?.join(", ")}
                        </li>
                      )}
                      {template.brandKitSlots?.colors?.required && (
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-primary-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          Warna brand (wajib) -{" "}
                          {template.brandKitSlots.colors.minCount}-
                          {template.brandKitSlots.colors.maxCount} warna
                        </li>
                      )}
                      {template.brandKitSlots?.font?.required && (
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-primary-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          Font (wajib) - saran:{" "}
                          {template.brandKitSlots.font.suggestions?.join(", ")}
                        </li>
                      )}
                      {template.brandKitSlots?.jingle?.required && (
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-primary-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          Jingle audio (wajib) - durasi{" "}
                          {template.brandKitSlots.jingle.duration}s
                        </li>
                      )}
                      {template.brandKitSlots?.textPlaceholders?.length > 0 && (
                        <li className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-primary-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          {template.brandKitSlots.textPlaceholders.length}{" "}
                          placeholder teks
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === "shots" && (
                <div className="space-y-4">
                  {template.shots.map((shot) => (
                    <div
                      key={shot.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                          {shot.index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Shot {shot.index + 1}: {shot.description}
                            </h4>
                            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                              {shot.timeRange} ({shot.duration}s)
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono text-xs line-clamp-2">
                            {shot.prompt}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {shot.camera && (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                  />
                                </svg>{" "}
                                {shot.camera}
                              </span>
                            )}
                            {shot.lighting && (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>{" "}
                                {shot.lighting}
                              </span>
                            )}
                            {shot.cameraMotion && (
                              <span className="flex items-center gap-1">
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                                  />
                                </svg>{" "}
                                {shot.cameraMotion}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "brandkit" && (
                <div className="space-y-6">
                  {template.brandKitSlots?.textPlaceholders?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Placeholder Teks
                      </h4>
                      <div className="space-y-3">
                        {template.brandKitSlots.textPlaceholders.map(
                          (ph: any) => (
                            <div
                              key={ph.key}
                              className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <code className="text-sm bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                    {ph.key}
                                  </code>
                                  <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {ph.label}
                                  </span>
                                  {ph.required && (
                                    <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                                      Wajib
                                    </span>
                                  )}
                                </div>
                                {ph.defaultValue && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    Default: {ph.defaultValue}
                                  </span>
                                )}
                              </div>
                              {ph.maxLength && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Max {ph.maxLength} karakter
                                </p>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {template.brandKitSlots?.logo && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Logo
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Posisi:
                          </span>
                          <p className="font-medium">
                            {template.brandKitSlots.logo.positions?.join(", ")}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Wajib:
                          </span>
                          <p className="font-medium">
                            {template.brandKitSlots.logo.required
                              ? "Ya"
                              : "Tidak"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {template.brandKitSlots?.colors && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Warna Brand
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Jumlah:
                          </span>
                          <p className="font-medium">
                            {template.brandKitSlots.colors.minCount}-
                            {template.brandKitSlots.colors.maxCount}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Wajib:
                          </span>
                          <p className="font-medium">
                            {template.brandKitSlots.colors.required
                              ? "Ya"
                              : "Tidak"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {template.brandKitSlots?.font && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Font
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Saran:{" "}
                        {template.brandKitSlots.font.suggestions?.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Mulai Buat Video
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Pilih cara Anda ingin menggunakan template ini:
            </p>
            <div className="space-y-3">
              <button
                onClick={onCustomize}
                className="w-full px-4 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors text-center"
              >
                Kustomisasi Lengkap
                <span className="block text-xs opacity-80 mt-1">
                  Edit prompt per shot, upload referensi, pilih brand kit
                </span>
              </button>
              <button
                onClick={onGenerate}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center"
              >
                Generate Cepat
                <span className="block text-xs opacity-70 mt-1">
                  Gunakan default, langsung generate ({template.creditsCost}{" "}
                  kredit)
                </span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Detail Teknis
            </h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">
                  Total Durasi
                </dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {formatDuration(template.totalDuration)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">
                  Jumlah Shot
                </dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {template.shotCount}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">
                  Aspek Rasio
                </dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {template.aspectRatio}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Format</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {formatLabels[template.format] || template.format}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Gaya</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {styleLabels[template.style] || template.style}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Biaya</dt>
                <dd className="font-medium text-primary-600 dark:text-primary-400">
                  {template.creditsCost} kredit
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Dibuat</dt>
                <dd className="font-medium text-gray-900 dark:text-white">
                  {new Date(template.createdAt).toLocaleDateString("id-ID")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
