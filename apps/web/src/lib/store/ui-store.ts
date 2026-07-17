import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  isMobileMenuOpen: boolean;
  isPromptModalOpen: boolean;
  theme: 'dark' | 'light';
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  togglePromptModal: () => void;
  setPromptModalOpen: (open: boolean) => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      isMobileMenuOpen: false,
      isPromptModalOpen: false,
      theme: 'dark',
      toggleMobileMenu: () => set((s) => ({ isMobileMenuOpen: !s.isMobileMenuOpen })),
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
      togglePromptModal: () => set((s) => ({ isPromptModalOpen: !s.isPromptModalOpen })),
      setPromptModalOpen: (open) => set({ isPromptModalOpen: open }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'klip-ui-store', partialize: (s) => ({ theme: s.theme }) }
  )
);