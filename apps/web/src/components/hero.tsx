"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@klipai/ui/components/button";
import { ArrowRight, Sparkles, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const easeOutCubic = [0.34, 1.56, 0.64, 1];

const videos = [
  {
    id: 0,
    src: "/assets/Woman_in_red_gown_jungle.mp4",
    prompt:
      "Pengambilan gambar sinematik seorang wanita bergaun merah berjalan di hutan lebat, 4K",
    label: "Text to Video",
    accentColor: "text-purple-300",
  },
  {
    id: 1,
    src: "/assets/Dieng_Plateau_dawn_landscape_202607242207.mp4",
    prompt:
      "Lanskap Dataran Tinggi Dieng saat fajar, kabut pagi, nuansa sinematik Indonesia, 4K",
    label: "Image to Video",
    accentColor: "text-cyan-300",
  },
  {
    id: 2,
    src: "/assets/Gargoyle_leaps,_Thalia_unleashes…_202607242237.mp4",
    prompt:
      "Gargoyle melompat, Thalia melepaskan kekuatan ajaib, pencahayaan dramatis, cinematic VFX, 4K",
    label: "Motion Control",
    accentColor: "text-pink-300",
  },
];

export function Hero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const active = videos[activeIndex];

  // When active video ends → fade out → switch to next
  const handleEnded = useCallback(
    (endedIndex: number) => {
      if (endedIndex !== activeIndex) return;
      setIsTransitioning(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % videos.length);
        setIsTransitioning(false);
      }, 400);
    },
    [activeIndex],
  );

  // Play the active video and pause all others
  useEffect(() => {
    videoRefs.current.forEach((vid, i) => {
      if (!vid) return;
      if (i === activeIndex) {
        vid.muted = isMuted;
        vid.currentTime = 0;
        vid.play().catch(() => {});
      } else {
        vid.pause();
        vid.currentTime = 0;
      }
    });
  }, [activeIndex, isMuted]);

  const toggleMute = () => {
    const vid = videoRefs.current[activeIndex];
    if (vid) {
      vid.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <section className="relative w-full h-[100dvh] min-h-[580px] sm:min-h-[650px] flex flex-col justify-between overflow-hidden bg-black">
      {/* Video Layers — all mounted, only active is visible */}
      <div className="absolute inset-0 z-0">
        {videos.map((video, i) => (
          <video
            key={video.id}
            ref={(el) => {
              videoRefs.current[i] = el;
            }}
            src={video.src}
            autoPlay={i === 0}
            muted
            playsInline
            onEnded={() => handleEnded(i)}
            className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
            style={{ opacity: i === activeIndex && !isTransitioning ? 1 : 0 }}
          />
        ))}

        {/* Minimal Vignette & Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90 pointer-events-none z-10" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center max-w-5xl mx-auto pt-20 sm:pt-16">
        <motion.h1
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15] sm:leading-[1.1] drop-shadow-2xl mb-6 sm:mb-8 italic"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: easeOutCubic }}
        >
          Buat Video AI Sinematik <br className="hidden sm:block" />
          <span className="not-italic font-sans font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-200 bg-clip-text text-transparent">
            dalam Hitungan Detik
          </span>
        </motion.h1>

        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: easeOutCubic }}
        >
          <Button
            size="lg"
            className="group gap-2.5 sm:gap-3 px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-lg rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/30 backdrop-blur-md shadow-xl hover:border-white/50 transition-all duration-300 hover:scale-105"
            asChild
          >
            <a href="/generate" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-300" />
              <span>Mulai Buat Video Gratis</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </motion.div>
      </div>

      {/* Bottom Bar: Optimized Mobile Layout */}
      <div className="relative z-10 px-3 sm:px-8 pb-5 sm:pb-8 flex items-center sm:items-end justify-between w-full max-w-7xl mx-auto gap-2 sm:gap-4">
        {/* Spacer for desktop symmetry */}
        <div className="w-11 flex-shrink-0 hidden sm:block" />

        {/* Floating Prompt Pill */}
        <motion.div
          className="flex-1 min-w-0 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: easeOutCubic }}
        >
          <div className="w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-lg shadow-2xl hover:border-white/25 transition-all duration-300">
            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div className="text-left text-[11px] sm:text-sm text-white/90 overflow-hidden min-w-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  className="truncate"
                >
                  <span
                    className={`font-semibold mr-1 sm:mr-1.5 ${active.accentColor}`}
                  >
                    {active.label}:
                  </span>
                  <span className="text-white/80">{active.prompt}</span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Mute Button (Positioned on the Right) */}
        <motion.button
          onClick={toggleMute}
          className="p-2.5 sm:p-3 rounded-full bg-black/60 border border-white/15 backdrop-blur-lg text-white/80 hover:text-white hover:border-white/30 hover:bg-black/80 transition-all duration-300 shadow-xl flex-shrink-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          title={isMuted ? "Buka Suara Video" : "Senyapkan Video"}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
          ) : (
            <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </motion.button>
      </div>
    </section>
  );
}
