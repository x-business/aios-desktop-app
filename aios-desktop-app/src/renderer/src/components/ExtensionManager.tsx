// src/renderer/src/components/ExtensionManager.tsx
import React, { useState, useEffect } from 'react';
import { useExtensionData } from '@/hooks/useExtensionData';
import { useExtensionActions } from '@/hooks/useExtensionActions';
import { ExtensionList } from './extension-manager/ExtensionList';
import { ConfigurationView } from './extension-manager/ConfigurationView';

function ExtensionManager(): React.JSX.Element {
  // State for showing the configuration webview
  const [configuringExtensionId, setConfiguringExtensionId] = useState<string | null>(null);
  
  // Use our custom hooks for data fetching and actions
  const {
    // extensions, // REMOVED (using specific states below)
    // Raw state values needed by ExtensionList
    managedExtensions,
    discoverableOnlineExtensions,
    managedStatuses,
    connectedExtensionIds,
    activeTools,
    actionStates,
    error,
    // Hook actions/setters needed by useExtensionActions
    setExtensionActionState,
    clearError,
    setError,
    fetchData,
    setConnectedExtensionIds,
    setActiveTools,
    // setInstalledExtensions, // REMOVED
    // setAvailableExtensions, // REMOVED
    setManagedExtensions, // ADDED
    setDiscoverableOnlineExtensions, // ADDED
    setManagedStatuses
  } = useExtensionData();

  // Use our actions hook with the state setters from useExtensionData
  const {
    handleConfigure,
    handleInstall,
    // handleConnect, // REMOVED
    // handleDisconnect, // REMOVED
    handleUninstall,
    handleReconnect,
    handleToggleEnable
  } = useExtensionActions({
    setExtensionActionState,
    setError,
    clearError,
    setConfiguringExtensionId,
    connectedExtensionIds,
    setConnectedExtensionIds,
    setActiveTools,
    // setInstalledExtensions, // REMOVED
    // setAvailableExtensions, // REMOVED
    setManagedExtensions, // ADDED
    setDiscoverableOnlineExtensions, // ADDED
    setManagedStatuses
  });

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Render the appropriate view based on state
  return (
    <div className="p-4 space-y-4 h-full flex flex-col">
      {configuringExtensionId ? (
        <ConfigurationView 
          extensionId={configuringExtensionId}
          onBack={() => setConfiguringExtensionId(null)}
          handleToggleEnable={handleToggleEnable}
        />
      ) : (
        <ExtensionList
          // Pass the new state props
          managedExtensions={managedExtensions}
          discoverableOnlineExtensions={discoverableOnlineExtensions}
          managedStatuses={managedStatuses}
          connectedExtensionIds={connectedExtensionIds}
          activeTools={activeTools}
          actionStates={actionStates}
          error={error}
          // Pass the relevant actions
          onInstall={handleInstall}
          // onConnect={handleConnect} // REMOVED
          // onDisconnect={handleDisconnect} // REMOVED
          onUninstall={handleUninstall}
          onConfigure={handleConfigure}
          onReconnect={handleReconnect}
          onToggleEnable={handleToggleEnable}
        />
      )}
    </div>
  );
}

export default ExtensionManager;
