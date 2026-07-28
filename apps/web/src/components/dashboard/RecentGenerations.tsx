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
} from "lucide-react";
import { Card } from "@klipai/ui/components/card";
import { Button } from "@klipai/ui/components/button";
import { Badge } from "@klipai/ui/components/badge";
import { ErrorState } from "@klipai/ui/components/state-components";
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

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "text-to-video": Video,
  "image-to-video": ImageIcon,
  "video-to-video": Wand2,
  text_to_video: Video,
  image_to_video: ImageIcon,
  video_to_video: Wand2,
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  failed: "bg-red-500/20 text-red-400 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Selesai",
  failed: "Gagal",
};

function formatTimeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  return `${days} hari lalu`;
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
        const response = await fetch(`/api/generations?page=${page}&limit=5`);
        if (!response.ok) throw new Error("Failed to fetch generations");
        const result: GenerationsResponse = await response.json();
        if (result.data) {
          if (page === 1) {
            setGenerations(result.data);
          } else {
            setGenerations((prev) => [...prev, ...result.data]);
          }
          setHasMore(result.pagination.page < result.pagination.totalPages);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchGenerations();
  }, [page]);

  const handleLoadMore = () => {
    setPage((prev) => prev + 1);
  };

  if (loading && page === 1) {
    return (
      <Card className="p-6 bg-neutral-900/50 border-neutral-800">
        <h3 className="text-lg font-semibold text-white mb-4">
          Generasi Terbaru
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (error && generations.length === 0) {
    return (
      <Card className="p-6 bg-neutral-900/50 border-neutral-800">
        <ErrorState
          title="Gagal Memuat Generasi"
          message={error}
          onRetry={() => setPage(1)}
        />
      </Card>
    );
  }

  if (generations.length === 0 && !loading) {
    return (
      <Card className="p-6 bg-neutral-900/50 border-neutral-800">
        <h3 className="text-lg font-semibold text-white mb-4">
          Generasi Terbaru
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="h-8 w-8 text-neutral-500" />
          </div>
          <h4 className="text-white font-medium mb-2">Belum Ada Generation</h4>
          <p className="text-neutral-400 text-sm mb-4">
            Mulai buat video AI pertamamu sekarang
          </p>
          <Button
            onClick={() => (window.location.href = "/generate")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Mulai Generate
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-neutral-900/50 border-neutral-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Generasi Terbaru</h3>
        <Link
          href="/dashboard/history"
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          Lihat Semua
        </Link>
      </div>

      <div className="space-y-3">
        {generations.map((gen) => {
          const Icon = typeIcons[gen.type] || Video;
          return (
            <div
              key={gen.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
            >
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Icon className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">
                  {gen.prompt || "Generation"}
                </p>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Clock className="h-3 w-3" />
                  <span>{formatTimeAgo(gen.createdAt)}</span>
                  <span>•</span>
                  <span>-{gen.creditsCost} credits</span>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "capitalize",
                  statusColors[gen.status] || statusColors.pending,
                )}
              >
                {statusLabels[gen.status] || gen.status}
              </Badge>
              {gen.resultUrl && gen.status === "completed" && (
                <Button size="sm" variant="ghost" asChild>
                  <a
                    href={gen.resultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Memuat...
              </>
            ) : (
              "Muat Lebih Banyak"
            )}
          </Button>
        </div>
      )}
    </Card>
  );
}

export default RecentGenerations;
