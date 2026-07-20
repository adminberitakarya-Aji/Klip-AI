"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, Coins, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@klipai/ui/components/button";
import { Card } from "@klipai/ui/components/card";
import { cn } from "@klipai/ui/lib/utils";

interface CreditPackage {
  id: string;
  name: string;
  slug: string;
  credits: number;
  priceIdr: number;
  description: string | null;
  features: string[] | null;
  isActive: boolean;
  isPopular: boolean;
}

export function CreditPackages() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPackages() {
      try {
        const response = await fetch("/api/credits/packages");
        if (!response.ok) throw new Error("Failed to fetch packages");
        const data = await response.json();
        if (data.success) {
          setPackages(data.data.filter((pkg: CreditPackage) => pkg.isActive));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }
    fetchPackages();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-400">
        Failed to load credit packages
      </div>
    );
  }

  if (packages.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {packages.map((pkg, index) => (
        <motion.div
          key={pkg.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <CreditPackageCard
            pkg={pkg}
            formatPrice={formatPrice}
            onSelect={() => {
              // Handle purchase - redirect to purchase flow
              window.location.href = `/credits/purchase?package=${pkg.slug}`;
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}

interface CreditPackageCardProps {
  pkg: CreditPackage;
  formatPrice: (price: number) => string;
  onSelect: () => void;
}

function CreditPackageCard({
  pkg,
  formatPrice,
  onSelect,
}: CreditPackageCardProps) {
  const features = pkg.features || [];
  const perCreditPrice =
    pkg.priceIdr > 0 ? Math.ceil(pkg.priceIdr / pkg.credits) : 0;

  return (
    <Card
      className={cn(
        "relative overflow-hidden h-full flex flex-col",
        "bg-gradient-to-br",
        pkg.isPopular
          ? "from-purple-600/20 via-purple-900/10 to-pink-600/20 border-2 border-purple-500/40"
          : "from-neutral-800/40 to-neutral-900/40 border border-neutral-700/50",
        "transition-all duration-300 hover:scale-[1.02]",
      )}
    >
      {pkg.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="inline-flex items-center gap-1.5 px-4 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold uppercase tracking-wider rounded-full shadow-lg shadow-purple-600/40">
            <Sparkles className="h-3 w-3" />
            Popular
          </span>
        </div>
      )}

      <div className="p-6 flex flex-col h-full">
        {/* Package name & price */}
        <div className="mb-4">
          <h3 className="text-lg font-bold text-white mb-1">{pkg.name}</h3>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">
              {formatPrice(pkg.priceIdr)}
            </span>
          </div>
          {perCreditPrice > 0 && (
            <p className="text-sm text-neutral-400 mt-1">
              {perCreditPrice.toLocaleString("id-ID")}/credit
            </p>
          )}
        </div>

        {/* Credits count */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/10">
          <Coins className="h-5 w-5 text-purple-400" />
          <span className="text-2xl font-bold text-white">
            {pkg.credits.toLocaleString()}
          </span>
          <span className="text-neutral-400">credits</span>
        </div>

        {/* Description */}
        {pkg.description && (
          <p className="text-sm text-neutral-400 mb-4 flex-1">
            {pkg.description}
          </p>
        )}

        {/* Features */}
        {features.length > 0 && (
          <ul className="space-y-2 mb-6 flex-1">
            {features.slice(0, 4).map((feature, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-neutral-300"
              >
                <Check className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* CTA */}
        <Button
          onClick={onSelect}
          className={cn(
            "w-full gap-2 mt-auto",
            pkg.isPopular
              ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/30"
              : "bg-white/10 hover:bg-white/20 border border-white/10",
          )}
        >
          Pilih Paket
        </Button>
      </div>
    </Card>
  );
}

export default CreditPackages;
