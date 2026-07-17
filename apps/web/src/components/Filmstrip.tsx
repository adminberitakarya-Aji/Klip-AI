"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "10K+", label: "Active Creators" },
  { value: "500K+", label: "Videos Generated" },
  { value: "99.9%", label: "Service Uptime" },
  { value: "4.9/5", label: "Average Rating" },
];

export function Filmstrip() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-36 px-4 sm:px-6 lg:px-8 bg-neutral-950/30 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs uppercase tracking-widest text-neutral-400 mb-3 block">
            PROVEN TRACK RECORD
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            Trusted by 10,000+ Creators & Brands
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            From independent creators to major brands, Klip AI powers their
            visual content creation.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-neutral-500 mt-2">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
