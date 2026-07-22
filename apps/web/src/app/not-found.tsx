"use client";

import Link from "next/link";
import { Button } from "@klipai/ui/components/button";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        {/* 404 Display */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
            404
          </h1>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">
            Halaman Tidak Ditemukan
          </h2>
          <p className="text-neutral-400">
            Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
          </p>
        </div>

        {/* Suggestions */}
        <div className="mt-8 p-6 bg-neutral-900/50 border border-neutral-800 rounded-xl">
          <div className="flex items-center gap-2 text-neutral-400 mb-4">
            <Search className="h-4 w-4" />
            <span className="text-sm font-medium">Yang bisa Anda lakukan:</span>
          </div>
          <ul className="text-sm text-neutral-400 space-y-2 text-left">
            <li>• Periksa kembali URL yang Anda ketik</li>
            <li>• Kembali ke halaman sebelumnya</li>
            <li>• Buka halaman utama website</li>
            <li>• Hubungi tim support jika masalah berlanjut</li>
          </ul>
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
          <Link href="/">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
              <Home className="h-4 w-4 mr-2" />
              Halaman Utama
            </Button>
          </Link>
        </div>

        {/* Decorative Element */}
        <div className="mt-12 opacity-20">
          <svg
            className="w-32 h-32 mx-auto"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
            <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" />
            <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
