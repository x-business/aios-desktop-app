import { useState, useEffect, useCallback } from 'react';
import type { MCPExtensionInfo, SimpleToolInfo, ExtensionRegistryEntry } from '@shared/types/index.js';
import { ExtensionStatus } from '@/components/ExtensionCard';

// Interface combining extension info with its dynamic state
export interface DisplayExtension extends MCPExtensionInfo {
    manifest: MCPExtensionInfo['manifest'];
    status: ExtensionStatus;
    tools: SimpleToolInfo[];
    isLoading: boolean;
    isManaged: boolean;
    managedStatus: { id: string; version: string; enabled: boolean } | null | undefined;
}

interface ExtensionDataState {
    managedExtensions: MCPExtensionInfo[];
    discoverableOnlineExtensions: ExtensionRegistryEntry[];
    managedStatuses: Record<string, { id: string; version: string; enabled: boolean }>;
    connectedExtensionIds: Set<string>;
    activeTools: SimpleToolInfo[];
    actionStates: Record<string, ExtensionStatus | null>;
    isFetchingInitialData: boolean;
    error: string | null;
}

export function useExtensionData() {
    // State for raw data from API
    const [state, setState] = useState<ExtensionDataState>({
        managedExtensions: [],
        discoverableOnlineExtensions: [],
        managedStatuses: {},
        connectedExtensionIds: new Set(),
        activeTools: [],
        actionStates: {},
        isFetchingInitialData: true,
        error: null
    });

    // Destructure state for easier access
    const { 
        managedExtensions, 
        discoverableOnlineExtensions, 
        managedStatuses, 
        connectedExtensionIds, 
        activeTools, 
        actionStates, 
        isFetchingInitialData, 
        error 
    } = state;

    // Helper to update action state for a specific extension
    const setExtensionActionState = useCallback((id: string, status: ExtensionStatus | null) => {
        setState(prev => ({
            ...prev,
            actionStates: { ...prev.actionStates, [id]: status }
        }));
    }, []);

    const clearError = useCallback(() => {
        setState(prev => ({ ...prev, error: null }));
    }, []);

    const setError = useCallback((error: string | null) => {
        setState(prev => ({ ...prev, error }));
    }, []);

    // State setters
    const setConnectedExtensionIds = useCallback((ids: Set<string> | ((prev: Set<string>) => Set<string>)) => {
        setState(prev => {
            if (typeof ids === 'function') {
                return { ...prev, connectedExtensionIds: ids(prev.connectedExtensionIds) };
            }
            return { ...prev, connectedExtensionIds: ids };
        });
    }, []);

    const setActiveTools = useCallback((tools: SimpleToolInfo[]) => {
        setState(prev => ({ ...prev, activeTools: tools }));
    }, []);

    const setManagedExtensions = useCallback((exts: MCPExtensionInfo[]) => {
        setState(prev => ({ ...prev, managedExtensions: exts }));
    }, []);

    const setDiscoverableOnlineExtensions = useCallback((exts: ExtensionRegistryEntry[]) => {
        setState(prev => ({ ...prev, discoverableOnlineExtensions: exts }));
    }, []);

    const setManagedStatuses = useCallback((statuses: Record<string, { id: string; version: string; enabled: boolean }>) => {
        setState(prev => ({ ...prev, managedStatuses: statuses }));
    }, []);

    // Function to fetch all necessary data
    const fetchData = useCallback(async () => {
        clearError();
        setState(prev => ({ ...prev, isFetchingInitialData: true, actionStates: {} }));
        
        try {
            console.log("[Renderer] Fetching initial extension data (managed & discoverable)... ");
            // Call the single API endpoint
            const { managed, discoverable } = await window.api.discoverLoadExtensions(); 
            console.log("[Renderer] Received managed & discoverable:", { managed, discoverable });

            // Fetch statuses and connection info separately
            const [statuses, connectedInfo] = await Promise.all([
                window.api.getManagedStatuses(),
                window.api.getActiveConnectionsInfo()
            ]);
            console.log("[Renderer] Received statuses & connected info:", { statuses, connectedInfo });

            const connectedIds = new Set(connectedInfo.map(ext => ext.id));
            
            // Fetch tools only if there are connected extensions
            let tools: SimpleToolInfo[] = [];
            if (connectedInfo.length > 0) {
                tools = await window.api.getAllActiveTools();
                console.log('[Renderer] Received tools:', tools);
            }

            setState(prev => ({
                ...prev,
                managedExtensions: managed,
                discoverableOnlineExtensions: discoverable,
                managedStatuses: statuses,
                connectedExtensionIds: connectedIds,
                activeTools: tools,
                isFetchingInitialData: false
            }));
        } catch (err: any) {
            console.error("Error fetching extension data:", err);
            setState(prev => ({
                ...prev,
                error: err.message || 'Failed to fetch extension data.',
                managedExtensions: [], 
                discoverableOnlineExtensions: [],
                connectedExtensionIds: new Set(),
                activeTools: [],
                isFetchingInitialData: false
            }));
        }
    }, [clearError]);

    // Process extensions into display format
    const processedExtensions = useCallback((): DisplayExtension[] => {
        const managedMap = new Map(managedExtensions.map(ext => [ext.id, ext]));
        const onlineMap = new Map(discoverableOnlineExtensions.map(entry => [entry.id, entry]));
        const allIds = new Set([...managedMap.keys(), ...onlineMap.keys()]);
        
        return Array.from(allIds).map(id => {
            const managedInfo = managedMap.get(id);
            const onlineInfo = onlineMap.get(id);
            
            if (!managedInfo && !onlineInfo) return null; // Should not happen

            const isManaged = !!managedInfo;
            const statusDetails = isManaged ? managedStatuses[id] : null;
            const isConnected = isManaged && connectedExtensionIds.has(id);
            const currentAction = actionStates[id];

            let status: ExtensionStatus;
            if (isManaged) {
                if (currentAction) {
                    status = currentAction;
                } else if (isConnected) {
                    status = 'connected';
                } else if (statusDetails?.enabled) {
                    // If enabled but not connected, show as disabled/needs reconnect
                    status = 'disabled'; // Or maybe a new 'disconnected' status?
                } else {
                    status = 'disabled';
                }
            } else { // Discoverable online
                if (currentAction === 'installing') {
                    status = 'installing';
                } else {
                    status = 'available';
                }
            }

            const extensionTools = managedInfo 
                ? activeTools.filter((t: SimpleToolInfo & { extensionId?: string }) => t.extensionId === id) 
                : [];

            // Construct the DisplayExtension object
            // Need to adapt this structure as MCPExtensionInfo and ExtensionRegistryEntry differ
            const baseInfo = managedInfo || {
                // Map fields from ExtensionRegistryEntry to MCPExtensionInfo structure where possible
                // This is a simplification; the UI component will need to handle the differences
                id: onlineInfo!.id,
                name: onlineInfo!.name, // Use registry name
                description: onlineInfo!.description,
                path: 'N/A', // No local path for online-only
                iconPath: onlineInfo!.icon, // Use URL icon
                command: 'N/A',
                args: [],
                transport: 'stdio',
                manifest: { // Create a partial manifest for display
                    name: onlineInfo!.id,
                    version: onlineInfo!.version,
                    displayName: onlineInfo!.name,
                    description: onlineInfo!.description,
                    // These fields are unknown until installed
                    runtime: 'unknown' as any, 
                    executable: 'unknown',
                    frontend: 'unknown',
                    icon: onlineInfo!.icon, 
                }
            };

            return {
                ...(baseInfo as MCPExtensionInfo), // Cast for structure, but UI needs to be careful
                isManaged: isManaged,
                managedStatus: statusDetails,
                status,
                tools: extensionTools,
                isLoading: currentAction && currentAction !== 'error' && currentAction !== 'configurationRequired'
            } as DisplayExtension;
        }).filter(Boolean) as DisplayExtension[];
    }, [
        managedExtensions,
        discoverableOnlineExtensions,
        managedStatuses, 
        connectedExtensionIds, 
        actionStates, 
        activeTools
    ]);

    // Set up listeners for tool updates
    useEffect(() => {
        const removeToolsUpdateListener = window.api.onToolsUpdate((tools) => {
            console.log('[Renderer] Received tools-updated event:', tools);
            setActiveTools(tools);
            
            // Update connected status when tools change
            window.api.getActiveConnectionsInfo()
                .then(connectedInfo => {
                    setConnectedExtensionIds(new Set(connectedInfo.map(ext => ext.id)));
                })
                .catch(err => console.error("Error refreshing connected info on tools update:", err));
        });

        // Listen for configuration required events
        const removeConfigRequiredListener = window.api.onExtensionConfigRequired(({ extensionId, missingKeys }) => {
            console.warn(`[Renderer] Received config required event for ${extensionId}. Missing: ${missingKeys?.join(', ')}`);
            
            setExtensionActionState(extensionId, 'configurationRequired');
            setError(`Extension '${extensionId}' requires configuration before it can be enabled. Missing: ${missingKeys?.join(', ') || 'Unknown keys'}. Please configure it.`);
        });

        return () => {
            removeToolsUpdateListener();
            removeConfigRequiredListener();
        };
    }, [setExtensionActionState, setError, setActiveTools, setConnectedExtensionIds]);

    // Effect to clear 'configurationRequired' state upon connection
    useEffect(() => {
        setState(prev => {
            const updatedActionStates = { ...prev.actionStates };
            let stateChanged = false;
            
            prev.connectedExtensionIds.forEach(id => {
                if (prev.actionStates[id] === 'configurationRequired') {
                    console.log(`[Renderer] Clearing 'configurationRequired' state for connected extension: ${id}`);
                    updatedActionStates[id] = null;
                    stateChanged = true;
                }
            });
            
            return stateChanged ? { ...prev, actionStates: updatedActionStates } : prev;
        });
    }, [connectedExtensionIds]);

    return {
        // Processed data
        extensions: processedExtensions(),
        
        // Raw state values
        managedExtensions,
        discoverableOnlineExtensions,
        managedStatuses,
        connectedExtensionIds,
        activeTools,
        actionStates,
        isFetchingInitialData,
        error,
        
        // Actions
        setExtensionActionState,
        clearError,
        setError,
        fetchData,
        
        // State setters
        setConnectedExtensionIds,
        setActiveTools,
        setManagedExtensions,
        setDiscoverableOnlineExtensions,
        setManagedStatuses
    };
} 