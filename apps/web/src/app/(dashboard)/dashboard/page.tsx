"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Wand2,
  Video,
  CreditCard,
  ArrowRight,
  Sparkles,
  Bell,
  LayoutGrid,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { UserBalance } from "@/components/dashboard/UserBalance";
import { RecentGenerations } from "@/components/dashboard/RecentGenerations";
import { Skeleton } from "@klipai/ui/components/skeleton";

/* ── Quick action cards ── */
const quickActions = [
  {
    icon: Wand2,
    label: "Generate Video",
    desc: "Text-to-Video, Image-to-Video, dan lebih banyak mode AI",
    href: "/generate",
    gradient: "from-[oklch(0.55_0.2_205)] to-[oklch(0.45_0.22_230)]",
    glowColor: "oklch(0.55 0.2 205 / 0.3)",
    badge: "Populer",
  },
  {
    icon: Video,
    label: "Browse Templates",
    desc: "100+ template video profesional siap pakai untuk semua niche",
    href: "/templates",
    gradient: "from-[oklch(0.55_0.18_270)] to-[oklch(0.45_0.2_290)]",
    glowColor: "oklch(0.55 0.18 270 / 0.3)",
    badge: null,
  },
  {
    icon: CreditCard,
    label: "Beli Credits",
    desc: "Top-up saldo untuk menghasilkan lebih banyak konten berkualitas",
    href: "/credits",
    gradient: "from-[oklch(0.65_0.18_55)] to-[oklch(0.55_0.2_35)]",
    glowColor: "oklch(0.65 0.18 55 / 0.3)",
    badge: null,
  },
];

/* ── Stats cards ── */
const statCards = [
  {
    icon: LayoutGrid,
    label: "Total Generasi",
    value: "—",
    sub: "Semua waktu",
    color: "oklch(0.82 0.15 205)",
  },
  {
    icon: TrendingUp,
    label: "Kredit Digunakan",
    value: "—",
    sub: "30 hari terakhir",
    color: "oklch(0.78 0.18 55)",
  },
  {
    icon: CheckCircle2,
    label: "Success Rate",
    value: "—",
    sub: "Rata-rata keberhasilan",
    color: "oklch(0.72 0.2 150)",
  },
];

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin?callbackUrl=/dashboard");
    }
  }, [status, router]);

  /* ── Loading ── */
  if (status === "loading") {
    return (
      <div className="min-h-screen p-6 lg:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const firstName = session.user?.name?.split(" ")[0] || "Creator";
  const userImage = session.user?.image;
  const userInitial = (session.user?.name || "U").charAt(0).toUpperCase();

  /* ── Hour-based greeting ── */
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Selamat pagi" : hour < 18 ? "Selamat siang" : "Selamat malam";

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: "oklch(0.04 0 0)" }}
    >
      {/* Ambient background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 80% 0%, oklch(0.4 0.16 210 / 0.08) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 20% 100%, oklch(0.78 0.18 55 / 0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── TOP HEADER ── */}
        <header className="flex items-start justify-between mb-8">
          <div>
            {/* Greeting badge */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-3"
              style={{
                background: "oklch(0.82 0.15 205 / 0.1)",
                border: "1px solid oklch(0.82 0.15 205 / 0.2)",
                color: "oklch(0.82 0.15 205)",
              }}
            >
              <Sparkles className="w-3 h-3" />
              {greeting}, {firstName}!
            </div>

            <h1 className="text-3xl font-bold text-white tracking-tight">
              Dashboard Studio
            </h1>
            <p className="mt-1 text-sm" style={{ color: "oklch(1 0 0 / 0.4)" }}>
              Buat, kelola, dan pantau semua konten AI Anda dari sini
            </p>
          </div>

          {/* Right: avatar + notif */}
          <div className="flex items-center gap-3">
            <button
              className="relative p-2.5 rounded-xl transition-all"
              style={{
                background: "oklch(1 0 0 / 0.04)",
                border: "1px solid oklch(1 0 0 / 0.08)",
              }}
            >
              <Bell
                className="w-4 h-4"
                style={{ color: "oklch(1 0 0 / 0.5)" }}
              />
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "oklch(0.82 0.15 205)" }}
              />
            </button>

            {userImage ? (
              <Image
                src={userImage}
                alt={firstName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
                style={{ border: "2px solid oklch(0.82 0.15 205 / 0.5)" }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{
                  background: "oklch(0.82 0.15 205 / 0.15)",
                  border: "2px solid oklch(0.82 0.15 205 / 0.4)",
                  color: "oklch(0.82 0.15 205)",
                }}
              >
                {userInitial}
              </div>
            )}
          </div>
        </header>

        {/* ── CREDIT BALANCE ── */}
        <section className="mb-6">
          <UserBalance />
        </section>

        {/* ── STATS ROW ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-4"
              style={{
                background: "oklch(1 0 0 / 0.03)",
                border: "1px solid oklch(1 0 0 / 0.07)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs"
                  style={{ color: "oklch(1 0 0 / 0.4)" }}
                >
                  {s.label}
                </span>
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "oklch(1 0 0 / 0.3)" }}
              >
                {s.sub}
              </p>
            </div>
          ))}
        </section>

        {/* ── QUICK ACTIONS ── */}
        <section className="mb-8">
          <h2
            className="text-xs font-medium uppercase tracking-widest mb-4"
            style={{ color: "oklch(1 0 0 / 0.35)" }}
          >
            Aksi Cepat
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {quickActions.map(
              ({
                icon: Icon,
                label,
                desc,
                href,
                gradient,
                glowColor,
                badge,
              }) => (
                <Link
                  key={href}
                  href={href}
                  className="group relative rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 overflow-hidden"
                  style={{
                    background: "oklch(1 0 0 / 0.03)",
                    border: "1px solid oklch(1 0 0 / 0.08)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "oklch(1 0 0 / 0.14)";
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "oklch(1 0 0 / 0.05)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      `0 8px 32px -8px ${glowColor}`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.borderColor =
                      "oklch(1 0 0 / 0.08)";
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "oklch(1 0 0 / 0.03)";
                    (e.currentTarget as HTMLAnchorElement).style.boxShadow =
                      "none";
                  }}
                >
                  {/* Icon */}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${gradient} transition-transform duration-300 group-hover:scale-110`}
                    style={{ boxShadow: `0 4px 16px -4px ${glowColor}` }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>

                  {/* Text */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white">
                        {label}
                      </h3>
                      {badge && (
                        <span
                          className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{
                            background: "oklch(0.82 0.15 205 / 0.15)",
                            color: "oklch(0.82 0.15 205)",
                            border: "1px solid oklch(0.82 0.15 205 / 0.25)",
                          }}
                        >
                          {badge}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "oklch(1 0 0 / 0.4)" }}
                    >
                      {desc}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ArrowRight
                    className="w-4 h-4 absolute bottom-5 right-5 transition-all duration-200 group-hover:translate-x-1"
                    style={{ color: "oklch(1 0 0 / 0.2)" }}
                  />
                </Link>
              ),
            )}
          </div>
        </section>

        {/* ── RECENT GENERATIONS ── */}
        <section
          className="rounded-2xl p-6"
          style={{
            background: "oklch(1 0 0 / 0.02)",
            border: "1px solid oklch(1 0 0 / 0.07)",
          }}
        >
          <RecentGenerations />
        </section>
      </div>
    </div>
  );
}
