"use client";

import { Nav } from "@/components/Nav";
import { Hero } from "@/components/hero";
import { Filmstrip } from "@/components/Filmstrip";
import { Features } from "@/components/features";
import { WhyKlip } from "@/components/WhyKlip";
import { Gallery } from "@/components/gallery";
import { Testimonials } from "@/components/Testimonials";
import { Pricing } from "@/components/Pricing";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-black text-white">
        <Hero />
        <Filmstrip />
        <Features />
        <WhyKlip />
        <Gallery />
        <Testimonials />
        <Pricing />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
