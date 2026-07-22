"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  Coins,
  Wand2,
  Video,
  ArrowRight,
  Zap,
  Gift,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Card } from "@klipai/ui/components/card";
import { Button } from "@klipai/ui/components/button";
import { Skeleton } from "@klipai/ui/components/skeleton";
import { UserBalance } from "@/components/dashboard/UserBalance";
import { RecentGenerations } from "@/components/dashboard/RecentGenerations";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-neutral-950">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userName = session.user?.name?.split(" ")[0] || "User";

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50">
        <div className="container mx-auto px-4 py-6 max-w-6xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Selamat datang, {userName}! 👋
              </h1>
              <p className="text-neutral-400 mt-1">
                Kelola credits dan mulai buat video AI kamu
              </p>
            </div>
            {session.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-12 h-12 rounded-full border-2 border-purple-500"
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Balance Card */}
        <div className="mb-6">
          <UserBalance />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <QuickActionCard
            icon={Wand2}
            title="Generate Video"
            description="Buat video AI baru dengan prompt teks atau gambar"
            href="/generate"
            gradient="from-purple-600 to-pink-600"
          />
          <QuickActionCard
            icon={Video}
            title="Browse Templates"
            description="Pilih dari template video siap pakai"
            href="/templates"
            gradient="from-cyan-600 to-blue-600"
          />
          <QuickActionCard
            icon={CreditCard}
            title="Beli Credits"
            description="Tambah credits untuk generation lebih banyak"
            href="/credits"
            gradient="from-amber-600 to-orange-600"
          />
        </div>

        {/* Features Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Gift className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm">
                  10 Credits Gratis!
                </h3>
                <p className="text-xs text-neutral-400">
                  Untuk pengguna baru. Tanpa kartu kredit.
                </p>
              </div>
              <Link href="/credits?package=free">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                >
                  Klaim
                </Button>
              </Link>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Zap className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm">
                  Generation Baru
                </h3>
                <p className="text-xs text-neutral-400">
                  Text-to-Video, Image-to-Video, dan Video-to-Video
                </p>
              </div>
              <Link href="/generate">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  Coba Sekarang
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Generations */}
        <div>
          <RecentGenerations />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  title,
  description,
  href,
  gradient,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  href: string;
  gradient: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-5 h-full bg-neutral-900/50 border-neutral-800 hover:border-neutral-700 transition-all duration-300 hover:scale-[1.02] cursor-pointer group">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${gradient} group-hover:scale-110 transition-transform`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{title}</h3>
              <ArrowRight className="h-4 w-4 text-neutral-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-neutral-400 mt-1">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
