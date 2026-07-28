"use client";

import { type ReactNode, type HTMLAttributes } from "react";

interface MarqueeProps {
  children: ReactNode;
  className?: string;
  direction?: "left" | "right";
  speed?: number;
}

/**
 * Marquee — infinitely-scrolling horizontal track.
 * Renders children twice side-by-side so the loop is seamless.
 */
export function Marquee({
  children,
  className = "",
  direction = "left",
  speed = 40,
}: MarqueeProps) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <div
        className="flex gap-8 min-w-full"
        style={{
          animation: `marquee-x ${speed}s linear infinite`,
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}

/**
 * MarqueeItem — single item inside a Marquee. Use as a thin wrapper
 * for consistent spacing & flex-shrink behaviour.
 */
export function MarqueeItem({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex-shrink-0 ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Marquee;
