import type {
  ConnectionState,
  ExtensionRegistryEntry,
  MCPExtensionInfo,
  ToolDefinition,
  ManagedExtensionStatus,
<<<<<<< HEAD
  AuthState,
=======
  SystemInfo,
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417
} from '@shared/types/index.js';
import type { ParsedFilePickerResult } from '@shared/types/parsedfile-tyeps.js';
// Import new types for remote integrations
import type {
  PipedreamAppMetadata,
  PersistedRemoteIntegrationConfig,
  RuntimeRemoteIntegrationDetails,
  PipedreamAppDiscoveryResult
} from '@shared/types/remote-integration.js';

declare global {
  interface Window {
    // Define the 'api' object exposed by the preload script
    // Ensure ConnectionState here refers to the imported shared type
    api: {
      // WebSocket Connection State
      getConnectionState: () => Promise<ConnectionState>;
      onConnectionStateUpdate: (
        callback: (state: ConnectionState) => void
      ) => () => void;

      // System Information
      getSystemInfo: () => Promise<SystemInfo>;

      // Extension Discovery & Status (NEW)
      discoverLoadExtensions: () => Promise<{
        managed: MCPExtensionInfo[];
        discoverable: ExtensionRegistryEntry[];
      }>;
      getManagedExtensions: () => Promise<MCPExtensionInfo[]>; // Replaces discoverInstalledExtensions
      getDiscoverableExtensions: () => Promise<ExtensionRegistryEntry[]>; // Replaces discoverAvailableExtensions
      getManagedStatuses: () => Promise<Record<string, ManagedExtensionStatus>>;

      // Extension Management (Install/Uninstall)
      installExtension: (extensionId: string) => Promise<{
        success: boolean;
        error?: string;
        managed?: MCPExtensionInfo[];
        discoverable?: ExtensionRegistryEntry[];
        statuses?: Record<string, ManagedExtensionStatus>;
      }>;
      uninstallExtension: (extensionId: string) => Promise<{
        success: boolean;
        error?: string;
        managed?: MCPExtensionInfo[];
        discoverable?: ExtensionRegistryEntry[];
        statuses?: Record<string, ManagedExtensionStatus>;
      }>;

      // Extension Connection & State
      enableExtension: (extensionId: string) => Promise<{
        success: boolean;
        error?: string;
        statuses?: Record<string, ManagedExtensionStatus>;
        requiresConfiguration?: boolean;
        missingKeys?: string[];
      }>;
      disableExtension: (extensionId: string) => Promise<{
        success: boolean;
        error?: string;
        statuses?: Record<string, ManagedExtensionStatus>;
      }>;
      reconnectExtension: (extensionId: string) => Promise<{
        success: boolean;
        error?: string;
        connected?: MCPExtensionInfo[];
        requiresConfiguration?: boolean;
        missingKeys?: string[];
      }>;

      // Extension/Tool Info Getters
      getActiveConnectionsInfo: () => Promise<MCPExtensionInfo[]>;
      getAllActiveTools: () => Promise<ToolDefinition[]>;

      // Tool Updates Listener
      onToolsUpdate: (
        callback: (tools: ToolDefinition[]) => void
      ) => () => void;

      // Extension Configuration UI
      openExtensionConfig: (
        extensionId: string
      ) => Promise<{ success: boolean; error?: string }>;

      // --- ADD THIS TYPE DEFINITION ---
      onExtensionConfigRequired: (
        callback: (payload: {
          extensionId: string;
          missingKeys: string[];
        }) => void
      ) => () => void;
      // --------------------------------

      // --- ADD PRELOAD PATH GETTER ---
      getConfigPreloadPath: () => Promise<string>;
      // -------------------------------

      // --- ADD FILE PICKER ---
      openFilePicker: () => Promise<ParsedFilePickerResult>;
      // -------------------------------

      // Add the new method
      handleFiles: (files: File[]) => Promise<ParsedFilePickerResult>;

      // Auth methods
      getAuthState: () => Promise<AuthState>;
      logout: () => Promise<AuthState>;
      openExternal: (type: 'signin' | 'signup', provider?: string) => Promise<void>;
      onAuthStateChanged: (callback: (state: AuthState) => void) => () => void;
    };

    // Define the 'remoteIntegrations' object exposed by the preload script
    remoteIntegrations: {
      discoverPipedreamApps: (searchTerm?: string, pageToFetch?: number, category?: string) => Promise<PipedreamAppDiscoveryResult>;
      addConfigured: (appMetadata: PipedreamAppMetadata) => Promise<PersistedRemoteIntegrationConfig>;
      getConfiguredList: () => Promise<PersistedRemoteIntegrationConfig[]>;
      getConfiguredDetails: (nameSlug: string) => Promise<PersistedRemoteIntegrationConfig | undefined>;
      enable: (nameSlug: string, userId: string) => Promise<void>;
      disable: (nameSlug: string) => Promise<void>;
      removeConfigured: (nameSlug: string) => Promise<void>;
      connect: (nameSlug: string, userId: string) => Promise<void>;
      disconnect: (nameSlug: string) => Promise<void>;
      getConnectedInfo: () => Promise<RuntimeRemoteIntegrationDetails[]>;
      
      // NEW: Method to initialize all enabled integrations post-login
      initializeAllEnabled: (userId: string) => Promise<void>;

      // NEW: Method to reconnect a specific integration
      reconnect: (nameSlug: string, userId: string) => Promise<void>;

      // Listeners
      onConfiguredListUpdated: (
        callback: (integrations: PersistedRemoteIntegrationConfig[]) => void
      ) => () => void;
      onConnectionStatusUpdated: (
        callback: (status: {
          nameSlug: string;
          connected: boolean;
          error?: string;
          details?: RuntimeRemoteIntegrationDetails;
        }) => void
      ) => () => void;
      // Note: onToolsUpdated is already part of the 'api' interface
    };

    // Keep existing electron definition if present
    electron?: {
      ipcRenderer: Electron.IpcRenderer;
      // Add other electronAPI methods if needed
    };
  }
}

// Export {}; // Add this line if you get an error about global scope modification
export {}; // Ensure this file is treated as a module
