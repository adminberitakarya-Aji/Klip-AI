"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ShotResult {
  shotIndex: number;
  success: boolean;
  generationId?: string;
  url?: string;
  error?: string;
}

interface JobData {
  id: string;
  userId: string;
  templateId: string;
  brandKitId: string | null;
  status:
    | "QUEUED"
    | "PREPARING"
    | "GENERATING_SHOTS"
    | "STITCHING"
    | "COMPLETED"
    | "FAILED"
    | "PARTIAL_SUCCESS";
  progress: number;
  currentShot: number;
  totalShots: number;
  customizations: Record<string, unknown> | null;
  shotResults: ShotResult[] | null;
  stitchedVideoUrl: string | null;
  error: string | null;
  creditsUsed: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  template: {
    id: string;
    name: string;
    slug: string;
    shots: Array<{
      id: string;
      index: number;
      timeRange: string;
      duration: number;
      description: string;
      prompt: string;
    }>;
  };
}

const statusLabels: Record<JobData["status"], string> = {
  QUEUED: "Menunggu antrian",
  PREPARING: "Menyiapkan",
  GENERATING_SHOTS: "Membuat shot",
  STITCHING: "Menggabungkan video",
  COMPLETED: "Selesai",
  FAILED: "Gagal",
  PARTIAL_SUCCESS: "Sebagian berhasil",
};

const statusColors: Record<JobData["status"], string> = {
  QUEUED: "bg-gray-500",
  PREPARING: "bg-blue-500",
  GENERATING_SHOTS: "bg-primary-500",
  STITCHING: "bg-purple-500",
  COMPLETED: "bg-green-500",
  FAILED: "bg-red-500",
  PARTIAL_SUCCESS: "bg-amber-500",
};

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full" />
    </div>
  );
}

function ErrorScreen({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <svg
          className="w-16 h-16 mx-auto text-red-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Gagal Memuat Status
        </h2>
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
      </div>
    </div>
  );
}

