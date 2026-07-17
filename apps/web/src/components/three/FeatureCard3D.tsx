"use client";

import { useRef, useState, type ReactElement } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Group, Mesh, MeshStandardMaterial, Color } from "three";
import { Html } from "@react-three/drei";

interface FeatureCard3DProps {
  position: [number, number, number];
  color: string;
  emissive?: string;
  title: string;
  badge: string;
  icon: ReactElement;
  delay?: number;
}

/**
 * FeatureCard3D — a 3D tile representing one feature in the features section.
 * Floats gently, tilts on hover, and projects a 2D HTML label (icon + title).
 * Designed to live inside a CanvasProvider alongside the existing features grid.
 */
export function FeatureCard3D({
  position,
  color,
  emissive = "#000000",
  title,
  badge,
  icon,
  delay = 0,
}: FeatureCard3DProps) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime() + delay;

    // gentle float
    groupRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.15;

    // hover tilt
    const targetRotX = hovered ? -0.15 : Math.sin(t * 0.4) * 0.05;
    const targetRotZ = hovered ? 0.1 : Math.cos(t * 0.3) * 0.03;
    groupRef.current.rotation.x +=
      (targetRotX - groupRef.current.rotation.x) * 0.1;
    groupRef.current.rotation.z +=
      (targetRotZ - groupRef.current.rotation.z) * 0.1;

    if (meshRef.current) {
      const mat = meshRef.current.material as MeshStandardMaterial;
      const targetEmissiveIntensity = hovered ? 0.8 : 0.3;
      mat.emissiveIntensity +=
        (targetEmissiveIntensity - mat.emissiveIntensity) * 0.1;
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
    <group ref={groupRef} position={position}>
      {/* Card body */}
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[1.6, 2.2, 0.1]} />
        <meshStandardMaterial
          color={color}
          emissive={new Color(emissive)}
          emissiveIntensity={0.3}
          metalness={0.5}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Edge highlight */}
      <mesh position={[0, 0, 0.06]}>
        <boxGeometry args={[1.62, 2.22, 0.01]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>

      {/* HTML label projected onto the card */}
      <Html
        center
        position={[0, 0, 0.07]}
        style={{
          pointerEvents: "none",
          width: "140px",
          textAlign: "center",
          userSelect: "none",
        }}
        transform={false}
      >
        <div className="flex flex-col items-center gap-2 px-2">
          <div className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur flex items-center justify-center border border-white/10 text-white">
            {icon as any}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/60 font-mono">
            {badge}
          </div>
          <div className="text-sm font-semibold text-white leading-tight">
            {title}
          </div>
        </div>
      </Html>
    </group>
  );
}

export default FeatureCard3D;
