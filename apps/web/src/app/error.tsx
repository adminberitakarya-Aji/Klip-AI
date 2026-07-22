"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@klipai/ui/components/button";
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Terjadi Kesalahan</h2>
          <p className="text-neutral-400">
            Maaf, terjadi kesalahan yang tidak terduga. Tim kami sudah notified
            dan akan memperbaiki masalah ini.
          </p>
          {process.env.NODE_ENV === "development" && (
            <details className="mt-4 p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl text-left">
              <summary className="text-sm text-neutral-500 cursor-pointer mb-2">
                Error Details (Development Only)
              </summary>
              <pre className="text-xs text-red-400 overflow-auto max-h-32">
                {error.message}
                {"\n\n"}
                {error.stack}
              </pre>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <Button
            onClick={() => reset()}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
            >
              <Home className="h-4 w-4 mr-2" />
              Halaman Utama
            </Button>
          </Link>
        </div>

        {/* Support Link */}
        <div className="mt-8 text-sm text-neutral-500">
          Jika masalah terus berlanjut, hubungi{" "}
          <a
            href="mailto:support@klip-ai.com"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            support@klip-ai.com
          </a>
        </div>
      </div>
    </div>
  );
}
