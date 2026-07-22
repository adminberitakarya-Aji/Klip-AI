"use client";

import { useEffect } from "react";
import { Button } from "@klipai/ui/components/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error);
    console.error("Critical application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          {/* Error Icon */}
          <div className="mb-6">
            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
          </div>

          {/* Error Message */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-white">
              Aplikasi Bermasalah
            </h1>
            <p className="text-neutral-400">
              Maaf, terjadi kesalahan kritis. Silakan refresh halaman atau
              kembali ke halaman utama.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => reset()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
            <a href="/">
              <Button
                variant="outline"
                className="border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
              >
                <Home className="h-4 w-4 mr-2" />
                Halaman Utama
              </Button>
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
