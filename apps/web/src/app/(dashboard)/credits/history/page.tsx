"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  Gift,
  RefreshCw,
} from "lucide-react";
import { cn } from "@klipai/ui/lib/utils";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  createdAt: string;
  metadata: unknown;
}

interface TransactionResponse {
  success: boolean;
  data: {
    transactions: Transaction[];
    total: number;
  };
}

export default function CreditsHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/credits/history?page=${page}&limit=${limit}`,
      );
      if (!response.ok) throw new Error("Gagal memuat riwayat");
      const data: TransactionResponse = await response.json();
      if (data.success) {
        setTransactions(data.data.transactions);
        setTotal(data.data.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchHistory();
  }, [page, fetchHistory]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
      case "TOPUP":
        return {
          icon: ArrowDownCircle,
          color: "oklch(0.72 0.2 150)",
          bg: "oklch(0.72 0.2 150 / 0.15)",
        };
      case "USAGE":
        return {
          icon: ArrowUpCircle,
          color: "oklch(0.65 0.22 27)",
          bg: "oklch(0.65 0.22 27 / 0.15)",
        };
      case "REFUND":
        return {
          icon: RefreshCw,
          color: "oklch(0.78 0.18 55)",
          bg: "oklch(0.78 0.18 55 / 0.15)",
        };
      case "FREE_CREDITS":
        return {
          icon: Gift,
          color: "oklch(0.82 0.15 205)",
          bg: "oklch(0.82 0.15 205 / 0.15)",
        };
      default:
        return {
          icon: Coins,
          color: "oklch(0.82 0.15 205)",
          bg: "oklch(0.82 0.15 205 / 0.15)",
        };
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "oklch(0.04 0 0)" }}
    >
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Riwayat Transaksi
            </h1>
            <p className="mt-1 text-sm text-[oklch(1_0_0/0.4)]">
              {total} transaksi tercatat di akun Anda
            </p>
          </div>
          <button
            onClick={fetchHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: "oklch(1 0 0 / 0.05)",
              border: "1px solid oklch(1 0 0 / 0.1)",
              color: "white",
            }}
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", loading && "animate-spin")}
            />
            Refresh
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl animate-pulse"
                style={{ background: "oklch(1 0 0 / 0.03)" }}
              />
            ))}
          </div>
        ) : error ? (
          <div
            className="rounded-2xl p-6 text-sm text-center"
            style={{
              background: "oklch(0.65 0.22 27 / 0.1)",
              border: "1px solid oklch(0.65 0.22 27 / 0.25)",
              color: "oklch(0.75 0.2 27)",
            }}
          >
            {error}
          </div>
        ) : transactions.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center"
            style={{
              background: "oklch(1 0 0 / 0.02)",
              border: "1px dashed oklch(1 0 0 / 0.1)",
            }}
          >
            <Coins className="w-10 h-10 mx-auto mb-3 text-[oklch(1_0_0/0.3)]" />
            <h3 className="text-white font-semibold mb-1">
              Belum Ada Transaksi
            </h3>
            <p className="text-xs text-[oklch(1_0_0/0.4)] mb-4">
              Riwayat kredit Anda akan muncul di sini setelah ada transaksi.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => {
              const { icon: Icon, color, bg } = getTransactionIcon(tx.type);
              const isPositive = tx.amount > 0;

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 p-4 rounded-2xl transition-all"
                  style={{
                    background: "oklch(1 0 0 / 0.03)",
                    border: "1px solid oklch(1 0 0 / 0.06)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: bg }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {tx.description || getTransactionLabel(tx.type)}
                    </p>
                    <p className="text-xs text-[oklch(1_0_0/0.35)] mt-0.5">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className="text-base font-bold tabular-nums"
                      style={{
                        color: isPositive
                          ? "oklch(0.72 0.2 150)"
                          : "oklch(0.65 0.22 27)",
                      }}
                    >
                      {isPositive ? "+" : ""}
                      {tx.amount.toLocaleString("id-ID")}
                    </span>
                    <p className="text-[11px] text-[oklch(1_0_0/0.3)]">
                      credits
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {total > limit && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[oklch(1_0_0/0.06)]">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg bg-[oklch(1_0_0/0.05)] text-white/80 hover:bg-[oklch(1_0_0/0.1)] disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="text-xs text-white/50">
              Halaman {page} dari {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(total / limit)}
              className="px-3 py-1.5 text-xs rounded-lg bg-[oklch(1_0_0/0.05)] text-white/80 hover:bg-[oklch(1_0_0/0.1)] disabled:opacity-40"
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getTransactionLabel(type: string): string {
  switch (type) {
    case "PURCHASE":
      return "Pembelian Credits";
    case "TOPUP":
      return "Top Up Credits";
    case "USAGE":
      return "Penggunaan Credits";
    case "REFUND":
      return "Refund Credits";
    case "FREE_CREDITS":
      return "Credits Gratis";
    default:
      return "Transaksi";
  }
}
