"use client";

import { useEffect, useState } from "react";
import { Coins, Loader2, RefreshCw } from "lucide-react";
import { Card } from "@klipai/ui/components/card";
import { Button } from "@klipai/ui/components/button";
import { cn } from "@klipai/ui/lib/utils";

interface CreditBalanceData {
  credits: number;
  hasReceivedFreeCredits: boolean;
}

export function CreditBalance() {
  const [balance, setBalance] = useState<CreditBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = async () => {
    try {
      const response = await fetch("/api/credits/balance");
      if (!response.ok) throw new Error("Failed to fetch balance");
      const data = await response.json();
      if (data.success) {
        setBalance(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBalance();
  };

  if (loading) {
    return (
      <Card className="p-4 bg-neutral-900/50 border-neutral-800">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
        </div>
      </Card>
    );
  }

  if (error || !balance) {
    return (
      <Card className="p-4 bg-neutral-900/50 border-neutral-800">
        <div className="text-center text-red-400 text-sm">
          Gagal memuat saldo
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30",
        "border border-purple-500/30",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Coins className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-neutral-400">Saldo Credits</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white">
                {balance.credits.toLocaleString("id-ID")}
              </span>
              <span className="text-sm text-neutral-400">credits</span>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-neutral-400 hover:text-white"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </div>

      {!balance.hasReceivedFreeCredits && balance.credits === 0 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-purple-400">
            Anda belum klaim credits gratis! Segera klaim sebelum kadaluarsa.
          </p>
        </div>
      )}
    </Card>
  );
}

export default CreditBalance;
