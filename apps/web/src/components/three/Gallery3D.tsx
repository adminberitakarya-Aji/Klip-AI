"use client";

import { CanvasProvider } from "./CanvasProvider";
import { ImageGallery } from "./objects/ImageGallery";
import { type GalleryItemData } from "./objects/GalleryItem";
import {
  Sparkles,
  Video,
  Image as ImageIcon,
  Zap,
  Layers,
  SlidersHorizontal,
  Cpu,
} from "lucide-react";
import type { ReactElement } from "react";

const featured: Array<Omit<GalleryItemData, "icon"> & { iconKey: string }> = [
  {
    id: "1",
    title: "Cyberpunk City",
    badge: "SVD-XT",
    color: "#a855f7",
    iconKey: "Video",
  },
  {
    id: "2",
    title: "Ocean Waves Macro",
    badge: "Gen-2",
    color: "#06b6d4",
    iconKey: "Waves",
  },
  {
    id: "3",
    title: "Portrait Animation",
    badge: "I2V",
    color: "#ec4899",
    iconKey: "Image",
  },
  {
    id: "4",
    title: "Oil Painting Style",
    badge: "V2V",
    color: "#f59e0b",
    iconKey: "Layers",
  },
  {
    id: "5",
    title: "Alien Landscape",
    badge: "SDXL",
    color: "#10b981",
    iconKey: "Sparkles",
  },
  {
    id: "6",
    title: "Orbit Camera Shot",
    badge: "CTRL",
    color: "#8b5cf6",
    iconKey: "Zap",
  },
];

const iconMap: Record<string, ReactElement> = {
  Sparkles: <Sparkles className="h-4 w-4" />,
  Video: <Video className="h-4 w-4" />,
  Image: <ImageIcon className="h-4 w-4" />,
  Layers: <Layers className="h-4 w-4" />,
  Zap: <Zap className="h-4 w-4" />,
  Waves: <SlidersHorizontal className="h-4 w-4" />,
};

const items: GalleryItemData[] = featured.map((f) => ({
  id: f.id,
  title: f.title,
  badge: f.badge,
  color: f.color,
  icon: iconMap[f.iconKey] ?? <Cpu className="h-4 w-4" />,
}));

/**
 * Gallery3D — R3F-powered 3D carousel alternative to the flat gallery grid.
 * Wrap in any section that wants the spinning-3D look. Falls back to
 * the flat Gallery component on devices without WebGL.
 */
export function Gallery3D({ className = "" }: { className?: string }) {
  return (
    <CanvasProvider
      className={className}
      camera={{ position: [0, 0, 10], fov: 50 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -3, 5]} intensity={0.4} color="#a855f7" />
      <ImageGallery items={items} radius={5} speed={0.18} />
    </CanvasProvider>
  );
}

export default Gallery3D;

// Re-export for convenience
export { GalleryItem, type GalleryItemData } from "./objects/GalleryItem";
export { ImageGallery } from "./objects/ImageGallery";
