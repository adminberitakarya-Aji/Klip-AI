'use client';

import { Hero } from '@/components/hero';
import { Features } from '@/components/features';
import { Gallery } from '@/components/gallery';
import { CTA } from '@/components/cta';
import { Footer } from '@/components/footer';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Hero />
      <Features />
      <Gallery />
      <CTA />
      <Footer />
    </main>
  );
}