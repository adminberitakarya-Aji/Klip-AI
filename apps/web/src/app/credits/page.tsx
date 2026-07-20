"use client";

import { motion } from "framer-motion";
import { Coins, Shield, Zap } from "lucide-react";
import { Card } from "@klipai/ui/components/card";
import { CreditPurchase } from "@/components/credits";

export default function CreditsPage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-white">Beli Credits</h1>
          <p className="text-neutral-400 mt-1">
            Credits tidak pernah kadaluarsa. Top-up kapan saja.
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Features banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <FeatureCard
              icon={Zap}
              title="Proses Instan"
              description="Credits langsung bertambah setelah pembayaran berhasil"
            />
            <FeatureCard
              icon={Shield}
              title="Aman & Terpercaya"
              description="Pembayaran diproses oleh Midtrans dengan enkripsi penuh"
            />
            <FeatureCard
              icon={Coins}
              title="Tidak Kadaluarsa"
              description="Credits Anda tetap berlaku selamanya"
            />
          </motion.div>

          {/* Purchase component */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CreditPurchase />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Card className="p-4 bg-neutral-900/50 border-neutral-800">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-500/20 rounded-lg">
          <Icon className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-sm">{title}</h3>
          <p className="text-xs text-neutral-400">{description}</p>
        </div>
      </div>
    </Card>
  );
}
