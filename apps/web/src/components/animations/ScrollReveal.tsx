"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  useRef,
  type ReactNode,
  type HTMLAttributes,
  forwardRef,
  useImperativeHandle,
} from "react";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
}

export const ScrollReveal = forwardRef<HTMLDivElement, ScrollRevealProps>(
  ({ children, delay = 0, className = "", ...props }, forwardedRef) => {
    const ref = useRef<HTMLDivElement>(null);

    useImperativeHandle(forwardedRef, () => ref.current!);

    useGSAP(
      () => {
        if (!ref.current) return;
        const ctx = gsap.context(() => {
          gsap.fromTo(
            ref.current!,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              delay: delay / 1000,
              ease: "power3.out",
              scrollTrigger: {
                trigger: ref.current,
                start: "top 85%",
                end: "bottom 20%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }, ref);
        return () => ctx.revert();
      },
      { scope: ref },
    );

    return (
      <div ref={ref} className={className} {...props}>
        {children}
      </div>
    );
  },
);

ScrollReveal.displayName = "ScrollReveal";
