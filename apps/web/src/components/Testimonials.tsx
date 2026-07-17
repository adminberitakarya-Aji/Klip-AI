"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Content Creator",
    avatar: "SC",
    content:
      "Klip AI completely transformed my workflow. I can now create professional videos in minutes instead of hours. The text-to-video quality is mind-blowing.",
    platform: "TikTok",
    rating: 5,
  },
  {
    name: "Andi Pratama",
    role: "UMKM Owner, Jakarta",
    avatar: "AP",
    content:
      "Sebagai pemilik usaha kecil, Klip AI membantu saya membuat iklan produk yang terlihat profesional tanpa harus bayar tim kreatif. Sangat recommended!",
    platform: "Instagram",
    rating: 5,
  },
  {
    name: "Marcus Rivera",
    role: "Video Editor",
    avatar: "MR",
    content:
      "The motion control feature is a game changer. I can precisely control camera paths and animations. This is miles ahead of any other AI video tool I have tried.",
    platform: "YouTube",
    rating: 5,
  },
  {
    name: "Emma Watson",
    role: "Digital Marketer",
    avatar: "EW",
    content:
      "We use Klip AI for our entire content pipeline. From concept to final video in under 5 minutes. Our engagement rates have doubled since switching.",
    platform: "LinkedIn",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 px-4 sm:px-6 lg:px-8 bg-neutral-950/30 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-xs uppercase tracking-widest text-neutral-400 mb-3 block">
            TESTIMONIALS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-4">
            Loved by{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
              creators worldwide
            </span>
          </h2>
          <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
            See what our community says about their experience with Klip AI.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((item, i) => (
            <motion.div
              key={item.name}
              className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {item.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">{item.name}</h4>
                    <span className="text-xs text-neutral-500 bg-white/5 px-2 py-1 rounded-full">
                      {item.platform}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-400">{item.role}</p>
                  <div className="flex gap-1 mt-1">
                    {Array.from({ length: item.rating }).map((_, j) => (
                      <svg
                        key={j}
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-neutral-300 leading-relaxed text-[15px] italic">
                &ldquo;{item.content}&rdquo;
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
