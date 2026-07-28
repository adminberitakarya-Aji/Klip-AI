"use client";

import { useRef, useState, type ReactElement } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Group, Mesh, MeshStandardMaterial, Color } from "three";
import { Html } from "@react-three/drei";

export interface GalleryItemData {
  id: string;
  title: string;
  badge: string;
  color: string;
  icon: ReactElement;
}

interface GalleryItemProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  data: GalleryItemData;
  delay?: number;
}

/**
 * GalleryItem — a single 3D tile representing one community generation.
 * Floats, slowly rotates, and lifts forward on hover with projected label.
 */
export function GalleryItem({
  position,
  rotation = [0, 0, 0],
  data,
  delay = 0,
}: GalleryItemProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime() + delay;

    // gentle float + slow Y rotation
    groupRef.current.position.y = position[1] + Math.sin(t * 0.6) * 0.1;
    groupRef.current.rotation.y = rotation[1] + Math.sin(t * 0.2) * 0.15;

    // hover forward lift
    const targetZ = hovered ? position[2] + 0.4 : position[2];
    groupRef.current.position.z +=
      (targetZ - groupRef.current.position.z) * 0.15;

    if (meshRef.current) {
      const mat = meshRef.current.material as MeshStandardMaterial;
      const targetEmissive = hovered ? 0.7 : 0.2;
      mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.1;
    }
  });

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
    document.body.style.cursor = "auto";
  };

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[2, 1.2, 0.05]} />
        <meshStandardMaterial
          color={data.color}
          emissive={new Color(data.color)}
          emissiveIntensity={0.2}
          metalness={0.4}
          roughness={0.3}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Border outline */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[2.04, 1.24, 0.01]} />
        <meshBasicMaterial color={data.color} transparent opacity={0.3} />
      </mesh>

      {/* Label */}
      <Html
        center
        position={[0, 0, 0.04]}
        style={{
          pointerEvents: "none",
          width: "180px",
          textAlign: "center",
          userSelect: "none",
        }}
        transform={false}
      >
        <div className="flex flex-col items-center gap-1.5 px-2">
          <div className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur flex items-center justify-center border border-white/10 text-white">
            {data.icon}
          </div>
          <div className="text-[9px] uppercase tracking-widest text-white/70 font-mono">
            {data.badge}
          </div>
          <div className="text-xs font-semibold text-white leading-tight line-clamp-1">
            {data.title}
          </div>
        </div>
      </Html>
    </group>
  );
}

export default GalleryItem;
