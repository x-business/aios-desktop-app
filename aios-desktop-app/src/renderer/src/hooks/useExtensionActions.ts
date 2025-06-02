import { useCallback } from 'react';
import { ExtensionStatus } from '@/components/ExtensionCard';
import type { MCPExtensionInfo, SimpleToolInfo, ExtensionRegistryEntry } from '@shared/types/index.js'; // Import necessary types

interface UseExtensionActionsProps {
  setExtensionActionState: (id: string, state: ExtensionStatus | null) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setConfiguringExtensionId?: (id: string | null) => void;
  connectedExtensionIds: Set<string>;
  setConnectedExtensionIds: (ids: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setActiveTools: (tools: SimpleToolInfo[]) => void;
  setManagedExtensions: (exts: MCPExtensionInfo[]) => void;
  setDiscoverableOnlineExtensions: (exts: ExtensionRegistryEntry[]) => void;
  setManagedStatuses: (statuses: Record<string, { id: string; version: string; enabled: boolean }>) => void;
}

export function useExtensionActions({
  setExtensionActionState,
  setError,
  clearError,
  setConfiguringExtensionId,
  setConnectedExtensionIds,
  setActiveTools,
  setManagedExtensions,
  setDiscoverableOnlineExtensions,
  setManagedStatuses,
}: UseExtensionActionsProps) {
  
  // Helper to fetch and update connection-related state
  const updateConnectionState = useCallback(async () => {
    try {
      const [connectedInfo, tools] = await Promise.all([
        window.api.getActiveConnectionsInfo(),
        window.api.getAllActiveTools()
      ]);
      setConnectedExtensionIds(new Set(connectedInfo.map(ext => ext.id)));
      setActiveTools(tools);
    } catch (err) {
      console.error("Error updating connection state:", err);
      // Decide if error should be shown to user
    }
  }, [setConnectedExtensionIds, setActiveTools]);

  // Configure an extension
  const handleConfigure = useCallback((extensionId: string) => {
    clearError();
    console.log(`[Renderer] Setting state to configure extension: ${extensionId}`);
    if (setConfiguringExtensionId) {
      setConfiguringExtensionId(extensionId);
    }
  }, [clearError, setConfiguringExtensionId]);

  // Toggle enable/disable an extension
  const handleToggleEnable = useCallback(async (extensionId: string, enable: boolean) => {
    clearError();
    const action = enable ? 'Enabling' : 'Disabling';
    const actionStatus = enable ? 'connecting' : 'disconnecting';
    setExtensionActionState(extensionId, actionStatus);
    console.log(`${action} extension ${extensionId}...`);

    try {
      const apiCall = enable ? window.api.enableExtension : window.api.disableExtension;
      const result = await apiCall(extensionId);

      if (result.success) {
        console.log(`Extension ${extensionId} ${action.toLowerCase()}d successfully.`);
        setManagedStatuses(result.statuses || {});
        setExtensionActionState(extensionId, null);
        await updateConnectionState();
      } else {
        // Handle failure case - check if we were enabling
        if (enable) {
           // Assert the type here to help TypeScript
           const enableResult = result as Awaited<ReturnType<typeof window.api.enableExtension>>;
           if (enableResult.requiresConfiguration) { // Check the asserted type
              console.warn(`Enable failed for ${extensionId} due to missing configuration.`);
              setExtensionActionState(extensionId, 'configurationRequired');
              setError(`Extension '${extensionId}' requires configuration before it can be enabled. Please configure it.`);
              if (enableResult.statuses) setManagedStatuses(enableResult.statuses);
              if (setConfiguringExtensionId) setConfiguringExtensionId(extensionId);
           } else {
              // Other enable error
              throw new Error(enableResult.error || `Failed to enable ${extensionId}.`);
           }
        } else {
           // Handle disable error (assert type for consistency)
           const disableResult = result as Awaited<ReturnType<typeof window.api.disableExtension>>;
           throw new Error(disableResult.error || `Failed to disable ${extensionId}.`);
        }
      }
    } catch (err: any) {
      console.error(`Error ${action.toLowerCase()}ing ${extensionId}:`, err);
      setError(err.message);
      setExtensionActionState(extensionId, 'error');
      // Attempt to refresh status even on error
      try {
        const statuses = await window.api.getManagedStatuses();
        setManagedStatuses(statuses);
      } catch (statusErr) {
        console.error("Failed to refresh statuses after toggle error:", statusErr);
      }
    }
  }, [clearError, setError, setExtensionActionState, setManagedStatuses, updateConnectionState, setConfiguringExtensionId]);

  // Install an extension
  const handleInstall = useCallback(async (extensionId: string) => {
    clearError();
    setExtensionActionState(extensionId, 'installing');
    try {
      const result = await window.api.installExtension(extensionId);
      if (result.success) {
        console.log(`Extension ${extensionId} installed successfully.`);
        setManagedExtensions(result.managed || []);
        setDiscoverableOnlineExtensions(result.discoverable || []);
        setManagedStatuses(result.statuses || {});
        setExtensionActionState(extensionId, null);

        console.log(`[Renderer] Triggering enable for ${extensionId} after successful install...`);
        await handleToggleEnable(extensionId, true);

      } else {
        throw new Error(result.error || `Failed to install ${extensionId}.`);
      }
    } catch (err: any) {
      console.error(`Error installing ${extensionId}:`, err);
      setError(err.message);
      setExtensionActionState(extensionId, 'error');
    }
  }, [
    clearError, 
    setError, 
    setExtensionActionState, 
    setManagedExtensions, 
    setDiscoverableOnlineExtensions, 
    setManagedStatuses, 
    handleToggleEnable
  ]);

  // Uninstall an extension
  const handleUninstall = useCallback(async (extensionId: string) => {
    clearError();
    setExtensionActionState(extensionId, 'uninstalling');
    try {
      const result = await window.api.uninstallExtension(extensionId);
      if (result.success) {
        console.log(`Extension ${extensionId} uninstalled successfully.`);
        setManagedExtensions(result.managed || []);
        setDiscoverableOnlineExtensions(result.discoverable || []);
        setManagedStatuses(result.statuses || {});
        setExtensionActionState(extensionId, null);
        await updateConnectionState();
      } else {
        throw new Error(result.error || `Failed to uninstall ${extensionId}.`);
      }
    } catch (err: any) {
      console.error(`Error uninstalling ${extensionId}:`, err);
      setError(err.message);
      setExtensionActionState(extensionId, 'error');
    }
  }, [clearError, setError, setExtensionActionState, setManagedExtensions, setDiscoverableOnlineExtensions, setManagedStatuses, updateConnectionState]);

  // Reconnect an extension
  const handleReconnect = useCallback(async (extensionId: string) => {
    clearError();
    setExtensionActionState(extensionId, 'connecting');
    console.log(`Attempting to reconnect ${extensionId}...`);
    try {
      const result = await window.api.reconnectExtension(extensionId);
      if (result.success) {
        console.log(`Extension ${extensionId} reconnect initiated successfully.`);
        setExtensionActionState(extensionId, null);
        await updateConnectionState();
      } else {
        if (result.error?.includes('Configuration required') || result.requiresConfiguration) {
          console.warn(`Reconnect failed for ${extensionId} due to missing configuration.`);
          setExtensionActionState(extensionId, 'configurationRequired');
          setError(`Extension '${extensionId}' requires configuration. Please configure it.`);
          if (setConfiguringExtensionId) setConfiguringExtensionId(extensionId);
        } else {
          throw new Error(result.error || `Failed to reconnect ${extensionId}.`);
        }
      }
    } catch (err: any) {
      console.error(`Error reconnecting ${extensionId}:`, err);
      setError(err.message);
      setExtensionActionState(extensionId, 'error');
      await updateConnectionState();
    }
  }, [clearError, setError, setExtensionActionState, updateConnectionState, setConfiguringExtensionId]);

  return {
    handleConfigure,
    handleInstall,
    handleUninstall,
    handleReconnect,
    handleToggleEnable
  };
} 