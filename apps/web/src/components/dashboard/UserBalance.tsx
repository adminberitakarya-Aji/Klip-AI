"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Coins, TrendingUp, Plus, Zap } from "lucide-react";
import { Skeleton } from "@klipai/ui/components/skeleton";

interface BalanceData {
  balance: number;
  totalCreditsEarned: number;
  freeCreditsUsed: number;
}

export function UserBalance() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/credits/balance")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          setData({
            balance: json.data?.balance ?? json.balance ?? 0,
            totalCreditsEarned: json.data?.totalCreditsEarned ?? 0,
            freeCreditsUsed: json.data?.freeCreditsUsed ?? 0,
          });
        } else {
          setError("Gagal memuat saldo");
        }
      })
      .catch(() => setError("Gagal memuat saldo"))
      .finally(() => setLoading(false));
  }, []);

  /* ── max credits for progress bar reference ── */
  const MAX_DISPLAY = 500;
  const pct = data ? Math.min((data.balance / MAX_DISPLAY) * 100, 100) : 0;

  if (loading) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{
          background: "oklch(0.08 0.015 260 / 0.6)",
          border: "1px solid oklch(1 0 0 / 0.08)",
        }}
      >
        <Skeleton className="h-4 w-28 mb-3" />
        <Skeleton className="h-10 w-40 mb-4" />
        <Skeleton className="h-2 w-full rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-2xl p-6 text-sm"
        style={{
          background: "oklch(0.65 0.22 27 / 0.1)",
          border: "1px solid oklch(0.65 0.22 27 / 0.25)",
          color: "oklch(0.75 0.2 27)",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.1 0.03 260 / 0.8) 0%, oklch(0.08 0.02 230 / 0.8) 100%)",
        border: "1px solid oklch(0.82 0.15 205 / 0.2)",
        boxShadow: "0 0 60px -20px oklch(0.82 0.15 205 / 0.2)",
      }}
    >
      {/* Background orb */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, oklch(0.82 0.15 205 / 0.08) 0%, transparent 70%)",
          filter: "blur(30px)",
          transform: "translate(30%, -30%)",
        }}
      />

      <div className="relative z-10">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="p-1.5 rounded-lg"
                style={{ background: "oklch(0.82 0.15 205 / 0.15)" }}
              >
                <Coins
                  className="w-4 h-4"
                  style={{ color: "oklch(0.82 0.15 205)" }}
                />
              </div>
              <span
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "oklch(1 0 0 / 0.45)" }}
              >
                Saldo Credits
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold text-white tabular-nums">
                {(data?.balance ?? 0).toLocaleString("id-ID")}
              </span>
              <span
                className="text-sm"
                style={{ color: "oklch(1 0 0 / 0.35)" }}
              >
                credits
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-1">
            <Link
              href="/credits"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.82 0.15 205) 0%, oklch(0.7 0.18 230) 100%)",
                color: "oklch(0.05 0 0)",
                boxShadow: "0 4px 16px -4px oklch(0.82 0.15 205 / 0.4)",
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Beli Credits
            </Link>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: "oklch(1 0 0 / 0.08)" }}
          >
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${pct}%`,
                background:
                  "linear-gradient(90deg, oklch(0.82 0.15 205) 0%, oklch(0.7 0.18 230) 100%)",
                boxShadow: "0 0 8px oklch(0.82 0.15 205 / 0.6)",
              }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="rounded-xl p-3"
            style={{
              background: "oklch(1 0 0 / 0.04)",
              border: "1px solid oklch(1 0 0 / 0.06)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <TrendingUp
                className="w-3 h-3"
                style={{ color: "oklch(0.82 0.15 205)" }}
              />
              <span className="text-xs" style={{ color: "oklch(1 0 0 / 0.4)" }}>
                Total diperoleh
              </span>
            </div>
            <p className="text-sm font-semibold text-white">
              {(data?.totalCreditsEarned ?? 0).toLocaleString("id-ID")}
            </p>
          </div>
          <div
            className="rounded-xl p-3"
            style={{
              background: "oklch(1 0 0 / 0.04)",
              border: "1px solid oklch(1 0 0 / 0.06)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <Zap
                className="w-3 h-3"
                style={{ color: "oklch(0.78 0.18 55)" }}
              />
              <span className="text-xs" style={{ color: "oklch(1 0 0 / 0.4)" }}>
                Kredit gratis
              </span>
            </div>
            <p className="text-sm font-semibold text-white">
              {(data?.freeCreditsUsed ?? 0).toLocaleString("id-ID")} dipakai
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserBalance;
