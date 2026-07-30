"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Video,
  Image as ImageIcon,
  Wand2,
  Clock,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Badge } from "@klipai/ui/components/badge";
import { Skeleton } from "@klipai/ui/components/skeleton";
import { cn } from "@klipai/ui/lib/utils";

interface Generation {
  id: string;
  type: string;
  status: string;
  prompt?: string;
  resultUrl?: string;
  thumbnailUrl?: string;
  creditsCost: number;
  createdAt: string;
  completedAt?: string;
}

interface GenerationsResponse {
  data: Generation[];
  pagination: {
    page: number;
    totalPages: number;
    total: number;
  };
}

const typeIcons: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  "text-to-video": Video,
  "image-to-video": ImageIcon,
  "video-to-video": Wand2,
  text_to_video: Video,
  image_to_video: ImageIcon,
  video_to_video: Wand2,
};

const typeLabels: Record<string, string> = {
  "text-to-video": "Text → Video",
  "image-to-video": "Image → Video",
  "video-to-video": "Video → Video",
  text_to_video: "Text → Video",
  image_to_video: "Image → Video",
  video_to_video: "Video → Video",
};

const statusConfig: Record<
  string,
  { label: string; dot: string; badge: string }
> = {
  pending: {
    label: "Menunggu",
    dot: "bg-yellow-400",
    badge:
      "bg-yellow-500/10 text-yellow-400 border-yellow-500/25 hover:bg-yellow-500/10",
  },
  queued: {
    label: "Antrian",
    dot: "bg-yellow-400",
    badge:
      "bg-yellow-500/10 text-yellow-400 border-yellow-500/25 hover:bg-yellow-500/10",
  },
  processing: {
    label: "Proses",
    dot: "bg-blue-400 animate-pulse",
    badge:
      "bg-blue-500/10 text-blue-400 border-blue-500/25 hover:bg-blue-500/10",
  },
  completed: {
    label: "Selesai",
    dot: "bg-green-400",
    badge:
      "bg-green-500/10 text-green-400 border-green-500/25 hover:bg-green-500/10",
  },
  failed: {
    label: "Gagal",
    dot: "bg-red-400",
    badge: "bg-red-500/10 text-red-400 border-red-500/25 hover:bg-red-500/10",
  },
};

function formatTimeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  if (h < 24) return `${h} jam lalu`;
  return `${d} hari lalu`;
}

export function RecentGenerations() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    async function fetchGenerations() {
      setLoading(true);
      try {
        const res = await fetch(`/api/generations?page=${page}&limit=6`);
        if (!res.ok) throw new Error("Failed");
        const result: GenerationsResponse = await res.json();
        if (result.data) {
          setGenerations((prev) =>
            page === 1 ? result.data : [...prev, ...result.data],
          );
          setHasMore(result.pagination.page < result.pagination.totalPages);
        }
      } catch {
        setError("Gagal memuat generasi");
      } finally {
        setLoading(false);
      }
    }
    fetchGenerations();
  }, [page]);

  /* ── loading skeleton ── */
  if (loading && page === 1) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-2xl"
              style={{
                background: "oklch(1 0 0 / 0.03)",
                border: "1px solid oklch(1 0 0 / 0.06)",
              }}
            >
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── empty state ── */
  if (generations.length === 0 && !loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Generasi Terbaru</h3>
        </div>
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: "oklch(1 0 0 / 0.02)",
            border: "1px dashed oklch(1 0 0 / 0.1)",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: "oklch(0.82 0.15 205 / 0.08)",
              border: "1px solid oklch(0.82 0.15 205 / 0.2)",
            }}
          >
            <Sparkles
              className="w-8 h-8"
              style={{ color: "oklch(0.82 0.15 205)" }}
            />
          </div>
          <h4 className="text-white font-semibold mb-2">Belum ada generasi</h4>
          <p className="text-sm mb-6" style={{ color: "oklch(1 0 0 / 0.4)" }}>
            Mulai buat video AI pertamamu sekarang
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.15 205) 0%, oklch(0.7 0.18 230) 100%)",
              color: "oklch(0.05 0 0)",
              boxShadow: "0 4px 20px -4px oklch(0.82 0.15 205 / 0.4)",
            }}
          >
            <Wand2 className="w-4 h-4" />
            Mulai Generate
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Generasi Terbaru</h3>
        <Link
          href="/credits/history"
          className="text-xs font-medium transition-colors"
          style={{ color: "oklch(0.82 0.15 205)" }}
        >
          Lihat semua →
        </Link>
      </div>

      {/* List */}
      <div className="space-y-2">
        {generations.map((gen) => {
          const Icon = typeIcons[gen.type] || Video;
          const sc = statusConfig[gen.status] || statusConfig.pending;
          const typeLabel = typeLabels[gen.type] || gen.type;

          return (
            <div
              key={gen.id}
              className="group flex items-center gap-4 p-4 rounded-2xl transition-all duration-200"
              style={{
                background: "oklch(1 0 0 / 0.03)",
                border: "1px solid oklch(1 0 0 / 0.06)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "oklch(1 0 0 / 0.05)";
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "oklch(1 0 0 / 0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "oklch(1 0 0 / 0.03)";
                (e.currentTarget as HTMLDivElement).style.borderColor =
                  "oklch(1 0 0 / 0.06)";
              }}
            >
              {/* Icon/Thumbnail */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "oklch(0.82 0.15 205 / 0.1)",
                  border: "1px solid oklch(0.82 0.15 205 / 0.15)",
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: "oklch(0.82 0.15 205)" }}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {gen.prompt || typeLabel}
                </p>
                <div
                  className="flex items-center gap-2 mt-0.5 text-xs"
                  style={{ color: "oklch(1 0 0 / 0.35)" }}
                >
                  <Clock className="w-3 h-3" />
                  <span>{formatTimeAgo(gen.createdAt)}</span>
                  <span>·</span>
                  <span className="font-mono">-{gen.creditsCost} cr</span>
                </div>
              </div>

              {/* Status badge */}
              <Badge
                variant="outline"
                className={cn("text-xs font-medium capitalize", sc.badge)}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full mr-1.5 inline-block",
                    sc.dot,
                  )}
                />
                {sc.label}
              </Badge>

              {/* External link */}
              {gen.resultUrl && gen.status === "completed" && (
                <a
                  href={gen.resultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "oklch(1 0 0 / 0.4)" }}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={loading}
            className="px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{
              background: "oklch(1 0 0 / 0.05)",
              border: "1px solid oklch(1 0 0 / 0.1)",
              color: "oklch(1 0 0 / 0.6)",
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat...
              </span>
            ) : (
              "Muat lebih banyak"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default RecentGenerations;
