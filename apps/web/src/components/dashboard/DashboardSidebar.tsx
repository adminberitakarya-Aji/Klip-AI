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
      className="fixed top-0 left-0 z-50 h-full w-[72px] flex flex-col justify-between items-center py-4 select-none"
      style={{
        background: "oklch(0.05 0.01 260)",
        borderRight: "1px solid oklch(1 0 0 / 0.08)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* ── TOP: Brand Logo ── */}
      <div className="flex flex-col items-center gap-6">
        <Link
          href="/dashboard"
          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg transition-transform hover:scale-105"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.82 0.15 205) 0%, oklch(0.7 0.18 230) 100%)",
            color: "oklch(0.05 0 0)",
            boxShadow: "0 0 20px oklch(0.82 0.15 205 / 0.4)",
          }}
          title="Klip-AI Studio"
        >
          K
        </Link>

        {/* ── NAV ITEMS ── */}
        <nav className="flex flex-col items-center gap-2">
          {navItems.map(({ icon: Icon, label, href }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));

            return (
              <Link
                key={href}
                href={href}
                className="group relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200"
                style={{
                  background: isActive
                    ? "oklch(0.82 0.15 205 / 0.15)"
                    : "transparent",
                  color: isActive
                    ? "oklch(0.82 0.15 205)"
                    : "oklch(1 0 0 / 0.45)",
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
                      "oklch(1 0 0 / 0.45)";
                  }
                }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full"
                    style={{ background: "oklch(0.82 0.15 205)" }}
                  />
                )}
                <Icon className="w-5 h-5" />

                {/* Tooltip */}
                <div
                  className="absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-xl"
                  style={{
                    background: "oklch(0.12 0.015 260)",
                    border: "1px solid oklch(1 0 0 / 0.12)",
                    color: "white",
                  }}
                >
                  {label}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ── BOTTOM: Balance Pill & User Avatar ── */}
      <div className="flex flex-col items-center gap-3">
        {/* Balance Badge Pill */}
        <Link
          href="/credits"
          className="group relative flex flex-col items-center justify-center p-2 rounded-xl transition-all"
          style={{
            background: "oklch(1 0 0 / 0.04)",
            border: "1px solid oklch(1 0 0 / 0.08)",
          }}
          title="Saldo Credits"
        >
          <Coins
            className="w-4 h-4 transition-transform group-hover:scale-110"
            style={{ color: "oklch(0.82 0.15 205)" }}
          />
          <span
            className="text-[10px] font-bold mt-0.5 tabular-nums"
            style={{ color: "white" }}
          >
            {balance !== null ? balance : "—"}
          </span>
          {/* Tooltip */}
          <div
            className="absolute left-full ml-3 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-50 shadow-xl"
            style={{
              background: "oklch(0.12 0.015 260)",
              border: "1px solid oklch(1 0 0 / 0.12)",
              color: "white",
            }}
          >
            {balance !== null
              ? `${balance} Credits Available`
              : "Top Up Credits"}
          </div>
        </Link>

        {/* User Profile Avatar with Logout */}
        <div className="group relative">
          <button className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden transition-transform group-hover:scale-105">
            {userImage ? (
              <Image
                src={userImage}
                alt={userName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
                style={{ border: "2px solid oklch(0.82 0.15 205 / 0.5)" }}
              />
            ) : (
              <div
                className="w-full h-full rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: "oklch(0.82 0.15 205 / 0.2)",
                  border: "2px solid oklch(0.82 0.15 205 / 0.4)",
                  color: "oklch(0.82 0.15 205)",
                }}
              >
                {userInitial}
              </div>
            )}
          </button>

          {/* Hover Menu / Logout Popover */}
          <div
            className="absolute bottom-0 left-full ml-3 w-48 p-2 rounded-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all duration-200 z-50 shadow-2xl space-y-1"
            style={{
              background: "oklch(0.1 0.015 260)",
              border: "1px solid oklch(1 0 0 / 0.12)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="px-3 py-2 border-b border-[oklch(1_0_0/0.06)]">
              <p className="text-xs font-semibold text-white truncate">
                {userName}
              </p>
              <p className="text-[11px] text-[oklch(1_0_0/0.4)] truncate">
                {session?.user?.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar (Sign Out)
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
