"use client";

import { useEffect, useRef } from "react";

/**
 * CursorSpotlight – renders a radial gradient that follows the mouse cursor,
 * creating a premium "spotlight" effect on the dark background.
 * Attaches to the document body so it covers the entire page.
 */
export function CursorSpotlight() {
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = spotRef.current;
    if (!el) return;

    let raf: number;
    let mouseX = -9999;
    let mouseY = -9999;
    let curX = -9999;
    let curY = -9999;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const onMouseLeave = () => {
      mouseX = -9999;
      mouseY = -9999;
    };

    const animate = () => {
      // Smooth lerp so spotlight trails the cursor
      const ease = 0.1;
      curX += (mouseX - curX) * ease;
      curY += (mouseY - curY) * ease;

      el.style.transform = `translate(${curX}px, ${curY}px)`;
      raf = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseleave", onMouseLeave);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseleave", onMouseLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    // Fixed so it's always relative to the viewport
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      aria-hidden="true"
    >
      <div
        ref={spotRef}
        className="absolute"
        style={{
          // Center the gradient on the cursor
          top: "-300px",
          left: "-300px",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle at center, rgba(168,85,247,0.10) 0%, rgba(168,85,247,0.04) 40%, transparent 70%)",
          borderRadius: "50%",
          willChange: "transform",
        }}
      />
    </div>
  );
}
