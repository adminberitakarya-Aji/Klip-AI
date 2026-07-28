"use client";

import { useEffect, useState } from "react";
import { Coins, TrendingUp } from "lucide-react";
import { Card } from "@klipai/ui/components/card";
import { Button } from "@klipai/ui/components/button";
import { ErrorState } from "@klipai/ui/components/state-components";
import { Skeleton } from "@klipai/ui/components/skeleton";

interface UserBalanceData {
  balance: number;
  freeCreditsUsed: number;
  totalCreditsEarned: number;
}

export function UserBalance() {
  const [data, setData] = useState<UserBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const response = await fetch("/api/credits/balance");
        if (!response.ok) throw new Error("Failed to fetch balance");
        const result = await response.json();
        if (result.success) {
          setData({
            balance: result.data.balance,
            freeCreditsUsed: result.data.freeCreditsUsed || 0,
            totalCreditsEarned: result.data.totalCreditsEarned || 0,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchBalance();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    fetch("/api/credits/balance")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData({
            balance: result.data.balance,
            freeCreditsUsed: result.data.freeCreditsUsed || 0,
            totalCreditsEarned: result.data.totalCreditsEarned || 0,
          });
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Coins className="h-8 w-8 text-purple-400" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-10 w-28" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-neutral-900/50 border-neutral-800">
        <ErrorState
          title="Gagal Memuat Saldo"
          message={error}
          onRetry={handleRefresh}
        />
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Coins className="h-8 w-8 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-neutral-400">Saldo Credits</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {data?.balance?.toLocaleString("id-ID") || 0}
              </span>
              <span className="text-neutral-400 text-sm">credits</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-neutral-500">
                Total earned:{" "}
                {(data?.totalCreditsEarned || 0).toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => (window.location.href = "/generate")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
          >
            Generate Video
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/credits")}
          >
            Beli Credits
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default UserBalance;
