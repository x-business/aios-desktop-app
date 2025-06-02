import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePipedreamSettingsStore } from '@/stores/settingsStore';
import { useRemoteIntegrationsStore } from '@/stores/remoteIntegrationsStore';
import type { PersistedRemoteIntegrationConfig, PipedreamAppMetadata, RuntimeRemoteIntegrationDetails, PipedreamPageInfo } from '@shared/types/remote-integration.js';
import IntegrationCard, { DiscoverableCardBusyActionType, ConfiguredCardBusyActionType } from '@/components/remote-integrations/IntegrationCard';

// Updated BusyActionType to be a union of the specific types from IntegrationCard
type BusyActionType = DiscoverableCardBusyActionType | ConfiguredCardBusyActionType;

const RemoteIntegrationsSettings: React.FC = () => {
  const { pipedreamUserId } = usePipedreamSettingsStore();
  // Get configured integrations data from the store
  const { 
    configuredIntegrations, 
    isLoading: isLoadingConfiguredList, // Renamed for clarity
    error: configuredListError,
    // fetchConfiguredIntegrations: fetchConfiguredIntegrationsFromStore // Not strictly needed here if App.tsx initializes
  } = useRemoteIntegrationsStore();

  // const [configuredIntegrations, setConfiguredIntegrations] = useState<PersistedRemoteIntegrationConfig[]>([]); // Removed
  const [discoverableIntegrations, setDiscoverableIntegrations] = useState<PipedreamAppMetadata[]>([]);
  const [discoverablePageInfo, setDiscoverablePageInfo] = useState<PipedreamPageInfo | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentCategory, setCurrentCategory] = useState<string | undefined>(undefined);
  // const [isLoadingConfigured, setIsLoadingConfigured] = useState(false); // Removed
  const [isLoadingDiscoverable, setIsLoadingDiscoverable] = useState(false);
  
  // General error state for operations other than fetching configured list
  const [operationError, setOperationError] = useState<string | null>(null);


  const [connectionStatuses, setConnectionStatuses] = useState<Record<string, { connected: boolean; error?: string; details?: RuntimeRemoteIntegrationDetails }>>({});
  const [busyStates, setBusyStates] = useState<Record<string, BusyActionType | null>>({});

  // Removed fetchConfiguredIntegrations useCallback

  const sortedConfiguredIntegrations = useMemo(() => {
    if (!configuredIntegrations) return [];
    return [...configuredIntegrations].sort((a, b) => {
      const aConnected = connectionStatuses[a.name_slug]?.connected;
      const bConnected = connectionStatuses[b.name_slug]?.connected;

      if (aConnected && !bConnected) {
        return -1; // a comes first
      }
      if (!aConnected && bConnected) {
        return 1; // b comes first
      }
      // If both are connected or both are not, maintain original order (or sort by name as a secondary criterion if desired)
      // For now, let's keep original relative order or sort by enabled status as secondary.
      // If secondary sort by enabled status (enabled first):
      // if (a.enabled && !b.enabled) return -1;
      // if (!a.enabled && b.enabled) return 1;
      return 0; // Keep original order or if enabled status is the same
    });
  }, [configuredIntegrations, connectionStatuses]);

  const fetchDiscoverableIntegrations = useCallback(async (currentSearchTerm: string, page: number, categoryToSearch?: string, appendResults: boolean = false) => {
    setIsLoadingDiscoverable(true);
    if (!appendResults) setOperationError(null); 
    
    try {
      const result = await window.remoteIntegrations.discoverPipedreamApps(currentSearchTerm, page, categoryToSearch);
      const { apps: discoveredApps, pageInfo } = result;
      
      if (appendResults) {
        setDiscoverableIntegrations(prev => [...prev, ...discoveredApps]);
      } else {
        setDiscoverableIntegrations(discoveredApps);
      }
      setDiscoverablePageInfo(pageInfo);

    } catch (err: any) {
      console.error('Error fetching discoverable integrations:', err);
      setOperationError(err.message || 'Failed to fetch discoverable integrations.');
      if (!appendResults) {
        setDiscoverableIntegrations([]); 
        setDiscoverablePageInfo(null);
      }
    } finally {
      setIsLoadingDiscoverable(false);
    }
  }, []); 

  // Effect for fetching initial statuses (once configured integrations are loaded from store) and initial discoverable integrations
  useEffect(() => {
    // This function now depends on configuredIntegrations from the store
    const fetchInitialStatusesDirectly = async (configs: PersistedRemoteIntegrationConfig[]) => {
      if (configs.length === 0) return;
      try {
          const infos = await window.remoteIntegrations.getConnectedInfo();
          const initialStatusesUpdate: Record<string, { connected: boolean; error?: string; details?: RuntimeRemoteIntegrationDetails }> = {};
          infos.forEach(info => {
              initialStatusesUpdate[info.nameSlug] = { connected: true, details: info };
          });
         
          configs.forEach(conf => {
              if (!initialStatusesUpdate[conf.name_slug]) {
                  initialStatusesUpdate[conf.name_slug] = { connected: false };
              }
          });
          setConnectionStatuses(initialStatusesUpdate);
      } catch (e:any) {
          console.error("Failed to fetch initial connection statuses", e);
          setOperationError(e.message || "Failed to fetch initial statuses");
      }
    };

    if (configuredIntegrations && configuredIntegrations.length > 0) {
        fetchInitialStatusesDirectly(configuredIntegrations);
    }
    
    // Initial fetch for discoverable integrations (empty search, page 1, no category)
    // This can run independently or after configured list is available if needed for filtering (though current discoverPipedreamApps doesn't seem to need it)
    fetchDiscoverableIntegrations('', 1, undefined, false);

  }, [configuredIntegrations, fetchDiscoverableIntegrations]); // Runs when configuredIntegrations from store changes or on mount for discoverable

  // Effect for setting up IPC listeners and reacting to store changes
  useEffect(() => {
    // Listener for connection status updates (remains local to this component)
    const cleanupConnectionStatus = window.remoteIntegrations.onConnectionStatusUpdated((status) => {
      console.log('RemoteIntegrationsSettings: Connection status updated', status);
      setConnectionStatuses(prev => ({ ...prev, [status.nameSlug]: status }));
    });

    // No longer need to listen for onConfiguredListUpdated here, store handles it.
    // However, if discoverable integrations should be re-fetched when configured list changes:
    // This effect will re-run if configuredIntegrations (from store) changes,
    // so we can trigger discoverable fetch here if needed.
    // For now, assuming the initial fetchDiscoverableIntegrations and search handles it.
    // If add/remove should immediately refilter discoverable apps, add configuredIntegrations dependency 
    // to an effect that calls fetchDiscoverableIntegrations. The below example does this.

    return () => {
      cleanupConnectionStatus();
    };
  }, []); // Minimal dependencies for this listener

  // Effect to re-fetch discoverable integrations if the configured list changes (e.g., after an add/remove)
  // This ensures the discoverable list (which might exclude already configured ones) is up-to-date.
  useEffect(() => {
    // Assuming fetchDiscoverableIntegrations might implicitly use configuredIntegrations 
    // on the main process side for filtering, or if UI needs to re-filter.
    // We fetch from page 1 with current filters.
    console.log('RemoteIntegrationsSettings: Configured list changed, re-fetching discoverable integrations.');
    fetchDiscoverableIntegrations(searchTerm, 1, currentCategory, false);
  }, [configuredIntegrations, searchTerm, currentCategory, fetchDiscoverableIntegrations]);


  const handleSearch = () => {
    fetchDiscoverableIntegrations(searchTerm, 1, currentCategory, false);
  };

  const handleLoadMoreDiscoverable = () => {
    if (discoverablePageInfo && discoverablePageInfo.hasMore && discoverablePageInfo.nextPage) {
      fetchDiscoverableIntegrations(searchTerm, discoverablePageInfo.nextPage, currentCategory, true);
    }
  };

  // handleAddIntegration, handleRemoveIntegration, handleToggleEnableIntegration, handleReconnectIntegration remain largely the same
  // but will use setOperationError instead of setError for their specific errors.
  // When add/remove operations complete, the store will update via its own IPC listener,
  // and this component will re-render with the new configuredIntegrations list.

  const handleAddIntegration = async (app: PipedreamAppMetadata) => {
    console.log('handleAddIntegration', app);
    setBusyStates(prev => ({ ...prev, [app.name_slug]: 'add' }));
    setOperationError(null);
    try {
      await window.remoteIntegrations.addConfigured(app);
      if (pipedreamUserId) {
        setBusyStates(prev => ({ ...prev, [app.name_slug]: 'toggle-enable' }));
        await window.remoteIntegrations.enable(app.name_slug, pipedreamUserId);
      } else {
        setOperationError('Pipedream User ID is not set. Integration added but cannot be enabled automatically.');
      }
    } catch (err: any) {
      console.error('Error adding or enabling integration:', err);
      setOperationError(err.message || 'Failed to add or enable integration.');
    } finally {
      setBusyStates(prev => ({ ...prev, [app.name_slug]: null }));
    }
  };

  const handleRemoveIntegration = async (config: PersistedRemoteIntegrationConfig) => {
    console.log('handleRemoveIntegration', config);
    setBusyStates(prev => ({ ...prev, [config.name_slug]: 'remove' }));
    setOperationError(null);
    try {
      await window.remoteIntegrations.removeConfigured(config.name_slug);
    } catch (err: any) {
      console.error('Error removing integration:', err);
      setOperationError(err.message || 'Failed to remove integration.');
    } finally {
      setBusyStates(prev => ({ ...prev, [config.name_slug]: null }));
    }
  };

  const handleToggleEnableIntegration = async (config: PersistedRemoteIntegrationConfig) => {
    console.log('handleToggleEnableIntegration', config);
    const newEnabledState = !config.enabled;
    setBusyStates(prev => ({ ...prev, [config.name_slug]: 'toggle-enable' }));
    setOperationError(null);

    try {
      if (newEnabledState) {
        if (!pipedreamUserId) {
          setOperationError('Pipedream User ID is not set. Cannot enable integration.');
          setBusyStates(prev => ({ ...prev, [config.name_slug]: null }));
          return;
        }
        await window.remoteIntegrations.enable(config.name_slug, pipedreamUserId);
      } else {
        await window.remoteIntegrations.disable(config.name_slug);
      }
    } catch (err: any) {
      console.error(`Error ${newEnabledState ? 'enabling' : 'disabling'} integration:`, err);
      setOperationError(err.message || `Failed to ${newEnabledState ? 'enable' : 'disable'} integration.`);
    } finally {
      setBusyStates(prev => ({ ...prev, [config.name_slug]: null }));
    }
  };

  const handleReconnectIntegration = async (config: PersistedRemoteIntegrationConfig) => {
    console.log('handleReconnectIntegration', config);
    setBusyStates(prev => ({ ...prev, [config.name_slug]: 'reconnect' }));
    setOperationError(null);
    try {
      if (!pipedreamUserId) {
        setOperationError('Pipedream User ID is not set. Cannot reconnect integration.');
        setBusyStates(prev => ({ ...prev, [config.name_slug]: null }));
        return;
      }
      await window.remoteIntegrations.reconnect(config.name_slug, pipedreamUserId);
    } catch (err: any) {
      console.error('Error reconnecting integration:', err);
      setOperationError(err.message || 'Failed to reconnect integration.');
    } finally {
      setBusyStates(prev => ({ ...prev, [config.name_slug]: null }));
    }
  };
  
  // JSX part: Update to use isLoadingConfiguredList and configuredListError from store

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Remote Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Discover, add, and manage your remote integrations like Pipedream apps.
        </p>
      </div>

      {pipedreamUserId ? (
        <p className="text-sm text-muted-foreground">
          Using Pipedream User ID: <span className="font-medium">{pipedreamUserId}</span>
        </p>
      ) : (
        <p className="text-sm text-orange-600">
          Pipedream User ID not set. Please set it in General Settings to enable Pipedream integrations.
        </p>
      )}

      {/* Display general operation errors */}
      {operationError && <p className="text-sm text-red-600">Error: {operationError}</p>}
      {/* Display errors from fetching configured list from store */}
      {configuredListError && !operationError && <p className="text-sm text-red-600">Error loading configured integrations: {configuredListError}</p>}


      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Your Configured Integrations</h3>
        {isLoadingConfiguredList && <p>Loading your integrations...</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {sortedConfiguredIntegrations.map(config => {
            const status = connectionStatuses[config.name_slug];
            return (
              <IntegrationCard
                key={config.name_slug}
                type="configured"
                integration={config}
                connectionStatus={status}
                onRemove={handleRemoveIntegration}
                onToggleEnable={handleToggleEnableIntegration}
                onReconnect={handleReconnectIntegration}
                isBusyAction={busyStates[config.name_slug] as ConfiguredCardBusyActionType | null}
              />
            );
          })}
          {sortedConfiguredIntegrations.length === 0 && !isLoadingConfiguredList && 
            <p className="col-span-full text-center text-muted-foreground">You haven't added any integrations yet.</p>}
        </div>
      </div>

      <hr className="my-6"/>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Discover Integrations</h3>
        <div className="flex space-x-2">
          <Input 
            type="search" 
            placeholder="Search Pipedream apps..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-grow"
          />
          <Button onClick={handleSearch} disabled={isLoadingDiscoverable || isLoadingConfiguredList}>
            {isLoadingDiscoverable ? 'Searching...' : 'Search'}
          </Button>
        </div>
        {isLoadingDiscoverable && <p>Loading discoverable integrations...</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {discoverableIntegrations.map(app => (
            <IntegrationCard
              key={app.name_slug}
              type="discoverable"
              integration={app}
              onAdd={handleAddIntegration}
              isBusyAction={busyStates[app.name_slug] as DiscoverableCardBusyActionType | null}
            />
          ))}
          {discoverableIntegrations.length === 0 && !isLoadingDiscoverable && !operationError && // check operationError for discoverable
            <p className="col-span-full text-center text-muted-foreground">No new integrations found matching your criteria.</p>}
          {operationError && discoverableIntegrations.length === 0 && // Check operationError for discoverable
            <p className="col-span-full text-center text-red-500">Failed to load discoverable integrations.</p>}
        </div>
        {discoverablePageInfo && discoverablePageInfo.hasMore && (
          <div className="mt-4 flex justify-center">
            <Button onClick={handleLoadMoreDiscoverable} disabled={isLoadingDiscoverable}>
              {isLoadingDiscoverable ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        )}
      </div>

    </div>
  );
};

export default RemoteIntegrationsSettings; 