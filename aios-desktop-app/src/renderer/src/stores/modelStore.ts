import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_MODEL } from '../constants/models';

interface ModelState {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
}

export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      selectedModel: DEFAULT_MODEL, // default value
      setSelectedModel: (model: string) => set({ selectedModel: model }),
    }),
    {
      name: 'model-storage', // unique name for localStorage key
    }
  )
); 