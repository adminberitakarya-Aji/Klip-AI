"use client";

import dynamic from "next/dynamic";
import { Nav } from "@/components/Nav";
import { Filmstrip } from "@/components/Filmstrip";
import { Features } from "@/components/features";
import { Testimonials } from "@/components/Testimonials";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";
import { CursorSpotlight } from "@/components/CursorSpotlight";
import { HowItWorks } from "@/components/HowItWorks";

// Dynamic imports for heavy client components
const Hero = dynamic(
  () => import("@/components/hero").then((mod) => mod.Hero),
  { ssr: false },
);
const Gallery = dynamic(
  () => import("@/components/gallery").then((mod) => mod.Gallery),
  { ssr: false },
);
const Pricing = dynamic(
  () => import("@/components/Pricing").then((mod) => mod.Pricing),
  { ssr: false },
);

export default function HomePage() {
  return (
    <>
      {/* Global cursor spotlight (desktop only) */}
      <CursorSpotlight />

      <Nav />
      <main className="min-h-screen bg-black text-white">
        <Hero />
        <Filmstrip />
        <Features />
        <HowItWorks />
        <Gallery />
        <Testimonials />
        <Pricing />
        <CTA />
        <Footer />
      </main>
    </>
  );
}
