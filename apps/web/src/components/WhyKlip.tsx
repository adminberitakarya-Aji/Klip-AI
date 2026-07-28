"use client";

import { motion } from "framer-motion";
import { Sparkles, Zap, Shield, Globe, Users, ArrowRight } from "lucide-react";

const reasons = [
  {
    icon: Sparkles,
    title: "Multi-Model Pipeline",
    desc: "Access SVD, Gen-2, AnimateDiff, MotionCtrl & more in one unified workflow.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    desc: "Dedicated GPU clusters with priority queue. Generate 4K videos in seconds.",
  },
  {
    icon: Shield,
    title: "Commercial Ready",
    desc: "Full commercial license, no watermarks, private generations included.",
  },
  {
    icon: Globe,
    title: "Global CDN",
    desc: "Instant delivery worldwide with edge caching and signed URLs.",
  },
  {
    icon: Users,
    title: "Team Workspaces",
    desc: "Collaborate with shared credits, projects & templates across your team.",
  },
  {
    icon: ArrowRight,
    title: "API & Integrations",
    desc: "REST API, webhooks, Zapier, ComfyUI nodes for custom pipelines.",
  },
];

export function WhyKlip() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-600/10 via-transparent to-pink-600/10 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs uppercase tracking-widest text-neutral-400 mb-3 block">
            WHY KLIP AI
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            Built for{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              creators
            </span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            Everything you need to create cinematic AI video content — without
            complexity.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                className="group p-6 rounded-2xl bg-neutral-950/50 border border-neutral-800/50 hover:border-neutral-700/50 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <div className="p-3 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-semibold text-white mb-2">{item.title}</h4>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
