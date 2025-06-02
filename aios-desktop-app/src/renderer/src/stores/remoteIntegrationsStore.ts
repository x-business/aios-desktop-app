import { create } from 'zustand';
import type { PersistedRemoteIntegrationConfig } from '@shared/types/remote-integration';

interface RemoteIntegrationsState {
  configuredIntegrations: PersistedRemoteIntegrationConfig[];
  isLoading: boolean;
  error: string | null;
  fetchConfiguredIntegrations: () => Promise<void>;
  _cleanupListener: (() => void) | null;
}

export const useRemoteIntegrationsStore = create<RemoteIntegrationsState>((set, get) => ({
  configuredIntegrations: [],
  isLoading: false,
  error: null,
  _cleanupListener: null,

  fetchConfiguredIntegrations: async () => {
    if (get().isLoading) {
      console.log('Remote integrations store: Already fetching, skipping duplicate request.');
      return;
    }
    
    console.log('Remote integrations store: Starting fetch of configured integrations...');
    set({ isLoading: true, error: null });
    
    try {
      // Ensure window.remoteIntegrations is available before calling
      if (typeof window !== 'undefined' && window.remoteIntegrations) {
        console.log('Remote integrations store: Window API available, making request...');
        const configs = await window.remoteIntegrations.getConfiguredList();
        console.log('Remote integrations store: Fetch successful, found', configs.length, 'integrations.');
        set({ configuredIntegrations: configs, isLoading: false });
      } else {
        console.warn('Remote integrations store: window.remoteIntegrations not available at fetch time. Skipping fetch.');
        set({ isLoading: false, error: 'Remote integrations API not available.' });
      }
    } catch (err: any) {
      console.error('Remote integrations store: Error fetching configured integrations:', err);
      set({ error: err.message || 'Failed to fetch configured integrations.', isLoading: false });
    }
  },
}));

let storeInitialized = false;

// This function should be called once from your main application component (e.g., App.tsx)
export const initializeAndListenRemoteIntegrations = () => {
  if (storeInitialized || typeof window === 'undefined' || !window.remoteIntegrations) {
    if (typeof window !== 'undefined' && !window.remoteIntegrations) {
        console.warn('window.remoteIntegrations not available. Store listener not attached.');
    }
    return;
  }
  storeInitialized = true;

  const store = useRemoteIntegrationsStore.getState();
  store.fetchConfiguredIntegrations(); // Initial fetch

  // Clean up any existing listener before attaching a new one
  if (store._cleanupListener) {
    store._cleanupListener();
  }

  const cleanup = window.remoteIntegrations.onConfiguredListUpdated((updatedIntegrations) => {
    console.log('Zustand Store: Configured list updated via IPC', updatedIntegrations);
    useRemoteIntegrationsStore.setState({ 
      configuredIntegrations: updatedIntegrations, 
      isLoading: false, 
      error: null 
    });
  });
  useRemoteIntegrationsStore.setState({ _cleanupListener: cleanup });
  
  console.log('RemoteIntegrationsStore initialized and listener attached.');
};

// Note: You might want to handle the cleanup of the IPC listener more robustly,
// e.g., when the application is about to close, if possible.
// For many desktop apps, this might be implicitly handled by the main process closing. 