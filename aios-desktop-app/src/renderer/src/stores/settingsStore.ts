import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PipedreamSettingsState {
  pipedreamUserId: string | null;
  setPipedreamUserId: (id: string | null) => void;
}

export const usePipedreamSettingsStore = create<PipedreamSettingsState>()(
  persist(
    (set) => ({
      pipedreamUserId: null, // Initialize as null
      setPipedreamUserId: (id) => set({ pipedreamUserId: id }),
    }),
    {
      name: 'pipedream-settings-storage', // Name for localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
);

interface SystemPromptState {
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
}

export const useSystemPromptStore = create<SystemPromptState>()(
  persist(
    (set) => ({
      systemPrompt: '', // Initialize as empty string
      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
    }),
    {
      name: 'system-prompt-storage', // Name for localStorage key
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
);

// Example usage (in a component):
// const { pipedreamUserId, setPipedreamUserId } = usePipedreamSettingsStore();
//
// // To set the ID:
// setPipedreamUserId('your-mock-pd-user-id');
//
// // To get the ID:
// console.log(pipedreamUserId); 