"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { GalleryItem, type GalleryItemData } from "./GalleryItem";

interface ImageGalleryProps {
  items: GalleryItemData[];
  radius?: number;
  speed?: number;
}

/**
 * ImageGallery — arranges GalleryItem tiles in a circular carousel.
 * The whole group rotates slowly around the Y axis. Each tile is
 * positioned on the ring with a slight random rotation.
 */
export function ImageGallery({
  items,
  radius = 6,
  speed = 0.15,
}: ImageGalleryProps) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.getElapsedTime() * speed;
  });

  return (
    <group ref={groupRef}>
      {items.map((item, i) => {
        const angle = (i / items.length) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const yRotation = -angle; // face the camera direction
        return (
          <GalleryItem
            key={item.id}
            position={[x, 0, z]}
            rotation={[0, yRotation, 0]}
            data={item}
            delay={i * 0.3}
          />
        );
      })}
    </group>
  );
}

export default ImageGallery;
