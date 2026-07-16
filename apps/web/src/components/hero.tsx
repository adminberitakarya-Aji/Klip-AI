'use client';

import { Button } from '@klipai/ui/components/button';
import { ArrowRight, Sparkles, Zap, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

function HeroParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 2000;

  useEffect(() => {
    if (!pointsRef.current) return;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const radius = 5 + Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const color = new THREE.Color();
      color.setHSL(0.7 + Math.random() * 0.3, 0.8, 0.5 + Math.random() * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 2 + 0.5;
    }

    const geometry = pointsRef.current.geometry;
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  }, [count]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry />
      <pointsMaterial 
        vertexColors 
        sizeAttenuation 
        transparent 
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function HeroContent() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.hero-title', 
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );
      gsap.fromTo('.hero-subtitle', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.2, ease: 'power3.out' }
      );
      gsap.fromTo('.hero-cta', 
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, delay: 0.4, ease: 'power3.out' }
      );
      gsap.fromTo('.hero-badge', 
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.8, delay: 0.6, ease: 'back.out(1.7)' }
      );
    }, scrollRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden" ref={scrollRef}>
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-neutral-950 to-black" />
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <Canvas 
          className="absolute inset-0 pointer-events-none" 
          camera={{ position: [0, 0, 5], fov: 50 }}
        >
          <color attach="background" args={['#000000']} />
          <Stars radius={100} depth={50} factor={200} />
          <Environment 
            preset="city" 
            background={false} 
            resolution={256}
          />
          <HeroParticles />
        </Canvas>
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        {/* Badge */}
        <motion.div 
          className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6, ease: 'back.out(1.7)' }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
          </span>
          <span className="text-sm font-medium text-purple-300">New: Motion Control & 4K Output</span>
        </motion.div>

        {/* Title */}
        <motion.h1 
          className="hero-title text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.05] mb-6"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'power3.out' }}
        >
          <span className="block">Generate</span>
          <span className="block bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
            Cinematic AI Videos
          </span>
          <span className="block">in Seconds</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          className="hero-subtitle text-lg sm:text-xl lg:text-2xl text-neutral-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: 'power3.out' }}
        >
          Transform text, images, and videos into stunning cinematic content using 
          <span className="text-white font-medium">state-of-the-art generative AI models</span>.
          Text-to-video, image-to-video, video-to-video, and motion control—all in one platform.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: 'power3.out' }}
        >
          <Button 
            size="lg" 
            className="group gap-2 px-8 py-4 text-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 shadow-lg shadow-purple-600/25 transition-all duration-300"
            asChild
          >
            <a href="/generate" className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Start Creating Free
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
          <Button 
            size="lg" 
            variant="outline" 
            className="gap-2 px-8 py-4 text-lg border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
            asChild
          >
            <a href="/gallery" className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              View Gallery
            </a>
          </Button>
        </motion.div>

        {/* Features Row */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6, ease: 'power3.out' }}
        >
          <FeatureItem icon={Zap} title="Text to Video" desc="Generate from prompts" />
          <FeatureItem icon={Layers} title="Image to Video" desc="Animate your images" />
          <FeatureItem icon={ArrowRight} title="Video to Video" desc="Transform footage" />
          <FeatureItem icon={Sparkles} title="Motion Control" desc="Precise camera paths" />
        </motion.div>

        {/* Trust Indicators */}
        <motion.div 
          className="mt-16 flex flex-wrap items-center justify-center gap-8 text-neutral-500 text-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: 'power3.out' }}
        >
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            No credit card required
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            30 free credits/month
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Commercial use allowed
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Cancel anytime
          </span>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-neutral-500"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </motion.div>
    </section>
  );
}

function FeatureItem({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300">
      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
        <Icon className="h-6 w-6 text-purple-400" />
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="text-sm text-neutral-500">{desc}</p>
    </div>
  );
}

export function Hero() {
  return <HeroContent />;
}