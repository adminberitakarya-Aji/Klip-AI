"use client";

import Image from "next/image";

const marqueeClips = [
  { title: "Metropolis Cyberpunk", tag: "T2V", img: "/assets/gallery-1.jpg" },
  { title: "Makro Ombak Laut", tag: "Alam", img: "/assets/gallery-2.jpg" },
  { title: "Animasi Potret", tag: "I2V", img: "/assets/gallery-3.jpg" },
  { title: "Transfer Gaya Seni", tag: "V2V", img: "/assets/gallery-4.jpg" },
  { title: "Kamera Orbit 3D", tag: "CTRL", img: "/assets/feat-motion.jpg" },
  { title: "Hutan Sinematik", tag: "4K", img: "/assets/hero-cinematic.jpg" },
];

export function Filmstrip() {
  return (
    <section className="relative py-10 bg-neutral-950/80 border-y border-white/[0.07] overflow-hidden">
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      {/* Infinite marquee */}
      <div className="flex gap-4 w-max animate-marquee">
        {[...marqueeClips, ...marqueeClips, ...marqueeClips].map((clip, i) => (
          <div
            key={i}
            className="relative w-64 h-36 rounded-2xl overflow-hidden border border-white/15 flex-shrink-0 group hover:border-purple-500/50 transition-all duration-300 shadow-xl"
          >
            <Image
              src={clip.img}
              alt={clip.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                {clip.title}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-purple-500/30 border border-purple-400/40 text-purple-200">
                {clip.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
