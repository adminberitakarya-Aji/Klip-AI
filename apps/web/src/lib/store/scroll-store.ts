import { create } from "zustand";

interface ScrollState {
  scrollY: number;
  scrollDirection: "up" | "down" | null;
  isScrolling: boolean;
  lenis: unknown;
  setScrollY: (y: number) => void;
  setScrollDirection: (direction: "up" | "down" | null) => void;
  setIsScrolling: (isScrolling: boolean) => void;
  setLenis: (lenis: unknown) => void;
}

export const useScrollStore = create<ScrollState>((set) => ({
  scrollY: 0,
  scrollDirection: null,
  isScrolling: false,
  lenis: null,
  setScrollY: (y) =>
    set((s) => ({
      scrollY: y,
      scrollDirection:
        y > s.scrollY ? "down" : y < s.scrollY ? "up" : s.scrollDirection,
    })),
  setScrollDirection: (direction) => set({ scrollDirection: direction }),
  setIsScrolling: (isScrolling) => set({ isScrolling }),
  setLenis: (lenis) => set({ lenis }),
}));
