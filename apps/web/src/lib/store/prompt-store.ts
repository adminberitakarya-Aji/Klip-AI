import { create } from 'zustand';

interface PromptState {
  currentPrompt: string;
  history: string[];
  suggestions: string[];
  setCurrentPrompt: (prompt: string) => void;
  addToHistory: (prompt: string) => void;
  setSuggestions: (suggestions: string[]) => void;
  clearHistory: () => void;
}

export const usePromptStore = create<PromptState>((set) => ({
  currentPrompt: '',
  history: [],
  suggestions: [
    'Iklan skincare cinematic',
    'Reels promo diskon',
    'Vlog Bali',
    'Product shot UMKM',
    'Tutorial makeup aesthetic',
    'Travel vlog Jepang',
    'Unboxing gadget terbaru',
    'Motivasi pagi hari',
  ],
  setCurrentPrompt: (prompt) => set({ currentPrompt: prompt }),
  addToHistory: (prompt) => set((s) => ({
    history: [prompt, ...s.history.filter((p) => p !== prompt)].slice(0, 10),
  })),
  setSuggestions: (suggestions) => set({ suggestions }),
  clearHistory: () => set({ history: [] }),
}));