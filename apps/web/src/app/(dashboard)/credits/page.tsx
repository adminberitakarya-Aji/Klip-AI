"use client";

import { Suspense } from "react";
import { Zap, Shield, Coins } from "lucide-react";
import { CreditPurchase } from "@/components/credits";

export default function CreditsPage() {
  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "oklch(0.04 0 0)" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 10%, oklch(0.82 0.15 205 / 0.15) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3"
            style={{
              background: "oklch(0.82 0.15 205 / 0.1)",
              border: "1px solid oklch(0.82 0.15 205 / 0.2)",
              color: "oklch(0.82 0.15 205)",
            }}
          >
            <Coins className="w-3.5 h-3.5" />
            Top-up Saldo Studio
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Beli Credits Studio
          </h1>
          <p className="mt-1 text-sm text-[oklch(1_0_0/0.4)]">
            Credits tidak pernah kadaluarsa. Pilih paket yang sesuai kebutuhan
            kreasi Anda.
          </p>
        </div>

        {/* Features banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: Zap,
              title: "Proses Instan",
              desc: "Credits langsung bertambah setelah pembayaran berhasil",
              color: "oklch(0.82 0.15 205)",
            },
            {
              icon: Shield,
              title: "Aman & Terpercaya",
              desc: "Pembayaran diproses oleh Midtrans dengan enkripsi penuh",
              color: "oklch(0.72 0.2 150)",
            },
            {
              icon: Coins,
              title: "Tanpa Kadaluarsa",
              desc: "Credits Anda tetap berlaku selamanya tanpa batas waktu",
              color: "oklch(0.78 0.18 55)",
            },
          ].map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{
                background: "oklch(1 0 0 / 0.03)",
                border: "1px solid oklch(1 0 0 / 0.07)",
              }}
            >
              <div
                className="p-2 rounded-xl shrink-0"
                style={{ background: "oklch(1 0 0 / 0.05)" }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{title}</h3>
                <p className="text-xs mt-0.5 text-[oklch(1_0_0/0.4)]">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Purchase component */}
        <Suspense
          fallback={
            <div className="text-center py-12 text-sm text-[oklch(1_0_0/0.4)]">
              Memuat pilihan paket credits...
            </div>
          }
        >
          <CreditPurchase />
        </Suspense>
      </div>
    </div>
  );
}
