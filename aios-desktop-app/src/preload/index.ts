<<<<<<< HEAD
/// <reference types="./index.d.ts" />
import { contextBridge, ipcRenderer } from "electron";
import { electronAPI } from "@electron-toolkit/preload";
=======
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417
// Import types using relative path WITH .js extension
import type {
  ConnectionState,
  MCPExtensionInfo,
  ToolDefinition, // Use ToolDefinition
  ExtensionRegistryEntry, // Import the type
  ManagedExtensionStatus,
<<<<<<< HEAD
} from "@shared/types/index.js"; // Use .js extension
import { AuthState } from "../shared/types/auth-types.js";
import { ParsedFilePickerResult } from "@/shared/types/parsedfile-tyeps.js";
=======
  SystemInfo, // Import SystemInfo type
} from '@shared/types/index.js'; // Use .js extension
import { ParsedFilePickerResult } from '@/shared/types/parsedfile-tyeps.js';
// Added imports for remote integration types using relative paths
import type { PersistedRemoteIntegrationConfig, RuntimeRemoteIntegrationDetails, PipedreamAppMetadata, PipedreamAppDiscoveryResult } from '../shared/types/remote-integration.js';
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417

// Custom APIs for renderer
// Type safety relies on the global declaration in index.d.ts
const customApi = {
  // Explicitly type customApi with the updated interface
  // --- WebSocket Connection --- //
  getConnectionState: (): Promise<ConnectionState> =>
    ipcRenderer.invoke("get-connection-state"),

  onConnectionStateUpdate: (callback: (state: ConnectionState) => void) => {
    const handler = (
      _event: IpcRendererEvent,
      state: ConnectionState
    ) => callback(state);
    ipcRenderer.on("connection-state-update", handler);
    return () => {
      ipcRenderer.removeListener("connection-state-update", handler);
    };
  },

  // --- System Information --- //
  getSystemInfo: (): Promise<SystemInfo> =>
    ipcRenderer.invoke('system:get-info'),

  // --- Extension Discovery & Status --- //
  discoverLoadExtensions: (): Promise<{
    managed: MCPExtensionInfo[];
    discoverable: ExtensionRegistryEntry[];
  }> => ipcRenderer.invoke("discover-load-extensions"),

  getManagedExtensions: (): Promise<MCPExtensionInfo[]> =>
    ipcRenderer.invoke("get-managed-extensions"),

  getDiscoverableExtensions: (): Promise<ExtensionRegistryEntry[]> =>
    ipcRenderer.invoke("get-discoverable-extensions"),

  getManagedStatuses: (): Promise<
    Record<string, { id: string; version: string; enabled: boolean }>
  > => ipcRenderer.invoke("get-managed-statuses"),

  // --- Extension Management --- //
  installExtension: (
    extensionId: string
  ): Promise<{
    success: boolean;
    error?: string;
    managed?: MCPExtensionInfo[];
    discoverable?: ExtensionRegistryEntry[];
    statuses?: Record<string, ManagedExtensionStatus>; // Use specific type for statuses
  }> => ipcRenderer.invoke("install-extension", extensionId),

  uninstallExtension: (
    extensionId: string
  ): Promise<{
    success: boolean;
    error?: string;
    managed?: MCPExtensionInfo[];
    discoverable?: ExtensionRegistryEntry[];
    statuses?: Record<string, ManagedExtensionStatus>; // Use specific type for statuses
  }> => ipcRenderer.invoke("uninstall-extension", extensionId),

  // --- Extension Connection & State --- //
  enableExtension: (
    extensionId: string
  ): Promise<{
    success: boolean;
    error?: string;
    statuses?: Record<string, ManagedExtensionStatus>;
    requiresConfiguration?: boolean;
    missingKeys?: string[];
  }> => ipcRenderer.invoke("enable-extension", extensionId),

  disableExtension: (
    extensionId: string
  ): Promise<{
    success: boolean;
    error?: string;
    statuses?: Record<string, ManagedExtensionStatus>;
  }> => ipcRenderer.invoke("disable-extension", extensionId),

  // REMOVE connect/disconnect if unused
  // connectExtension: (extensionId: string): Promise<{ success: boolean; error?: string; connected?: MCPExtensionInfo[]; }> =>
  //   ipcRenderer.invoke('connect-extension', extensionId),
  // disconnectExtension: (extensionId: string): Promise<{ success: boolean; error?: string; connected?: MCPExtensionInfo[]; }> =>
  //   ipcRenderer.invoke('disconnect-extension', extensionId),

  // Add requiresConfiguration fields based on IPC handler logic
  reconnectExtension: (
    extensionId: string
  ): Promise<{
    success: boolean;
    error?: string;
    connected?: MCPExtensionInfo[]; // Keep connected for now, maybe remove later if unused
    requiresConfiguration?: boolean;
    missingKeys?: string[];
  }> => ipcRenderer.invoke("reconnect-extension", extensionId),

  // --- Extension/Tool Info Getters --- //
  getActiveConnectionsInfo: (): Promise<MCPExtensionInfo[]> =>
    ipcRenderer.invoke("get-active-connections-info"),

  // This now expects ToolDefinition[] from main process
  getAllActiveTools: (): Promise<ToolDefinition[]> =>
    ipcRenderer.invoke("get-all-active-tools"),

  // --- Tool Updates Listener --- //
  // Callback will receive ToolDefinition[] from main process
  onToolsUpdate: (callback: (tools: ToolDefinition[]) => void) => {
    const handler = (
      _event: IpcRendererEvent,
      tools: ToolDefinition[]
    ) => callback(tools);
    ipcRenderer.on("tools-updated", handler);
    return () => {
      ipcRenderer.removeListener("tools-updated", handler);
    };
  },

  // --- Extension Configuration UI --- //
  openExtensionConfig: (
    extensionId: string
  ): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke("extensions:openConfig", extensionId),

  // --- ADD THIS FOR CONFIG REQUIRED EVENT ---
  onExtensionConfigRequired: (
    callback: (payload: { extensionId: string; missingKeys: string[] }) => void
  ): (() => void) => {
    const listener = (
      _event: IpcRendererEvent,
      payload: { extensionId: string; missingKeys: string[] }
    ) => callback(payload);
    ipcRenderer.on("mcp-extension-config-required", listener);
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener("mcp-extension-config-required", listener);
    };
  },
  // -----------------------------------------

  // --- Config Preload Path Getter --- //
  getConfigPreloadPath: (): Promise<string> =>
    ipcRenderer.invoke("get-config-preload-path"),

  // --- File Picker --- //
  openFilePicker: (): Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }> => ipcRenderer.invoke("open-file-picker"),

  // Add new method to handle File objects directly
  handleFiles: async (files: File[]): Promise<ParsedFilePickerResult> => {
    const serializedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type,
        data: await file
          .arrayBuffer()
          .then((buffer) => Buffer.from(buffer).toString("base64")),
      }))
    );
    return ipcRenderer.invoke("handle-files", serializedFiles);
  },

  // Add auth methods
  getAuthState: (): Promise<AuthState> => ipcRenderer.invoke("auth:getState"),

  logout: (): Promise<AuthState> => ipcRenderer.invoke("auth:logout"),

  openExternal: (type: "signin" | "signup"): Promise<void> =>
    ipcRenderer.invoke("auth:openExternal", type),

  onAuthStateChanged: (callback: (state: AuthState) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, state: AuthState) =>
      callback(state);
    ipcRenderer.on("auth-state-changed", handler);
    return () => {
      ipcRenderer.removeListener("auth-state-changed", handler);
    };
  },
};

