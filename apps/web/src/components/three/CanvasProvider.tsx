'use client';

import { Canvas } from '@react-three/fiber';
import { ReactNode } from 'react';

interface CanvasProviderProps {
  children: ReactNode;
  className?: string;
  camera?: { position: [number, number, number]; fov?: number };
}

export function CanvasProvider({ 
  children, 
  className = '',
  camera = { position: [0, 0, 5], fov: 50 }
}: CanvasProviderProps) {
  return (
    <Canvas
      className={className}
      camera={camera}
      gl={{ 
        antialias: true, 
        alpha: true,
        preserveDrawingBuffer: true,
      }}
      shadows={true}
    >
      <color attach="background" args={['#000000']} />
      {children}
    </Canvas>
  );
}
