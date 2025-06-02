import { create } from 'zustand';
import type { ToolDefinition } from '@shared/types/index'; // Use path alias

interface ToolState {
  activeTools: ToolDefinition[]; // Use ToolDefinition[]
  isLoading: boolean;
  error: string | null;
  fetchActiveTools: () => Promise<void>;
  setActiveTools: (tools: ToolDefinition[]) => void; // Use ToolDefinition[]
  initializeListener: () => void;
  cleanupListener: () => void;
}

// Store the listener cleanup function outside the store state
let removeToolsUpdateListener: (() => void) | null = null;

export const useToolStore = create<ToolState>((set, get) => ({
  activeTools: [], // Initialize with empty ToolDefinition array
  isLoading: false,
  error: null,

  // Action to fetch the current list of tools
  fetchActiveTools: async () => {
    if (get().isLoading) return; // Prevent concurrent fetches
    set({ isLoading: true, error: null });
    console.log('[toolStore] Fetching active tools (full definitions)...');
    try {
      // Type casting isn't strictly necessary if API returns the correct type,
      // but explicit if needed:
      const tools = await window.api.getAllActiveTools() as ToolDefinition[];
      console.log('[toolStore] Fetched active tools (full definitions):', tools);
      set({ activeTools: tools, isLoading: false });
    } catch (err: any) {
      console.error('[toolStore] Error fetching active tools:', err);
      set({ error: err.message || 'Failed to fetch tools', isLoading: false });
    }
  },

  // Action to directly set the tools (used by the listener)
  setActiveTools: (tools: ToolDefinition[]) => {
     console.log('[toolStore] Setting active tools from listener (full definitions):', tools);
     set({ activeTools: tools });
  },

  // Action to initialize the IPC listener
  initializeListener: () => {
    if (removeToolsUpdateListener) {
       console.warn('[toolStore] Listener already initialized.');
       return; // Avoid setting up multiple listeners
    }
    if (window?.api?.onToolsUpdate) {
       console.log('[toolStore] Initializing tools update listener (full definitions)...');
       // Listener receives data, cast it to ToolDefinition[] before using
       removeToolsUpdateListener = window.api.onToolsUpdate((toolsFromIPC) => {
          // Cast the received data (which might be typed as SimpleToolInfo[] by the linter)
          // to the type we know the main process is actually sending.
          const tools = toolsFromIPC as ToolDefinition[];
          get().setActiveTools(tools);
       });
       console.log('[toolStore] Tools update listener initialized.');
    } else {
       console.error('[toolStore] Preload API (window.api.onToolsUpdate) not available.');
       set({ error: 'Tool update listener API not available.' });
    }
  },

  // Action to clean up the listener
  cleanupListener: () => {
     if (removeToolsUpdateListener) {
       console.log('[toolStore] Cleaning up tools update listener...');
       removeToolsUpdateListener();
       removeToolsUpdateListener = null; // Reset the stored function
       console.log('[toolStore] Tools update listener cleaned up.');
     }
  }
}));