function ResultSection({
  job,
  slug,
  template,
}: {
  job: JobData;
  slug: string;
  template: JobData["template"];
}) {
  const successfulShots = job.shotResults?.filter((s) => s.success).length || 0;
  const totalShots = job.totalShots;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              job.status === "COMPLETED"
                ? "bg-green-100 dark:bg-green-900/30"
                : "bg-amber-100 dark:bg-amber-900/30",
            )}
          >
            {job.status === "COMPLETED" ? (
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-amber-600 dark:text-amber-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {job.status === "COMPLETED"
                ? "Video Selesai Dibuat!"
                : "Video Sebagian Berhasil"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {job.status === "COMPLETED"
                ? `Semua ${totalShots} shot berhasil digabungkan`
                : `${successfulShots} dari ${totalShots} shot berhasil digabungkan`}
            </p>
          </div>
        </div>
      </div>

      {job.stitchedVideoUrl && (
        <div className="p-6">
          <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video mb-6">
            <video
              src={job.stitchedVideoUrl}
              controls
              className="w-full h-full object-cover"
              playsInline
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href={job.stitchedVideoUrl}
              download={`${template.slug}-generated.mp4`}
              className="flex-1 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 text-center transition-colors"
            >
              <svg
                className="w-5 h-5 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Unduh Video
            </a>
            <button className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <svg
                className="w-5 h-5 inline mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Bagikan
            </button>
          </div>

          {job.status === "PARTIAL_SUCCESS" && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                Catatan:
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Beberapa shot gagal dibuat. Video hasil gabungan hanya berisi
                shot yang berhasil. Anda dapat mencoba generate ulang atau
                mengedit prompt shot yang gagal di halaman kustomisasi.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FailedSection({ job, slug }: { job: JobData; slug: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600 dark:text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Generate Gagal
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {job.error ||
                "Terjadi kesalahan saat membuat video. Silakan coba lagi."}
            </p>
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="flex gap-4">
          <Link
            href={`/templates/${slug}/customize`}
            className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Kembali ke Kustomisasi
          </Link>
          <Link
            href="/templates"
            className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Kembali ke Template
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProgressSection({ job }: { job: JobData }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full" />
        <div
          className={cn(
            "absolute inset-0 border-4 border-t-primary-500 rounded-full animate-spin",
            statusColors[job.status],
          )}
        />
        <div className="absolute inset-4 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
          <span className="text-3xl font-bold text-gray-900 dark:text-white">
            {job.progress}%
          </span>
        </div>
      </div>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
        {statusLabels[job.status]}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {job.status === "GENERATING_SHOTS"
          ? `Sedang membuat shot ${job.currentShot + 1} dari ${job.totalShots}...`
          : job.status === "STITCHING"
            ? "Menggabungkan semua shot menjadi video final..."
            : "Memproses permintaan Anda, harap tunggu sebentar."}
      </p>
      <div className="w-full max-w-md mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500",
            statusColors[job.status],
          )}
          style={{ width: `${job.progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
        Halaman ini akan otomatis refresh saat selesai. Jangan tutup tab ini.
      </p>
    </div>
  );
}

function TemplateGenerateContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const jobId = searchParams.get("jobId");

  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!jobId) {
      setError("Job ID tidak ditemukan");
      setLoading(false);
      return;
    }

    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/templates/generations/${jobId}`);
        const data = await res.json();
        if (data.success) {
          setJob(data.data);
        } else {
          setError(data.error?.message || "Gagal memuat status");
        }
      } catch (_err) {
        setError("Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();

    // Poll for updates
    const interval = setInterval(() => {
      if (!polling) return;
      fetchJob();
    }, 3000);

    return () => clearInterval(interval);
  }, [jobId, polling]);

  // Stop polling when job is complete or failed
  useEffect(() => {
    if (
      job &&
      ["COMPLETED", "FAILED", "PARTIAL_SUCCESS"].includes(job.status)
    ) {
      setPolling(false);
    }
  }, [job]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (error || !job) {
    return <ErrorScreen error={error || "Unknown error"} />;
  }

  const template = job.template;
  const successfulShots = job.shotResults?.filter((s) => s.success).length || 0;
  const totalShots = job.totalShots;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link
              href="/templates"
              className="hover:text-primary-600 dark:hover:text-primary-400"
            >
              Template
            </Link>
            <span>/</span>
            <Link
              href={`/templates/${slug}`}
              className="hover:text-primary-600 dark:hover:text-primary-400"
            >
              {template.name}
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">Generate</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Generate Video
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Memproses {template.name} - {totalShots} shot
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      statusColors[job.status],
                    )}
                  />
                  <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                    {statusLabels[job.status]}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Progress: {job.progress}%
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-gray-900 dark:text-white">
                    {successfulShots}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Berhasil
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 dark:text-white">
                    {totalShots}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Total Shot
                  </div>
                </div>
                {job.status === "COMPLETED" && job.creditsUsed > 0 && (
                  <div className="text-center">
                    <div className="font-bold text-primary-600 dark:text-primary-400">
                      {job.creditsUsed}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      Kredit Terpakai
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  statusColors[job.status],
                )}
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Shots Progress Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Progress Shot
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Setiap shot dibuat secara paralel (batch 3-4) untuk kecepatan
              maksimal
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {template.shots.map((shot) => {
                const shotResult = job.shotResults?.find(
                  (r) => r.shotIndex === shot.index,
                );
                const isCurrent =
                  job.currentShot === shot.index &&
                  job.status === "GENERATING_SHOTS";
                const isCompleted = shotResult?.success;
                const isFailed = shotResult && !shotResult.success;
                const isPending = !shotResult;

                return (
                  <div
                    key={shot.id}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all duration-300",
                      isCurrent
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 animate-pulse"
                        : isCompleted
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                          : isFailed
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50",
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                          isCurrent
                            ? "bg-primary-500 text-white animate-pulse"
                            : isCompleted
                              ? "bg-green-500 text-white"
                              : isFailed
                                ? "bg-red-500 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400",
                        )}
                      >
                        {isCurrent ? (
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
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                        ) : isCompleted ? (
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
                        ) : isFailed ? (
                          <svg
                            className="w-5 h-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          shot.index + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          Shot {shot.index + 1}: {shot.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
                          {shot.timeRange} ({shot.duration}s)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
                          Sedang diproses...
                        </span>
                      )}
                      {isCompleted && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                          ✓ Selesai
                        </span>
                      )}
                      {isFailed && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                          ✗ Gagal
                        </span>
                      )}
                      {isPending && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                          Menunggu
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Result/Status Section */}
        {job.status === "COMPLETED" || job.status === "PARTIAL_SUCCESS" ? (
          <ResultSection job={job} slug={slug} template={template} />
        ) : job.status === "FAILED" ? (
          <FailedSection job={job} slug={slug} />
        ) : (
          <ProgressSection job={job} />
        )}
      </div>
    </div>
  );
}

export default function TemplateGeneratePage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TemplateGenerateContent />
    </Suspense>
  );
}
