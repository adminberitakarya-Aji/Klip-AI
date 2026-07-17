'use client';

import { useRef, useEffect, type ReactNode } from 'react';
import { gsap } from 'gsap';

interface MarqueeProps {
  children: ReactNode;
  speed?: number;
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  className?: string;
}

export function Marquee({ 
  children, 
  speed = 50, 
  direction = 'left',
  pauseOnHover = true,
  className = ''
}: MarqueeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;

    const container = containerRef.current;
    const content = contentRef.current;

    // Clone content for seamless loop
    const clone = content.cloneNode(true) as HTMLDivElement;
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.left = '100%';
    clone.setAttribute('aria-hidden', 'true');
    container.appendChild(clone);

    const contentWidth = content.offsetWidth;
    const duration = contentWidth / speed;

    const animate = () => {
      const startX = direction === 'left' ? 0 : -contentWidth;
      const endX = direction === 'left' ? -contentWidth : 0;

      animationRef.current = gsap.fromTo(content,
        { x: startX },
        {
          x: endX,
          duration,
          ease: 'none',
          repeat: -1,
          onRepeat: () => {
            gsap.set(content, { x: startX });
          },
        }
      );

      animationRef.current = gsap.fromTo(clone,
        { x: startX + contentWidth },
        {
          x: endX + contentWidth,
          duration,
          ease: 'none',
          repeat: -1,
          onRepeat: () => {
            gsap.set(clone, { x: startX + contentWidth });
          },
        }
      );
    };

    animate();

    // Pause on hover
    if (pauseOnHover) {
      container.addEventListener('mouseenter', () => {
        animationRef.current?.pause();
      });
      container.addEventListener('mouseleave', () => {
        animationRef.current?.resume();
      });
    }

    return () => {
      animationRef.current?.kill();
      clone.remove();
      container.removeEventListener('mouseenter', () => {});
      container.removeEventListener('mouseleave', () => {});
    };
  }, [children, speed, direction, pauseOnHover]);

  return (
    <div 
      ref={containerRef} 
      className={`overflow-hidden relative ${className}`}
      style={{ width: '100%' }}
    >
      <div 
        ref={contentRef} 
        className="flex whitespace-nowrap"
        style={{ display: 'flex', willChange: 'transform' }}
      >
        {children}
      </div>
    </div>
  );
}

interface MarqueeItemProps {
  children: ReactNode;
  className?: string;
}

export function MarqueeItem({ children, className = '' }: MarqueeItemProps) {
  return (
    <div className={`flex-shrink-0 ${className}`}>
      {children}
    </div>
  );
}
