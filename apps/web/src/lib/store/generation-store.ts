import { create } from 'zustand';
import { GenerationType } from '@klipai/core/types';

type GenerationStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';

interface GenerationItem {
  id: string;
  prompt: string;
  type: GenerationType;
  status: GenerationStatus;
  progress: number;
  resultUrl?: string;
  error?: string;
  createdAt: number;
}

interface GenerationState {
  queue: GenerationItem[];
  currentGeneration: GenerationItem | null;
  addToQueue: (item: Omit<GenerationItem, 'id' | 'createdAt'>) => string;
  updateStatus: (id: string, status: GenerationStatus, progress?: number) => void;
  setResult: (id: string, url: string) => void;
  setError: (id: string, error: string) => void;
  removeFromQueue: (id: string) => void;
  clearCompleted: () => void;
  setCurrentGeneration: (item: GenerationItem | null) => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  queue: [],
  currentGeneration: null,
  addToQueue: (item) => {
    const id = crypto.randomUUID();
    const newItem: GenerationItem = { ...item, id, createdAt: Date.now() };
    set((s) => ({ queue: [...s.queue, newItem], currentGeneration: newItem }));
    return id;
  },
  updateStatus: (id, status, progress = 0) => set((s) => ({
    queue: s.queue.map((i) => (i.id === id ? { ...i, status, progress } : i)),
    currentGeneration: s.currentGeneration?.id === id ? { ...s.currentGeneration, status, progress } : s.currentGeneration,
  })),
  setResult: (id, url) => set((s) => ({
    queue: s.queue.map((i) => (i.id === id ? { ...i, status: 'completed', resultUrl: url, progress: 100 } : i)),
    currentGeneration: s.currentGeneration?.id === id ? { ...s.currentGeneration, status: 'completed', resultUrl: url, progress: 100 } : s.currentGeneration,
  })),
  setError: (id, error) => set((s) => ({
    queue: s.queue.map((i) => (i.id === id ? { ...i, status: 'failed', error } : i)),
    currentGeneration: s.currentGeneration?.id === id ? { ...s.currentGeneration, status: 'failed', error } : s.currentGeneration,
  })),
  removeFromQueue: (id) => set((s) => ({ queue: s.queue.filter((i) => i.id !== id) })),
  clearCompleted: () => set((s) => ({ queue: s.queue.filter((i) => i.status !== 'completed') })),
  setCurrentGeneration: (item) => set({ currentGeneration: item }),
}));