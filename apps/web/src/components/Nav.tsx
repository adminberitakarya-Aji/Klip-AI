"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Sparkles,
  ArrowRight,
  Coins,
  User,
  LogOut,
  LayoutDashboard,
  CreditCard,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@klipai/ui/components/button";
import { cn } from "@klipai/ui/lib/utils";

const navLinks = [
  { label: "Fitur", href: "#features" },
  { label: "Galeri", href: "#gallery" },
  { label: "Harga", href: "#pricing" },
  { label: "Template", href: "/templates" },
];

export function Nav() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // Track scroll for backdrop effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch balance when logged in
  useEffect(() => {
    if (session) {
      fetch("/api/credits/balance")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setBalance(data.data.balance);
          }
        })
        .catch(console.error);
    }
  }, [session]);

  const isLoggedIn = !!session;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-black/80 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent",
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Klip AI</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-neutral-400 hover:text-white transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-purple-500 group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Right Side - Auth State */}
          <div className="hidden md:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                {/* Credits Balance Badge */}
                <Link
                  href="/credits"
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full hover:bg-purple-500/30 transition-colors"
                >
                  <Coins className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">
                    {balance !== null ? balance.toLocaleString("id-ID") : "..."}{" "}
                    credits
                  </span>
                </Link>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center">
                        <User className="h-4 w-4 text-purple-400" />
                      </div>
                    )}
                    <span className="text-sm text-white max-w-[100px] truncate">
                      {session.user?.name?.split(" ")[0] || "User"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl overflow-hidden"
                      >
                        <div className="p-3 border-b border-neutral-800">
                          <p className="text-sm font-medium text-white truncate">
                            {session.user?.name}
                          </p>
                          <p className="text-xs text-neutral-500 truncate">
                            {session.user?.email}
                          </p>
                        </div>
                        <div className="p-2">
                          <Link
                            href="/dashboard"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
                          >
                            <LayoutDashboard className="h-4 w-4" />
                            <span className="text-sm">Dashboard</span>
                          </Link>
                          <Link
                            href="/credits"
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span className="text-sm">Beli Credits</span>
                          </Link>
                          <button
                            onClick={() => signOut({ callbackUrl: "/" })}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-800 transition-colors text-red-400"
                          >
                            <LogOut className="h-4 w-4" />
                            <span className="text-sm">Keluar</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  href="/generate"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/25 transition-all duration-300"
                >
                  Buat Video
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="text-sm text-neutral-400 hover:text-white transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/25 transition-all duration-300"
                >
                  Mulai Sekarang
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block py-3 text-neutral-400 hover:text-white transition-colors text-lg font-medium"
                >
                  {link.label}
                </Link>
              ))}

              {isLoggedIn ? (
                <>
                  {/* Mobile Credits Badge */}
                  <Link
                    href="/credits"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl"
                  >
                    <Coins className="h-5 w-5 text-purple-400" />
                    <span className="text-white font-medium">
                      {balance !== null
                        ? balance.toLocaleString("id-ID")
                        : "..."}{" "}
                      credits
                    </span>
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>

                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>

                  <Link
                    href="/generate"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center py-3 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all duration-300"
                  >
                    Create Video
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/signin"
                    onClick={() => setIsOpen(false)}
                    className="block py-3 text-neutral-400 hover:text-white transition-colors text-lg font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center py-3 px-5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:from-purple-500 hover:to-pink-500 transition-all duration-300"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

export default Nav;
