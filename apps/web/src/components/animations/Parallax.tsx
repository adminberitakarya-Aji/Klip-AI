"use client";

import { useRef, type ReactNode, type HTMLAttributes } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ParallaxProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({
  children,
  speed = 0.5,
  className = "",
  ...props
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.to(ref.current!, {
        yPercent: (1 - speed) * 100,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [speed]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{ willChange: "transform", ...props.style }}
      {...props}
    >
      {children as any}
    </div>
  );
}

interface ParallaxItemProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxItem({
  children,
  speed = 0.5,
  className = "",
  ...props
}: ParallaxItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.to(ref.current!, {
        yPercent: (1 - speed) * 100,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    }, ref);

    return () => ctx.revert();
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ willChange: "transform", ...props.style }}
      {...props}
    >
      {children as any}
    </div>
  );
}
