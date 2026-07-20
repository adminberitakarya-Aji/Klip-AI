"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  Gift,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Card } from "@klipai/ui/components/card";
import { Button } from "@klipai/ui/components/button";
import { cn } from "@klipai/ui/lib/utils";
import {
  ErrorState,
  TransactionListLoadingSkeleton,
} from "@klipai/ui/components/state-components";

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

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/credits/history?page=${page}&limit=${limit}`,
      );
      if (!response.ok) throw new Error("Failed to fetch history");
      const data: TransactionResponse = await response.json();
      if (data.success) {
        setTransactions(data.data.transactions);
        setTotal(data.data.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
      case "TOPUP":
        return {
          icon: ArrowDownCircle,
          color: "text-green-500",
          bg: "bg-green-500/20",
        };
      case "USAGE":
        return {
          icon: ArrowUpCircle,
          color: "text-red-500",
          bg: "bg-red-500/20",
        };
      case "REFUND":
        return {
          icon: RefreshCw,
          color: "text-yellow-500",
          bg: "bg-yellow-500/20",
        };
      case "FREE_CREDITS":
        return { icon: Gift, color: "text-purple-500", bg: "bg-purple-500/20" };
      default:
        return { icon: Coins, color: "text-blue-500", bg: "bg-blue-500/20" };
    }
  };

  const formatAmount = (amount: number) => {
    const isPositive = amount > 0;
    return (
      <span
        className={cn(
          "font-bold",
          isPositive ? "text-green-500" : "text-red-400",
        )}
      >
        {isPositive ? "+" : ""}
        {amount.toLocaleString("id-ID")}
      </span>
    );
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950">
        {/* Header skeleton */}
        <div className="border-b border-neutral-800 bg-neutral-900/50">
          <div className="container mx-auto px-4 py-6">
            <div className="w-48 h-8 bg-neutral-800 rounded animate-pulse mb-2" />
            <div className="w-24 h-4 bg-neutral-800 rounded animate-pulse" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <TransactionListLoadingSkeleton count={5} />
          </div>
        </div>
      </div>
    );
  }

  // Error state with retry
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950">
        <div className="border-b border-neutral-800 bg-neutral-900/50">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-2xl font-bold text-white">Riwayat Credits</h1>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <ErrorState
              title="Gagal Memuat Riwayat"
              message={error}
              onRetry={fetchHistory}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Riwayat Credits</h1>
              <p className="text-neutral-400 mt-1">{total} transaksi</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchHistory}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {transactions.length === 0 ? (
            <Card className="p-12 text-center bg-neutral-900/50 border-neutral-800">
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coins className="h-8 w-8 text-neutral-600" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Belum Ada Transaksi
              </h3>
              <p className="text-neutral-400 mb-6">
                Riwayat transaksi credit Anda akan aparecer di sini
              </p>
              <Button asChild>
                <a href="/credits">Beli Credits</a>
              </Button>
            </Card>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {transactions.map((tx, index) => {
                const { icon: Icon, color, bg } = getTransactionIcon(tx.type);
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-4 bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-lg", bg)}>
                          <Icon className={cn("h-5 w-5", color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {tx.description || getTransactionLabel(tx.type)}
                          </p>
                          <p className="text-sm text-neutral-500">
                            {formatDate(tx.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          {formatAmount(tx.amount)}
                          <p className="text-xs text-neutral-500">credits</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-neutral-400">
                Page {page} of {Math.ceil(total / limit)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= total}
              >
                Next
              </Button>
            </div>
          )}
        </div>
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
