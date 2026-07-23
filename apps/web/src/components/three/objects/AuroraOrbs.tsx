"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Mesh,
  Group,
  SphereGeometry,
  MeshStandardMaterial,
  Vector3,
} from "three";

interface AuroraOrbsProps {
  count?: number;
  radius?: number;
  speed?: number;
}

export function AuroraOrbs({
  count = 5,
  radius = 8,
  speed = 1,
}: AuroraOrbsProps) {
  const groupRef = useRef<Group>(null);

  // Use useMemo at top level to create static geometry
  const geometry = useMemo(() => new SphereGeometry(1, 16, 16), []);

  // Create orbs configuration - using useMemo for the array structure
  const orbs = useMemo(() => {
    const arr: {
      ref: React.MutableRefObject<Mesh | null>;
      phase: number;
      speed: number;
      axis: Vector3;
      color: string;
    }[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        ref: { current: null } as React.MutableRefObject<Mesh | null>,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,
        axis: new Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5,
        ).normalize(),
        color: ["#00d4ff", "#00ff88", "#ff0066", "#ffaa00", "#aa00ff"][i % 5],
      });
    }
    return arr;
  }, [count]);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() * 0.001 * speed;

    orbs.forEach((orb, i) => {
      const angle = t * orb.speed + orb.phase;
      const r = radius * (0.5 + Math.sin(t * 0.5 + i) * 0.3);

      const pos = orb.axis.clone().multiplyScalar(r);
      pos.applyAxisAngle(new Vector3(0, 1, 0), angle * 0.5);
      pos.applyAxisAngle(new Vector3(1, 0, 0), angle * 0.3);

      if (orb.ref.current) {
        orb.ref.current.position.copy(pos);
        orb.ref.current.scale.setScalar(
          0.8 + Math.sin(t * 2 + orb.phase) * 0.2,
        );
      }
    });
  });

  return (
    <group ref={groupRef}>
      {orbs.map((orb, i) => (
        <mesh
          key={i}
          ref={orb.ref}
          geometry={geometry}
          material={
            new MeshStandardMaterial({
              color: orb.color,
              transparent: true,
              opacity: 0.4,
              emissive: orb.color,
              emissiveIntensity: 0.8,
              depthWrite: false,
            })
          }
        />
      ))}
    </group>
  );
}
