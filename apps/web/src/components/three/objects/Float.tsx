'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, SphereGeometry, MeshStandardMaterial } from 'three';
import { useMemo } from 'react';

interface FloatProps {
  position?: [number, number, number];
  scale?: number;
  speed?: number;
}

export function Float({ position = [0, 0, 0], scale = 1, speed = 1 }: FloatProps) {
  const groupRef = useRef<Group>(null);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = performance.now() * 0.001 * speed;
    groupRef.current.position.y = position[1] + Math.sin(t + phase) * 0.3 * scale;
    groupRef.current.rotation.y = t * 0.2 * speed;
    groupRef.current.rotation.x = Math.sin(t * 0.7 + phase) * 0.15 * scale;
  });

  const geometry = useMemo(() => new SphereGeometry(1, 32, 32), []);
  const material = useMemo(() => new MeshStandardMaterial({
    color: 0x00d4ff,
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0.6,
    emissive: 0x004466,
    emissiveIntensity: 0.3,
  }), []);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
      <mesh
        geometry={geometry}
        material={new MeshStandardMaterial({
          color: 0x00ffff,
          transparent: true,
          opacity: 0.15,
          wireframe: true,
        })}
        scale={1.15}
      />
    </group>
  );
}
