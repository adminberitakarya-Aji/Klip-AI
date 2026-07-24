"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Twitter,
  Github,
  MessageSquare,
  Youtube,
  Mail,
  Sparkles,
  ArrowRight,
  Heart,
  Shield,
  Globe,
  Zap,
} from "lucide-react";
import { Button } from "@klipai/ui/components/button";

type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

const navigation: Record<string, { title: string; links: NavLink[] }> = {
  product: {
    title: "Produk",
    links: [
      { label: "Text to Video", href: "/generate?t2v" },
      { label: "Image to Video", href: "/generate?i2v" },
      { label: "Video to Video", href: "/generate?v2v" },
      { label: "Kontrol Gerakan", href: "/generate?ctrl" },
      { label: "Text to Image", href: "/generate?t2i" },
      { label: "Image to Image", href: "/generate?i2i" },
      { label: "Galeri Karya", href: "/#gallery" },
      { label: "Harga Kredit", href: "/#pricing" },
    ],
  },
  company: {
    title: "Perusahaan",
    links: [
      { label: "Tentang Kami", href: "/about" },
      { label: "Blog & Berita", href: "/blog" },
      { label: "Karir", href: "/careers" },
      { label: "Rilis Pers", href: "/press" },
      { label: "Mitra & Kemitraan", href: "/partners" },
    ],
  },
  resources: {
    title: "Sumber Daya",
    links: [
      { label: "Dokumentasi", href: "/docs" },
      { label: "Referensi API", href: "/docs/api" },
      { label: "Panduan Pengguna", href: "/guides" },
      { label: "Komunitas Kreator", href: "/community" },
      {
        label: "Discord Komunitas",
        href: "https://discord.gg/klip-ai",
        external: true,
      },
      {
        label: "Status Layanan",
        href: "https://status.klip-ai.com",
        external: true,
      },
    ],
  },
  legal: {
    title: "Hukum & Privasi",
    links: [
      { label: "Kebijakan Privasi", href: "/privacy" },
      { label: "Syarat & Ketentuan", href: "/terms" },
      { label: "Kebijakan Cookie", href: "/cookies" },
      { label: "Penggunaan Layanan", href: "/acceptable-use" },
      { label: "Perjanjian Data (DPA)", href: "/dpa" },
    ],
  },
};

const socialLinks = [
  {
    icon: Twitter,
    href: "https://twitter.com/klip_ai",
    label: "Twitter",
    hoverColor:
      "hover:bg-sky-500/20 hover:border-sky-500/40 hover:text-sky-400",
    external: true,
  },
  {
    icon: Github,
    href: "https://github.com/klip-ai",
    label: "GitHub",
    hoverColor: "hover:bg-white/10 hover:border-white/25 hover:text-white",
    external: true,
  },
  {
    icon: MessageSquare,
    href: "https://discord.gg/klip-ai",
    label: "Discord",
    hoverColor:
      "hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-indigo-400",
    external: true,
  },
  {
    icon: Youtube,
    href: "https://youtube.com/@klip-ai",
    label: "YouTube",
    hoverColor:
      "hover:bg-red-600/20 hover:border-red-500/40 hover:text-red-400",
    external: true,
  },
  {
    icon: Mail,
    href: "mailto:hello@klip-ai.com",
    label: "Email",
    hoverColor:
      "hover:bg-purple-500/20 hover:border-purple-500/40 hover:text-purple-400",
    external: true,
  },
];

const trustBadges = [
  { icon: Shield, text: "Terverifikasi Aman", color: "text-emerald-400" },
  { icon: Globe, text: "CDN Global Cepat", color: "text-blue-400" },
  { icon: Zap, text: "99.9% Uptime", color: "text-amber-400" },
  { icon: Heart, text: "Dibuat Sepenuh Hati", color: "text-pink-400" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] bg-black overflow-hidden">
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

      {/* Background ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/5 blur-[160px] rounded-full pointer-events-none" />

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
          {/* Brand Column */}
          <motion.div
            className="lg:col-span-1 col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:shadow-purple-500/50 transition-shadow">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Klip AI</span>
            </Link>
            <p className="text-neutral-500 text-sm leading-relaxed mb-8 max-w-xs">
              Platform terpadu untuk kreasi video AI sinematik. Banyak model,
              satu alur kerja, kreativitas tanpa batas.
            </p>

            {/* Social Links */}
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((social, i) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target={social.external ? "_blank" : undefined}
                  rel={social.external ? "noopener noreferrer" : undefined}
                  className={`w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-neutral-500 transition-all duration-300 ${social.hoverColor}`}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  aria-label={social.label}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <social.icon className="h-4 w-4" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Navigation Columns */}
          {Object.entries(navigation).map(([key, section], catIndex) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 + catIndex * 0.08 }}
            >
              <h4 className="font-semibold text-white text-sm mb-5 tracking-tight">
                {section.title}
              </h4>
              <nav className="space-y-3">
                {section.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-1 text-neutral-500 hover:text-white transition-colors text-sm group"
                  >
                    <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                      {link.label}
                    </span>
                    {link.external && (
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 flex-shrink-0" />
                    )}
                  </Link>
                ))}
              </nav>
            </motion.div>
          ))}
        </div>

        {/* Gradient divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

        {/* Trust Badges + Newsletter */}
        <motion.div
          className="flex flex-wrap items-center justify-between gap-6 mb-10"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-6">
            {trustBadges.map((badge) => (
              <span
                key={badge.text}
                className="flex items-center gap-2 text-sm text-neutral-600"
              >
                <badge.icon className={`h-3.5 w-3.5 ${badge.color}`} />
                <span>{badge.text}</span>
              </span>
            ))}
          </div>

          {/* Newsletter Signup */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3">
            <span className="text-sm text-neutral-500 hidden sm:block whitespace-nowrap">
              Info terbaru & akses awal:
            </span>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Masukkan email Anda"
                className="w-full sm:w-56 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white placeholder-neutral-600 focus:border-purple-500/60 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
                aria-label="Alamat email"
              />
              <Button
                size="sm"
                className="gap-1.5 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/25 text-white rounded-xl flex-shrink-0"
              >
                Langganan
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mb-8" />

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-neutral-600 text-sm">
            © {new Date().getFullYear()} Klip AI. Hak cipta dilindungi
            undang-undang.
          </p>

          <div className="flex items-center gap-5 text-sm text-neutral-600">
            {[
              { label: "Privasi", href: "/privacy" },
              { label: "Syarat & Ketentuan", href: "/terms" },
              { label: "Kebijakan Cookie", href: "/cookies" },
              { label: "Ketentuan Penggunaan", href: "/acceptable-use" },
            ].map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-700">
            <Heart className="h-3 w-3 text-pink-500/70" aria-hidden="true" />
            <span>Dibuat dengan dedikasi untuk kreator Indonesia</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
