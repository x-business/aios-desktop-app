import { useState, useEffect, useCallback } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Search, Terminal } from "lucide-react";
import ExtensionCard, { ExtensionStatus } from '../ExtensionCard';
import type { MCPExtensionInfo, ExtensionRegistryEntry, SimpleToolInfo, ManagedExtensionStatus as SharedManagedStatus } from '@shared/types/index.js';

// This type represents the unified structure for rendering
interface UnifiedExtensionDisplay {
  id: string;
  name: string;
  description?: string;
  iconPath?: string; // Can be local path or URL
  manifest?: MCPExtensionInfo['manifest'] | Partial<MCPExtensionInfo['manifest']>; // Manifest is partial for online
  status: ExtensionStatus;
  tools: SimpleToolInfo[];
  isLoading: boolean;
  isManaged: boolean;
  isEnabled: boolean;
  isConnected: boolean;
  managedStatus: SharedManagedStatus | null;
}

interface ExtensionListProps {
  managedExtensions: MCPExtensionInfo[];
  discoverableOnlineExtensions: ExtensionRegistryEntry[];
  managedStatuses: Record<string, SharedManagedStatus>;
  connectedExtensionIds: Set<string>;
  error: string | null;
  actionStates: Record<string, ExtensionStatus | null>;
  activeTools: SimpleToolInfo[];
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onConfigure: (id: string) => void;
  onReconnect: (id: string) => void;
  onToggleEnable: (id: string, enable: boolean) => void;
}

export function ExtensionList({
  managedExtensions,
  discoverableOnlineExtensions,
  managedStatuses,
  connectedExtensionIds,
  error,
  actionStates,
  activeTools,
  onInstall,
  onUninstall,
  onConfigure,
  onReconnect,
  onToggleEnable
}: ExtensionListProps) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filteredExtensions, setFilteredExtensions] = useState<UnifiedExtensionDisplay[]>([]);

  // Combine and process extensions
  const processAndFilterExtensions = useCallback(() => {
    const managedMap = new Map(managedExtensions.map(ext => [ext.id, ext]));
    const onlineMap = new Map(discoverableOnlineExtensions.map(entry => [entry.id, entry]));
    const allIds = new Set([...managedMap.keys(), ...onlineMap.keys()]);

    const unifiedList: UnifiedExtensionDisplay[] = Array.from(allIds).map(id => {
        const managedInfo = managedMap.get(id);
        const onlineInfo = onlineMap.get(id);

        if (!managedInfo && !onlineInfo) return null; // Should not happen

        const isManaged = !!managedInfo;
        const statusDetails = isManaged ? managedStatuses[id] : null;
        const isConnected = isManaged && connectedExtensionIds.has(id);
        const isEnabled = isManaged && !!statusDetails?.enabled;
        const currentAction = actionStates[id];

        let status: ExtensionStatus;
        if (isManaged) {
            if (currentAction) {
                status = currentAction;
            } else if (isConnected) {
                status = 'connected';
            } else if (isEnabled) {
                // Enabled but not connected -> show reconnect state?
                status = 'disabled'; // Or maybe 'disconnected-enabled' if we add that status
            } else {
                status = 'disabled';
            }
        } else { // Discoverable online
            status = currentAction === 'installing' ? 'installing' : 'available';
        }

        const extensionTools = isManaged && managedInfo
          ? activeTools.filter((t: SimpleToolInfo & { extensionId?: string }) => t.extensionId === managedInfo.id)
          : [];

        // Construct the display object
        const displayInfo: Partial<UnifiedExtensionDisplay> = {};
        if (isManaged && managedInfo) {
            displayInfo.name = managedInfo.manifest.displayName;
            displayInfo.description = managedInfo.manifest.description;
            displayInfo.iconPath = managedInfo.iconPath;
            displayInfo.manifest = managedInfo.manifest;
        } else if (onlineInfo) {
            displayInfo.name = onlineInfo.name;
            displayInfo.description = onlineInfo.description;
            displayInfo.iconPath = onlineInfo.icon; // URL
            // Create partial manifest for display
            displayInfo.manifest = { 
                name: onlineInfo.id,
                version: onlineInfo.version,
                displayName: onlineInfo.name,
                description: onlineInfo.description,
                icon: onlineInfo.icon,
            };
        }

        return {
            id: id,
            name: displayInfo.name || id, // Fallback to ID if name is somehow missing
            description: displayInfo.description,
            iconPath: displayInfo.iconPath,
            manifest: displayInfo.manifest,
            status: status,
            tools: extensionTools,
            isLoading: !!currentAction && currentAction !== 'error' && currentAction !== 'configurationRequired',
            isManaged: isManaged,
            isEnabled: isEnabled,
            isConnected: isConnected,
            managedStatus: statusDetails || null,
        } as UnifiedExtensionDisplay;
    }).filter((ext): ext is UnifiedExtensionDisplay => ext !== null);

    // Apply search filter
    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    if (!lowerSearchTerm) {
      setFilteredExtensions(unifiedList);
    } else {
      const filtered = unifiedList.filter(ext => {
        const nameMatch = ext.name ? ext.name.toLowerCase().includes(lowerSearchTerm) : false;
        const descMatch = ext.description ? ext.description.toLowerCase().includes(lowerSearchTerm) : false;
        const idMatch = ext.id.toLowerCase().includes(lowerSearchTerm);
        return nameMatch || descMatch || idMatch;
      });
      setFilteredExtensions(filtered);
    }
  }, [
    managedExtensions, 
    discoverableOnlineExtensions, 
    managedStatuses, 
    connectedExtensionIds, 
    actionStates, 
    activeTools, 
    searchTerm
  ]);

  // Trigger processing when dependencies change
  useEffect(() => {
    processAndFilterExtensions();
  }, [processAndFilterExtensions]);

  return (
    <>
      <h2 className="text-2xl font-semibold tracking-tight">MCP Extension Management</h2>
      
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Search extensions..." 
          className="pl-8 w-full" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Combined Extension List */}
      <div className="space-y-2 flex-1 overflow-y-auto pr-2">
        {filteredExtensions.length > 0 ? (
          filteredExtensions.map(ext => (
            <ExtensionCard
              key={ext.id}
              // Pass down fields matching ExtensionCard's current expected props (MCPExtensionInfo based)
              // This is temporary; ExtensionCard needs refactoring
              extension={{
                  id: ext.id,
                  name: ext.name,
                  description: ext.description,
                  iconPath: ext.iconPath,
                  manifest: ext.manifest as MCPExtensionInfo['manifest'], // Cast manifest
                  // Add placeholder/default values for missing fields expected by MCPExtensionInfo
                  path: ext.isManaged ? (ext.manifest as MCPExtensionInfo['manifest'])?.executable : 'N/A', // Example placeholder path logic
                  command: 'N/A',
                  args: [],
                  transport: 'stdio',
              }}
              status={ext.status}
              tools={ext.tools}
              isLoading={ext.isLoading}
              // Pass down flags needed for button logic inside ExtensionCard
              isManaged={ext.isManaged}
              isEnabled={ext.isEnabled}
              isConnected={ext.isConnected}
              // managedStatus prop might be removed from ExtensionCard later
              managedStatus={ext.managedStatus}
              // Pass action handlers (without connect/disconnect)
              onInstall={onInstall}
              onUninstall={onUninstall}
              onToggleEnable={onToggleEnable}
              onReconnect={onReconnect}
              onConfigure={onConfigure}
            />
          ))
        ) : (
          <p className="text-muted-foreground">No extensions match your search.</p>
        )}
      </div>
    </>
  );
} 