"use client";

import Image from "next/image";
import { formatDuration } from "@/lib/utils";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    tags: string[];
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
    createdAt: string;
  };
  onClick: () => void;
}

export function TemplateCard({ template, onClick }: TemplateCardProps) {
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

  return (
    <article
      className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-primary-500/50 transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] overflow-hidden bg-gray-100 dark:bg-gray-700">
        {template.previewThumbnailUrl ? (
          <Image
            src={template.previewThumbnailUrl}
            alt={template.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary-500/20 to-primary-600/20">
            <svg
              className="w-16 h-16 text-primary-500/50"
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

        {/* Badges */}
        <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1">
          {template.isOfficial && (
            <span className="px-2 py-0.5 text-xs font-medium bg-amber-500 text-white rounded-full">
              Resmi
            </span>
          )}
          <span className="px-2 py-0.5 text-xs font-medium bg-black/70 text-white rounded-full backdrop-blur">
            {formatLabels[template.format] || template.format}
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-black/70 text-white rounded-full backdrop-blur">
            {template.shotCount} Shot
          </span>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 text-xs font-semibold bg-black/80 text-white rounded-full backdrop-blur">
          {formatDuration(template.totalDuration)}
        </div>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <button
            className="p-3 bg-white/90 rounded-full shadow-lg hover:scale-110 transition-transform"
            aria-label="Preview"
          >
            <svg
              className="w-6 h-6 text-gray-900 ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 text-base">
            {template.name}
          </h3>
          {template.rating && (
            <span className="flex items-center gap-0.5 text-sm text-amber-600 dark:text-amber-400 shrink-0">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {template.rating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
          {template.description}
        </p>

        {/* Category & Style */}
        <div className="flex items-center gap-2 mb-3 text-xs">
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
            {template.category}
          </span>
          <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
            {styleLabels[template.style] || template.style}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {template.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded"
            >
              #{tag}
            </span>
          ))}
          {template.tags.length > 4 && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
              +{template.tags.length - 4}
            </span>
          )}
        </div>

        {/* Footer stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              {template.usageCount.toLocaleString()}
            </span>
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
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {template.creditsCost} kredit
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
