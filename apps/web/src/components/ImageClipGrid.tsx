"use client";

import { motion } from "framer-motion";
import { Play, Image as ImageIcon, Maximize2 } from "lucide-react";
import { cn } from "@klipai/ui/lib/utils";
import { useState } from "react";

export interface ClipItem {
  id: string;
  type: "video" | "image";
  title: string;
  prompt: string;
  model: string;
  duration?: string;
  resolution?: string;
  thumbnail: string;
  videoUrl?: string;
  tags?: string[];
}

interface ImageClipGridProps {
  items?: ClipItem[];
  className?: string;
}

const defaultItems: ClipItem[] = [
  {
    id: "1",
    type: "video",
    title: "Neon Skyline",
    prompt: "Cyberpunk city at night, flying cars, volumetric fog",
    model: "SVD-XT",
    duration: "4s",
    resolution: "1080p",
    thumbnail: "/assets/gallery-1.jpg",
    tags: ["T2V", "Cinematic"],
  },
  {
    id: "2",
    type: "image",
    title: "Aurora Portrait",
    prompt: "Studio portrait with aurora borealis backdrop",
    model: "SDXL",
    resolution: "1024x1024",
    thumbnail: "/assets/feat-t2i.jpg",
    tags: ["T2I", "Portrait"],
  },
  {
    id: "3",
    type: "video",
    title: "Macro Bloom",
    prompt: "Timelapse of a flower blooming in golden hour",
    model: "Gen-2",
    duration: "5s",
    resolution: "4K",
    thumbnail: "/assets/gallery-2.jpg",
    tags: ["T2V", "Nature"],
  },
  {
    id: "4",
    type: "video",
    title: "Liquid Metal",
    prompt: "Morphing liquid mercury, studio lighting",
    model: "AnimateDiff",
    duration: "3s",
    resolution: "1080p",
    thumbnail: "/assets/feat-motion.jpg",
    tags: ["I2V", "Abstract"],
  },
  {
    id: "5",
    type: "image",
    title: "Glasshouse",
    prompt: "Modern glass house on cliff, sunset",
    model: "Midjourney v6",
    resolution: "2048x2048",
    thumbnail: "/assets/feat-i2i.jpg",
    tags: ["T2I", "Architecture"],
  },
  {
    id: "6",
    type: "video",
    title: "Sakura Run",
    prompt: "Anime character running through sakura petals",
    model: "AnimateDiff",
    duration: "5s",
    resolution: "1080p",
    thumbnail: "/assets/feat-i2v.jpg",
    tags: ["I2V", "Anime"],
  },
];

/**
 * ImageClipGrid — small bento-style grid showcasing video + image clips.
 * Used as a compact "what you'll create" preview in landing sections.
 */
export function ImageClipGrid({
  items = defaultItems,
  className,
}: ImageClipGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4",
        className,
      )}
    >
      {items.map((item, i) => (
        <ClipTile key={item.id} item={item} index={i} />
      ))}
    </div>
  );
}

function ClipTile({ item, index }: { item: ClipItem; index: number }) {
  const [hovered, setHovered] = useState(false);
  const isVideo = item.type === "video";

  // Bento layout: first item larger on md+
  const isLarge = index === 0 || index === 3;

  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/5 bg-neutral-950",
        "cursor-pointer",
        isLarge
          ? "aspect-square md:aspect-[4/5] md:row-span-2"
          : "aspect-square",
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundImage: `url(${item.thumbnail})` }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

      {/* Type badge */}
      <div className="absolute top-3 left-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full",
            isVideo
              ? "bg-purple-600/90 text-white"
              : "bg-cyan-600/90 text-white",
          )}
        >
          {isVideo ? (
            <Play className="h-3 w-3" />
          ) : (
            <ImageIcon className="h-3 w-3" />
          )}
          {isVideo ? "Video" : "Image"}
        </span>
      </div>

      {/* Hover play/expand */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={false}
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-3 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
          {isVideo ? (
            <Play className="h-5 w-5 text-white ml-0.5" />
          ) : (
            <Maximize2 className="h-5 w-5 text-white" />
          )}
        </div>
      </motion.div>

      {/* Meta footer */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="px-1.5 py-0.5 text-[9px] font-mono bg-white/10 border border-white/10 rounded text-neutral-300">
            {item.model}
          </span>
          {item.duration && (
            <span className="px-1.5 py-0.5 text-[9px] font-mono bg-black/60 rounded text-neutral-300">
              {item.duration}
            </span>
          )}
        </div>
        <h4 className="text-sm md:text-base font-semibold text-white line-clamp-1">
          {item.title}
        </h4>
        <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
          {item.prompt}
        </p>
      </div>
    </motion.div>
  );
}

export default ImageClipGrid;
