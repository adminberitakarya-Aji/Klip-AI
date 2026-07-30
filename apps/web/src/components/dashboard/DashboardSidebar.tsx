"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import {
  LayoutDashboard,
  Wand2,
  Video,
  CreditCard,
  History,
  Palette,
  Settings,
  ChevronLeft,
  LogOut,
  Bell,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Wand2, label: "Generate", href: "/generate" },
  { icon: Video, label: "Templates", href: "/templates" },
  { icon: CreditCard, label: "Credits", href: "/credits" },
  { icon: History, label: "Riwayat", href: "/credits/history" },
  { icon: Palette, label: "Brand Kit", href: "/brand-kit" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userImage = session?.user?.image;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-30 p-2 rounded-xl"
        style={{
          background: "oklch(0.1 0.01 260 / 0.9)",
          border: "1px solid oklch(1 0 0 / 0.1)",
          backdropFilter: "blur(12px)",
        }}
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full flex flex-col transition-all duration-300
          ${collapsed ? "w-[72px]" : "w-[240px]"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          background:
            "linear-gradient(180deg, oklch(0.07 0.015 260) 0%, oklch(0.06 0.01 250) 100%)",
          borderRight: "1px solid oklch(1 0 0 / 0.07)",
          backdropFilter: "blur(20px)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-4 py-5"
          style={{ borderBottom: "1px solid oklch(1 0 0 / 0.06)" }}
        >
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <span
                className="text-xl font-bold"
                style={{ color: "oklch(0.82 0.15 205)" }}
              >
                Klip<span className="text-white">-AI</span>
              </span>
            </Link>
          )}
          <div className="flex items-center gap-1 ml-auto">
            {/* Mobile close */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg transition-colors"
              style={{ color: "oklch(1 0 0 / 0.4)" }}
            >
              <X className="w-4 h-4" />
            </button>
            {/* Collapse toggle desktop */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg transition-all"
              style={{ color: "oklch(1 0 0 / 0.4)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "white")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "oklch(1 0 0 / 0.4)")
              }
            >
              <ChevronLeft
                className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ icon: Icon, label, href }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative"
                style={{
                  background: isActive
                    ? "oklch(0.82 0.15 205 / 0.12)"
                    : "transparent",
                  color: isActive
                    ? "oklch(0.82 0.15 205)"
                    : "oklch(1 0 0 / 0.5)",
                  border: isActive
                    ? "1px solid oklch(0.82 0.15 205 / 0.2)"
                    : "1px solid transparent",
                }}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: "oklch(0.82 0.15 205)" }}
                  />
                )}
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{label}</span>
                )}
                {/* Tooltip on collapsed */}
                {collapsed && (
                  <div
                    className="absolute left-full ml-2 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                    style={{
                      background: "oklch(0.12 0.01 260)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      color: "white",
                    }}
                  >
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Settings + User */}
        <div
          className="p-2 space-y-1"
          style={{ borderTop: "1px solid oklch(1 0 0 / 0.06)" }}
        >
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
            style={{ color: "oklch(1 0 0 / 0.4)" }}
          >
            <Settings className="w-5 h-5 shrink-0" />
            {!collapsed && (
              <span className="text-sm font-medium">Pengaturan</span>
            )}
          </Link>

          {/* User profile */}
          <div
            className="flex items-center gap-3 px-3 py-3 rounded-xl mt-1"
            style={{
              background: "oklch(1 0 0 / 0.04)",
              border: "1px solid oklch(1 0 0 / 0.07)",
            }}
          >
            {userImage ? (
              <Image
                src={userImage}
                alt={userName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-full shrink-0"
                style={{ border: "2px solid oklch(0.82 0.15 205 / 0.4)" }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-sm font-bold"
                style={{
                  background: "oklch(0.82 0.15 205 / 0.2)",
                  color: "oklch(0.82 0.15 205)",
                  border: "2px solid oklch(0.82 0.15 205 / 0.4)",
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {userName}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: "oklch(1 0 0 / 0.35)" }}
                >
                  {userEmail}
                </p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={() => signOut({ callbackUrl: "/signin" })}
                className="p-1.5 rounded-lg transition-colors shrink-0"
                style={{ color: "oklch(1 0 0 / 0.3)" }}
                title="Sign out"
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color =
                    "oklch(0.65 0.22 27)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color =
                    "oklch(1 0 0 / 0.3)")
                }
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