// Define the Remote Integration API object
const remoteIntegrationsApi = {
  discoverPipedreamApps: (searchTerm?: string, pageToFetch?: number, category?: string): Promise<PipedreamAppDiscoveryResult> => ipcRenderer.invoke('remote-integrations:discover-pipedream-apps', searchTerm, pageToFetch, category),
  addConfigured: (appMetadata: PipedreamAppMetadata): Promise<PersistedRemoteIntegrationConfig> => ipcRenderer.invoke('remote-integrations:add-configured', appMetadata),
  getConfiguredList: (): Promise<PersistedRemoteIntegrationConfig[]> => ipcRenderer.invoke('remote-integrations:get-configured-list'),
  getConfiguredDetails: (nameSlug: string): Promise<PersistedRemoteIntegrationConfig | undefined> => ipcRenderer.invoke('remote-integrations:get-configured-details', nameSlug),
  enable: (nameSlug: string, userId: string): Promise<void> => ipcRenderer.invoke('remote-integrations:enable', nameSlug, userId),
  disable: (nameSlug: string): Promise<void> => ipcRenderer.invoke('remote-integrations:disable', nameSlug),
  removeConfigured: (nameSlug: string): Promise<void> => ipcRenderer.invoke('remote-integrations:remove-configured', nameSlug),
  connect: (nameSlug: string, userId: string): Promise<void> => ipcRenderer.invoke('remote-integrations:connect', nameSlug, userId),
  disconnect: (nameSlug: string): Promise<void> => ipcRenderer.invoke('remote-integrations:disconnect', nameSlug),
  getConnectedInfo: (): Promise<RuntimeRemoteIntegrationDetails[]> => ipcRenderer.invoke('remote-integrations:get-connected-info'),
  
  // NEW: Method to initialize all enabled integrations post-login
  initializeAllEnabled: (userId: string): Promise<void> => ipcRenderer.invoke('remote-integrations:initialize-all-enabled', userId),

  // NEW: Method to reconnect a specific integration
  reconnect: (nameSlug: string, userId: string): Promise<void> => ipcRenderer.invoke('remote-integrations:reconnect', nameSlug, userId),

  // Corrected listener implementations
  onConfiguredListUpdated: (callback: (integrations: PersistedRemoteIntegrationConfig[]) => void) => {
    const handler = (
      _event: IpcRendererEvent, 
      integrationsArray: PersistedRemoteIntegrationConfig[]
    ) => {
      callback(integrationsArray);
    };
    ipcRenderer.on('remote-integrations:configured-list-updated', handler);
    return () => {
      ipcRenderer.removeListener('remote-integrations:configured-list-updated', handler);
    };
  },
  onConnectionStatusUpdated: (callback: (status: { nameSlug: string; connected: boolean; error?: string; details?: RuntimeRemoteIntegrationDetails }) => void) => {
    const handler = (
      _event: IpcRendererEvent, 
      status: { nameSlug: string; connected: boolean; error?: string; details?: RuntimeRemoteIntegrationDetails }
    ) => {
      callback(status);
    };
    ipcRenderer.on('remote-integrations:connection-status-updated', handler);
    return () => {
      ipcRenderer.removeListener('remote-integrations:connection-status-updated', handler);
    };
  }
  // Note: 'tools-updated' is already exposed via the 'customApi' (window.api) and is now global.
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
<<<<<<< HEAD
    contextBridge.exposeInMainWorld("electron", electronAPI);
    contextBridge.exposeInMainWorld("api", customApi);
=======
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', customApi);
    contextBridge.exposeInMainWorld('remoteIntegrations', remoteIntegrationsApi); // Use the new constant here
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI;
  // @ts-ignore (define in dts)
  window.api = customApi;
  // @ts-ignore (define in dts)
  window.remoteIntegrations = remoteIntegrationsApi; // Use the new constant here
}
