"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  Home,
  Wand2,
  Video,
  CreditCard,
  History,
  Palette,
  LogOut,
  Coins,
} from "lucide-react";

const navItems = [
  { icon: Home, label: "Home", href: "/dashboard" },
  { icon: Wand2, label: "Studio AI", href: "/generate" },
  { icon: Video, label: "Templates", href: "/templates" },
  { icon: Palette, label: "Brand Kit", href: "/brand-kit" },
  { icon: CreditCard, label: "Credits", href: "/credits" },
  { icon: History, label: "Riwayat", href: "/credits/history" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/credits/balance")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setBalance(res.data?.balance ?? res.balance ?? 0);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const userName = session?.user?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();
  const userImage = session?.user?.image;

  return (
    <aside
      className="fixed top-0 left-0 z-50 h-full w-56 flex flex-col justify-between p-4 select-none"
      style={{
        background: "oklch(0.05 0.01 260)",
        borderRight: "1px solid oklch(1 0 0 / 0.08)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* ── TOP: Brand Logo & Title ── */}
      <div className="flex flex-col gap-6">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-2 py-1 transition-transform hover:scale-[1.02]"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shrink-0"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.82 0.15 205) 0%, oklch(0.7 0.18 230) 100%)",
              color: "oklch(0.05 0 0)",
              boxShadow: "0 0 20px oklch(0.82 0.15 205 / 0.4)",
            }}
          >
            K
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            Klip-AI{" "}
            <span className="text-cyan-400 font-medium text-xs">Studio</span>
          </span>
        </Link>

        {/* ── NAV ITEMS WITH LABELS ── */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map(({ icon: Icon, label, href }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className="group relative w-full h-10 px-3.5 rounded-xl flex items-center gap-3 text-xs font-semibold transition-all duration-200"
                style={{
                  background: isActive
                    ? "oklch(0.82 0.15 205 / 0.15)"
                    : "transparent",
                  color: isActive
                    ? "oklch(0.82 0.15 205)"
                    : "oklch(1 0 0 / 0.55)",
                  border: isActive
                    ? "1px solid oklch(0.82 0.15 205 / 0.3)"
                    : "1px solid transparent",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "oklch(1 0 0 / 0.05)";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "white";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLAnchorElement).style.background =
                      "transparent";
                    (e.currentTarget as HTMLAnchorElement).style.color =
                      "oklch(1 0 0 / 0.55)";
                  }
                }}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                    style={{ background: "oklch(0.82 0.15 205)" }}
                  />
                )}
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── BOTTOM: Balance Pill & User Profile ── */}
      <div className="flex flex-col gap-3">
        {/* Balance Badge Card */}
        <Link
          href="/credits"
          className="flex items-center justify-between p-3 rounded-2xl transition-all hover:bg-white/[0.06]"
          style={{
            background: "oklch(1 0 0 / 0.04)",
            border: "1px solid oklch(1 0 0 / 0.08)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "oklch(0.82 0.15 205 / 0.15)" }}
            >
              <Coins className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-400 font-medium">
                Credits
              </span>
              <span className="text-xs font-bold text-white tabular-nums">
                {balance !== null ? `${balance} Credits` : "—"}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-cyan-400 hover:underline">
            Top Up
          </span>
        </Link>

        {/* User Profile Info with Logout */}
        <div className="flex items-center justify-between p-2 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shrink-0">
              {userImage ? (
                <Image
                  src={userImage}
                  alt={userName}
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: "oklch(0.82 0.15 205 / 0.2)",
                    color: "oklch(0.82 0.15 205)",
                  }}
                >
                  {userInitial}
                </div>
              )}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-white truncate">
                {userName}
              </span>
              <span className="text-[10px] text-neutral-400 truncate">
                {session?.user?.email}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
