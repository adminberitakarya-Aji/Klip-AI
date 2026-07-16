'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
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
  Zap
} from 'lucide-react';
import { Button } from '@klipai/ui/components/button';

type NavLink = {
  label: string;
  href: string;
  external?: boolean;
};

const navigation: Record<string, NavLink[]> = {
  product: [
    { label: 'Text to Video', href: '/generate?t2v' },
    { label: 'Image to Video', href: '/generate?i2v' },
    { label: 'Video to Video', href: '/generate?v2v' },
    { label: 'Motion Control', href: '/generate?ctrl' },
    { label: 'Text to Image', href: '/generate?t2i' },
    { label: 'Image to Image', href: '/generate?i2i' },
    { label: 'Gallery', href: '/gallery' },
    { label: 'Pricing', href: '/pricing' },
  ],
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Partners', href: '/partners' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/docs/api' },
    { label: 'Guides', href: '/guides' },
    { label: 'Community', href: '/community' },
    { label: 'Discord', href: 'https://discord.gg/klip-ai', external: true },
    { label: 'Status', href: 'https://status.klip-ai.com', external: true },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'Acceptable Use', href: '/acceptable-use' },
    { label: 'DPA', href: '/dpa' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/klip_ai', label: 'Twitter', external: true },
  { icon: Github, href: 'https://github.com/klip-ai', label: 'GitHub', external: true },
  { icon: MessageSquare, href: 'https://discord.gg/klip-ai', label: 'Discord', external: true },
  { icon: Youtube, href: 'https://youtube.com/@klip-ai', label: 'YouTube', external: true },
  { icon: Mail, href: 'mailto:hello@klip-ai.com', label: 'Email', external: true },
];

const trustBadges = [
  { icon: Shield, text: 'SOC 2 Certified' },
  { icon: Globe, text: 'Global CDN' },
  { icon: Zap, text: '99.9% Uptime' },
  { icon: Heart, text: 'Made with care' },
];

export function Footer() {
  return (
    <footer className="relative border-t border-neutral-900 bg-neutral-950/50">
      {/* Background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(139,92,246,0.08),transparent_60%)]" pointer-events="none" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
          {/* Brand Column */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Klip AI</span>
            </Link>
            <p className="text-neutral-400 text-sm leading-relaxed mb-6 max-w-xs">
              The unified platform for cinematic AI video generation. 
              Multiple models, one workflow, unlimited creativity.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-3">
              {socialLinks.map((social, i) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target={social.external ? '_blank' : undefined}
                  rel={social.external ? 'noopener noreferrer' : undefined}
                  className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white hover:border-neutral-700 hover:bg-neutral-800 transition-all duration-300 group"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Navigation Columns */}
          {Object.entries(navigation).map(([category, links], catIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 + catIndex * 0.08 }}
            >
              <h4 className="font-semibold text-white mb-4 tracking-tight">{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
              <nav className="space-y-3">
                {links.map((link, i) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + i * 0.03 }}
                  >
                    <Link
                      href={link.href}
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                      className="text-neutral-400 hover:text-white transition-colors text-sm flex items-center gap-2 group"
                    >
                      {link.label}
                      {link.external && (
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </nav>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <div className="h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent mb-10" />
          
          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-between gap-6 mb-10">
            <div className="flex flex-wrap items-center gap-8 text-neutral-500 text-sm">
              {trustBadges.map((badge, i) => (
                <motion.span
                  key={badge.text}
                  className="flex items-center gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  <badge.icon className="h-4 w-4 text-neutral-600" />
                  <span>{badge.text}</span>
                </motion.span>
              ))}
            </div>

            {/* Newsletter Signup */}
            <motion.div
              className="flex flex-col sm:flex-row items-center sm:items-center gap-4"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <span className="text-sm text-neutral-400 hidden sm:block">Get updates, tips & early access</span>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all text-sm"
                  aria-label="Email address"
                />
                <Button size="sm" className="gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-600/25">
                  Subscribe
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-900">
            <motion.p
              className="text-neutral-500 text-sm"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
            >
              © {new Date().getFullYear()} Klip AI. All rights reserved.
            </motion.p>
            
            <motion.div
              className="flex items-center gap-6 text-sm text-neutral-500"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
            >
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">Cookies</Link>
              <Link href="/acceptable-use" className="hover:text-white transition-colors">Acceptable Use</Link>
            </motion.div>
            
            <motion.div
              className="flex items-center gap-2 text-xs text-neutral-600"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8 }}
            >
              <Heart className="h-3 w-3 text-pink-500" aria-hidden="true" />
              <span>Built with passion for creators worldwide</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}