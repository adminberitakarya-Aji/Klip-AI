"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { Stars } from "./objects/Stars";
import { Float } from "./objects/Float";
import { AuroraOrbs } from "./objects/AuroraOrbs";

interface HeroSceneProps {
  scrollProgress?: number;
}

/**
 * HeroScene — composite R3F scene used behind the hero section.
 * Layers: deep starfield + mid-ground aurora orbs + foreground floating core.
 * Accepts a scrollProgress ref (0..1) to subtly shift camera + star rotation
 * as the user scrolls past the hero.
 */
export function HeroScene({ scrollProgress = 0 }: HeroSceneProps) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();

    // gentle drift on the whole scene
    groupRef.current.rotation.y = t * 0.02 + scrollProgress * Math.PI * 0.5;
    groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.05;

    // parallax camera offset
    state.camera.position.y = Math.sin(t * 0.15) * 0.4 - scrollProgress * 2;
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      <Stars count={3000} radius={50} size={0.15} />
      <AuroraOrbs count={6} radius={12} speed={0.5} />
      <Float position={[0, 0, 0]} scale={1.5} speed={1} />
      <Float position={[-6, 2, -3]} scale={0.6} speed={1.4} />
      <Float position={[7, -2, -4]} scale={0.5} speed={1.2} />
    </group>
  );
}

export default HeroScene;
