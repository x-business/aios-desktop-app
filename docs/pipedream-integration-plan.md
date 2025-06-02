# Remote MCP Integration Plan

This document outlines the low-level design and step-by-step plan to integrate remote, HTTP-based MCP services (initially Pipedream) into the AIOS desktop application.

**Core Principles:**

*   **Separation of Concerns:** `ExtensionManager` for local extensions, a new `RemoteIntegrationManager` for remote integrations.
*   **Unified Tool Access:** A mechanism to get tools from both managers.
*   **Clear Data Flow:** Backend managers prepare data, IPC sends it, preload scripts expose it, renderer consumes it.
*   **Modularity:** Functions and files will have clear responsibilities.
*   **Configuration:** Remote service base MCP URLs will be configurable (e.g., via environment variables or a central app config).

---

## Phase 1: Backend - RemoteIntegrationManager Setup

*   **Step 1.1: Define Core Types for Remote Integrations (`@shared/types/remote-integration.ts`)**
    *   **File:** `aios-desktop-app/src/shared/types/remote-integration.ts` (New File)
    *   **Content:**
        ```typescript
        import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
        import type { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHTTP.js';
        import type { StructuredToolInterface } from '@langchain/core/tools';

        /** 
         * Data structure for app metadata fetched from a remote service's discovery API.
         * Initially, this will map to Pipedream's /v1/apps API response structure.
         */
        export interface PipedreamAppMetadata { // Name kept specific as it describes Pipedream's structure
            id: string;                 // Service's global app ID (e.g., Pipedream's "app_OkrhR1")
            name_slug: string;          // Service's app name slug (e.g., Pipedream's "slack")
            name: string;               // Display name (e.g., "Slack")
            description?: string;
            img_src?: string;           // Icon URL
        }

        // Add other AppMetadata types here if integrating other remote services, e.g.:
        // export interface ServiceXAppMetadata { /* ... */ }
        // export type RemoteAppMetadata = PipedreamAppMetadata | ServiceXAppMetadata;


        /**
         * Data structure for a user-configured remote integration stored in remote-integrations.json.
         * The key in the JSON object (and the manager's Map) will be the `nameSlug`.
         */
        export interface PersistedRemoteIntegrationConfig {
            appId: string;                 // The remote service's unique app ID (e.g., Pipedream's "app_OkrhR1")
            nameSlug: string;              // The remote service's name slug (e.g., "slack"). This is the key.
            cachedDisplayName: string;     // Display name, cached from service metadata or user-defined.
            cachedIconUrl?: string;        // Icon URL, cached from service metadata.
            enabled: boolean;
            serviceType: 'pipedream'; // To identify the type of remote service, e.g., Pipedream
            // Add other service-specific persisted fields if necessary
        }

        /**
         * In-memory, enriched representation of a configured remote integration,
         * combining persisted config with dynamic runtime data.
         */
        export interface RuntimeRemoteIntegrationDetails {
            appId: string;                   // From persisted config
            nameSlug: string;                // From persisted config
            serviceType: 'pipedream';        // From persisted config
            userId: string;                  // Dynamically obtained user ID for MCP URL construction
            enabled: boolean;                // From persisted config
            
            displayName: string;             // Initially from cache, then updated from fresh API call
            description?: string;            // Fetched from remote API
            iconUrl?: string;                // Fetched from remote API
            
            actualMcpEndpoint: string;       // Dynamically constructed MCP endpoint URL
        }

        /** Data structure for an active remote integration connection */
        export interface ActiveRemoteIntegrationConnection {
            details: RuntimeRemoteIntegrationDetails; 
            client: Client; 
            transport: StreamableHTTPClientTransport; 
            tools: StructuredToolInterface[]; 
            connectionPromise: Promise<void>;
        }
        ```

*   **Step 1.2: Create `RemoteIntegrationManager` Class Shell & Configuration**
    *   **File:** `aios-desktop-app/src/main/remote-integration-manager.ts` (New File)
    *   **Content:**
        ```typescript
        import * as fsPromises from 'fs/promises';
        import * as path from 'path';
        import { app } from 'electron';
        import axios from 'axios';
        import { Client } from '@modelcontextprotocol/sdk/client/index.js';
        import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHTTP.js';
        import { loadMcpTools } from '@langchain/mcp-adapters';
        import type { StructuredToolInterface } from '@langchain/core/tools';
        import type { PersistedRemoteIntegrationConfig, PipedreamAppMetadata, ActiveRemoteIntegrationConnection, RuntimeRemoteIntegrationDetails } from '@shared/types/remote-integration';

        // Pipedream-Specific Configuration (as Pipedream is the first remote service)
        const PIPEDREAM_API_BASE_URL = process.env.PIPEDREAM_API_BASE_URL || 'https://api.pipedream.com/v1';
        const PIPEDREAM_MCP_BASE_URL_TEMPLATE = process.env.PIPEDREAM_MCP_URL_TEMPLATE || 'https://mcp.pipedream.com/{userId}/{slug}';
        const PIPEDREAM_API_TOKEN = process.env.PIPEDREAM_API_TOKEN;

        const USER_DATA_PATH = app.getPath('userData');
        const INTEGRATIONS_FILE_PATH = path.join(USER_DATA_PATH, 'remote-integrations.json'); // Renamed file

        export class RemoteIntegrationManagerError extends Error {
            constructor(message: string) {
                super(message);
                this.name = 'RemoteIntegrationManagerError';
            }
        }

        export class RemoteIntegrationManager {
            private configuredIntegrations: Map<string, PersistedRemoteIntegrationConfig> = new Map(); // Key: nameSlug
            private activeConnections: Map<string, ActiveRemoteIntegrationConnection> = new Map(); // Key: nameSlug
            private appMetadataCache: Map<string, PipedreamAppMetadata> = new Map(); // Key: nameSlug or appId (Pipedream specific for now)

            constructor() {
                console.log(`Remote Integrations File Path: ${INTEGRATIONS_FILE_PATH}`);
                this._ensureIntegrationsFileExists()
                    .then(() => this.loadConfiguredIntegrations())
                    .catch(console.error);
            }

            private _getMcpEndpoint(details: RuntimeRemoteIntegrationDetails): string {
                if (details.serviceType === 'pipedream') {
                    // For Pipedream, mcpEndpoint override is not currently in PersistedRemoteIntegrationConfig
                    // If it were, logic would be: if (details.persistedMcpOverride) return details.persistedMcpOverride;
                    return PIPEDREAM_MCP_BASE_URL_TEMPLATE
                        .replace('{userId}', details.userId)
                        .replace('{slug}', details.nameSlug);
                }
                // Add logic for other serviceTypes if they have different URL structures
                throw new RemoteIntegrationManagerError(`MCP endpoint construction not implemented for service type: ${details.serviceType}`);
            }

            private async _ensureIntegrationsFileExists(): Promise<void> {
                try {
                    await fsPromises.access(INTEGRATIONS_FILE_PATH);
                } catch (error) {
                    await fsPromises.writeFile(INTEGRATIONS_FILE_PATH, JSON.stringify({}, null, 2), 'utf-8');
                    console.log(`Created empty remote integrations file: ${INTEGRATIONS_FILE_PATH}`);
                }
            }

            async loadConfiguredIntegrations(): Promise<void> { /* ... placeholder ... */ }
        }
        ```

*   **Step 1.3: Implement Load/Save for `remote-integrations.json`**
    *   **File:** `aios-desktop-app/src/main/remote-integration-manager.ts`
    *   **Implement `loadConfiguredIntegrations` and add `_saveConfiguredIntegrations` in `RemoteIntegrationManager`:**
        ```typescript
        async loadConfiguredIntegrations(): Promise<void> {
            try {
                const data = await fsPromises.readFile(INTEGRATIONS_FILE_PATH, 'utf-8');
                const jsonObject: Record<string, PersistedRemoteIntegrationConfig> = JSON.parse(data);
                this.configuredIntegrations.clear();
                for (const nameSlug in jsonObject) {
                    if (Object.prototype.hasOwnProperty.call(jsonObject, nameSlug)) {
                        const entry = jsonObject[nameSlug];
                        if (entry && entry.appId && entry.nameSlug === nameSlug &&
                            entry.serviceType === 'pipedream' && // Initially only support Pipedream
                            typeof entry.enabled === 'boolean' && entry.cachedDisplayName) {
                            this.configuredIntegrations.set(nameSlug, entry);
                        } else {
                            console.warn(`Skipping invalid entry in ${INTEGRATIONS_FILE_PATH} for nameSlug: ${nameSlug}`);
                        }
                    }
                }
                console.log(`Successfully loaded ${this.configuredIntegrations.size} remote integrations.`);
            } catch (error: any) {
                console.error(`Error reading remote integrations file (${INTEGRATIONS_FILE_PATH}): ${error.message}. Initializing empty map.`);
                this.configuredIntegrations.clear();
                if (error instanceof SyntaxError) {
                    await fsPromises.writeFile(INTEGRATIONS_FILE_PATH, JSON.stringify({}, null, 2), 'utf-8');
                }
            }
        }

        private async _saveConfiguredIntegrations(): Promise<void> {
            try {
                const jsonObject: Record<string, PersistedRemoteIntegrationConfig> = {};
                for (const [nameSlug, integration] of this.configuredIntegrations.entries()) {
                    jsonObject[nameSlug] = integration;
                }
                const data = JSON.stringify(jsonObject, null, 2);
                await fsPromises.writeFile(INTEGRATIONS_FILE_PATH, data, 'utf-8');
                console.log(`Successfully wrote remote integrations file: ${INTEGRATIONS_FILE_PATH}`);
            } catch (error: any) {
                console.error(`Error writing remote integrations file (${INTEGRATIONS_FILE_PATH}): ${error.message}`);
                throw new RemoteIntegrationManagerError(`Failed to save remote integrations: ${error.message}`);
            }
        }
        ```

## Phase 2: Backend - Remote Service API Interaction & Core Logic (Pipedream Example)

*   **Step 2.1: Discover Apps from Remote Service (Pipedream Example)**
    *   **File:** `aios-desktop-app/src/main/remote-integration-manager.ts`
    *   **Add to `RemoteIntegrationManager` class:**
        ```typescript
        // This method is Pipedream-specific for now.
        // If adding other services, you might have discoverServiceXApps(), or a generic discoverRemoteApps(serviceType)
        async discoverPipedreamApps(searchTerm?: string): Promise<PipedreamAppMetadata[]> {
            if (!PIPEDREAM_API_TOKEN) {
                console.warn('PIPEDREAM_API_TOKEN is not set. Cannot discover Pipedream apps.');
                return [];
            }
            try {
                const params: Record<string, string> = { has_components: '1' };
                if (searchTerm) {
                    params.q = searchTerm;
                }
                const response = await axios.get<{ data: PipedreamAppMetadata[] }>(`${PIPEDREAM_API_BASE_URL}/apps`, {
                    headers: { 'Authorization': `Bearer ${PIPEDREAM_API_TOKEN}`, 'Content-Type': 'application/json' },
                    params: params
                });
                const apps = response.data.data || [];
                apps.forEach(app => {
                    this.appMetadataCache.set(app.name_slug, app);
                    if (app.id) this.appMetadataCache.set(app.id, app);
                });
                return apps;
            } catch (error: any) {
                console.error(`Error fetching discoverable Pipedream apps: ${error.message}`);
                return [];
            }
        }

        // Pipedream-specific detail fetching
        async getPipedreamAppDetails(appIdOrSlug: string): Promise<PipedreamAppMetadata | null> {
            if (this.appMetadataCache.has(appIdOrSlug)) {
                return this.appMetadataCache.get(appIdOrSlug)!;
            }
            if (!PIPEDREAM_API_TOKEN) {
                console.warn('PIPEDREAM_API_TOKEN is not set. Cannot fetch Pipedream app details.');
                return null;
            }
            try {
                const response = await axios.get<{ data: PipedreamAppMetadata }>(`${PIPEDREAM_API_BASE_URL}/apps/${appIdOrSlug}`, {
                    headers: { 'Authorization': `Bearer ${PIPEDREAM_API_TOKEN}`, 'Content-Type': 'application/json' }
                });
                const appDetails = response.data.data;
                if (appDetails) {
                    this.appMetadataCache.set(appDetails.name_slug, appDetails);
                    if (appDetails.id) this.appMetadataCache.set(appDetails.id, appDetails);
                }
                return appDetails;
            } catch (error: any) {
                console.error(`Error fetching Pipedream app details for ${appIdOrSlug}: ${error.message}`);
                return null;
            }
        }
        ```

*   **Step 2.2: Add/Remove Configured Remote Integrations**
    *   **File:** `aios-desktop-app/src/main/remote-integration-manager.ts`
    *   **Add to `RemoteIntegrationManager` class:**
        ```typescript
        // This method currently assumes PipedreamAppMetadata as input.
        // If supporting multiple remote service types, this would need to be more generic or have variants.
        async addConfiguredIntegration(
            appMetadata: PipedreamAppMetadata, // Input is Pipedream-specific for now
            serviceType: 'pipedream' = 'pipedream' // Default to Pipedream
        ): Promise<PersistedRemoteIntegrationConfig> {
            const nameSlug = appMetadata.name_slug;
            if (this.configuredIntegrations.has(nameSlug)) {
                throw new RemoteIntegrationManagerError(`Integration for slug '${nameSlug}' already exists.`);
            }
            const newPersistedConfig: PersistedRemoteIntegrationConfig = {
                appId: appMetadata.id,
                nameSlug: nameSlug,
                cachedDisplayName: appMetadata.name,
                cachedIconUrl: appMetadata.img_src,
                enabled: false,
                serviceType: serviceType,
            };
            this.configuredIntegrations.set(nameSlug, newPersistedConfig);
            await this._saveConfiguredIntegrations();
            console.log(`Added remote integration: ${newPersistedConfig.cachedDisplayName} (Slug: ${nameSlug}, Type: ${serviceType})`);
            return newPersistedConfig;
        }

        async removeConfiguredIntegration(nameSlug: string): Promise<void> {
            if (!this.configuredIntegrations.has(nameSlug)) {
                console.warn(`Remote integration with slug '${nameSlug}' not found for removal.`);
                return;
            }
            if (this.activeConnections.has(nameSlug)) {
                await this.disconnectIntegration(nameSlug);
            }
            this.configuredIntegrations.delete(nameSlug);
            await this._saveConfiguredIntegrations();
            console.log(`Removed remote integration (Slug: ${nameSlug})`);
        }

        getConfiguredIntegrations(): PersistedRemoteIntegrationConfig[] {
            return Array.from(this.configuredIntegrations.values());
        }

        getConfiguredIntegration(nameSlug: string): PersistedRemoteIntegrationConfig | undefined {
            return this.configuredIntegrations.get(nameSlug);
        }
        // Placeholder for disconnectIntegration
        async disconnectIntegration(id: string): Promise<void> { console.log("disconnectIntegration called for " + id); }
        ```

*   **Step 2.3: Enable/Disable Remote Integrations**
    *   **File:** `aios-desktop-app/src/main/remote-integration-manager.ts`
    *   **Add to `RemoteIntegrationManager` class (using `nameSlug` as identifier):**
        ```typescript
        async enableIntegration(nameSlug: string, userId: string): Promise<void> { // Added userId for immediate connect attempt
            const integration = this.configuredIntegrations.get(nameSlug);
            if (!integration) {
                throw new RemoteIntegrationManagerError(`Remote integration with slug '${nameSlug}' not found.`);
            }
            if (integration.enabled) {
                console.log(`Remote integration '${nameSlug}' is already enabled. Attempting reconnect.`);
                await this.connectIntegration(nameSlug, userId);
                return;
            }
            integration.enabled = true;
            this.configuredIntegrations.set(nameSlug, integration);
            await this._saveConfiguredIntegrations();
            console.log(`Enabled remote integration: ${nameSlug}`);
            try {
                await this.connectIntegration(nameSlug, userId);
            } catch (error) {
                console.error(`Failed to connect integration ${nameSlug} for user ${userId} immediately after enabling. Error: ${error}`);
            }
        }

        async disableIntegration(nameSlug: string): Promise<void> {
            const integration = this.configuredIntegrations.get(nameSlug);
            if (!integration) {
                throw new RemoteIntegrationManagerError(`Remote integration with slug '${nameSlug}' not found.`);
            }
            if (!integration.enabled) {
                console.log(`Remote integration '${nameSlug}' is already disabled.`);
                return;
            }
            if (this.activeConnections.has(nameSlug)) {
                await this.disconnectIntegration(nameSlug);
            }
            integration.enabled = false;
            this.configuredIntegrations.set(nameSlug, integration);
            await this._saveConfiguredIntegrations();
            console.log(`Disabled remote integration: ${nameSlug}`);
        }
        // Placeholder for connectIntegration
        async connectIntegration(nameSlug: string, userId: string): Promise<void> { console.log(\`connectIntegration called for ${nameSlug} with user ${userId}\`); }
        ```

## Phase 3: Backend - Connection Logic

*   **Step 3.1: Connect/Disconnect Remote Integrations**
    *   **File:** `aios-desktop-app/src/main/remote-integration-manager.ts`
    *   **Implement `_buildRuntimeDetails`, `connectIntegration`, and `disconnectIntegration` in `RemoteIntegrationManager`:**
        ```typescript
        private async _buildRuntimeDetails(
            nameSlug: string, 
            userId: string 
        ): Promise<RuntimeRemoteIntegrationDetails | null> {
            const persistedConfig = this.configuredIntegrations.get(nameSlug);
            if (!persistedConfig) return null;

            let appMeta: PipedreamAppMetadata | null = null; // Assuming Pipedream for now
            if (persistedConfig.serviceType === 'pipedream') {
                appMeta = this.appMetadataCache.get(nameSlug) || this.appMetadataCache.get(persistedConfig.appId);
                if (!appMeta) {
                    appMeta = await this.getPipedreamAppDetails(persistedConfig.appId || nameSlug);
                }
            }
            // Add logic for other serviceTypes if appMeta structure or fetching differs

            const details: RuntimeRemoteIntegrationDetails = {
                appId: persistedConfig.appId,
                nameSlug: persistedConfig.nameSlug,
                serviceType: persistedConfig.serviceType,
                userId: userId,
                enabled: persistedConfig.enabled,
                displayName: appMeta?.name || persistedConfig.cachedDisplayName,
                description: appMeta?.description,
                iconUrl: appMeta?.img_src || persistedConfig.cachedIconUrl,
                actualMcpEndpoint: '', 
            };
            details.actualMcpEndpoint = this._getMcpEndpoint(details);
            return details;
        }
        
        async connectIntegration(nameSlug: string, userId: string): Promise<void> {
            const runtimeDetails = await this._buildRuntimeDetails(nameSlug, userId);
            if (!runtimeDetails) {
                throw new RemoteIntegrationManagerError(`Remote integration '${nameSlug}' not found or could not build runtime details.`);
            }
            if (!runtimeDetails.enabled) {
                console.log(`Remote integration '${nameSlug}' is not enabled. Skipping connection.`);
                return; 
            }
            if (this.activeConnections.has(nameSlug)) {
                const existing = this.activeConnections.get(nameSlug)!;
                console.log(`Remote integration '${nameSlug}' is already connected or connecting. Awaiting existing promise.`);
                await existing.connectionPromise;
                return;
            }

            const mcpEndpoint = runtimeDetails.actualMcpEndpoint;
            console.log(`Connecting to remote integration: ${runtimeDetails.displayName} (Slug: ${nameSlug}, Type: ${runtimeDetails.serviceType}) at ${mcpEndpoint}`);

            const transport = new StreamableHTTPClientTransport({ url: mcpEndpoint });
            const client = new Client({
                name: `${runtimeDetails.serviceType}-${nameSlug}-client`,
                version: '1.0', 
            });

            const connectionPromise = (async () => {
                try {
                    await client.connect(transport);
                    console.log(`Successfully connected transport for remote integration '${nameSlug}'`);

                    const tools = await loadMcpTools(nameSlug, client, { throwOnLoadError: true });
                    console.log(`Loaded ${tools.length} tools for remote integration '${nameSlug}'`);

                    const activeConnection: ActiveRemoteIntegrationConnection = {
                        details: runtimeDetails,
                        client,
                        transport,
                        tools,
                        connectionPromise: Promise.resolve(), 
                    };
                    this.activeConnections.set(nameSlug, activeConnection);
                    console.log(`Remote integration '${nameSlug}' fully connected and tools loaded.`);
                    // TODO: IPC - Notify renderer
                } catch (err: any) {
                    console.error(`Error connecting to or loading tools for remote integration '${nameSlug}': ${err.message}`);
                    this.activeConnections.delete(nameSlug);
                    await client.close().catch(e => console.error(`Error closing client for ${nameSlug} after failure: ${e.message}`));
                    throw new RemoteIntegrationManagerError(`Failed to connect to remote integration '${nameSlug}': ${err.message}`);
                }
            })();

            this.activeConnections.set(nameSlug, {
                details: runtimeDetails,
                client,
                transport,
                tools: [],
                connectionPromise, 
            });
            await connectionPromise; 
        }

        async disconnectIntegration(nameSlug: string): Promise<void> {
            const activeConnection = this.activeConnections.get(nameSlug);
            if (!activeConnection) {
                console.log(`Remote integration '${nameSlug}' is not currently connected.`);
                return;
            }
            console.log(`Disconnecting from remote integration: ${activeConnection.details.displayName} (Slug: ${nameSlug})`);
            this.activeConnections.delete(nameSlug);

            try {
                 await Promise.race([
                    activeConnection.connectionPromise,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Connection promise timeout')), 5000))
                ]).catch(err => {
                     if (!err.message?.includes('Failed to connect')) { 
                        console.warn(`Error or timeout waiting for connection promise during disconnect for ${nameSlug}: ${err.message}`);
                    }
                });
                await activeConnection.client.close();
                console.log(`Successfully closed client for remote integration '${nameSlug}'`);
            } catch (err: any) { /* ... */ } finally { /* ... TODO: IPC Notify ... */ }
        }

        async disconnectAllIntegrations(): Promise<void> {
            console.log("Disconnecting all active remote integrations...");
            const ids = Array.from(this.activeConnections.keys());
            await Promise.allSettled(ids.map(id => this.disconnectIntegration(id)));
            console.log("Finished disconnecting all remote integrations.");
        }

        connectAllEnabledIntegrations(userId: string): Promise<void[]> {
            console.log(`Attempting to connect all enabled remote integrations for user: ${userId}...`);
            const promises: Promise<void>[] = [];
            for (const persistedConfig of this.configuredIntegrations.values()) {
                if (persistedConfig.enabled) {
                    promises.push(this.connectIntegration(persistedConfig.nameSlug, userId).catch(error => {
                        console.error(`Error auto-connecting remote integration ${persistedConfig.nameSlug}: ${error.message}`);
                    }));
                }
            }
            return Promise.all(promises);
        }
        ```

*   **Step 3.2: Get Active Tools from Remote Integrations**
    *   **File:** `aios-desktop-app/src/main/remote-integration-manager.ts`
    *   **Add to `RemoteIntegrationManager` class:**
        ```typescript
        getActiveIntegrationTools(nameSlug: string): StructuredToolInterface[] { // Renamed param
            return this.activeConnections.get(nameSlug)?.tools ?? [];
        }

        getAllActiveIntegrationTools(): StructuredToolInterface[] { // Renamed method
            let allTools: StructuredToolInterface[] = [];
            for (const [nameSlug, connection] of this.activeConnections.entries()) {
                if (connection.tools.length > 0) { 
                    allTools = allTools.concat(connection.tools.map(tool => ({
                        ...tool,
                        name: `${connection.details.serviceType}_${nameSlug}_${tool.name}`, 
                        description: `(${connection.details.serviceType}: ${connection.details.displayName}) ${tool.description}`,
                        extensionId: nameSlug 
                    })));
                }
            }
            return allTools;
        }

        getConnectedIntegrationsInfo(): RuntimeRemoteIntegrationDetails[] { // Renamed method
            return Array.from(this.activeConnections.values())
                .filter(conn => conn.tools.length > 0) 
                .map(conn => conn.details);
        }
        ```

## Phase 4: Unified Tool Access & Main Process Integration

*   **Step 4.1: Instantiate Managers in `main/index.ts`**
    *   **File:** `aios-desktop-app/src/main/index.ts`
    *   **(Ensure `RemoteIntegrationManager` is imported and instantiated. Update connection logic):**
        ```typitten
        // import { RemoteIntegrationManager } from './remote-integration-manager';
        // const remoteIntegrationManager = new RemoteIntegrationManager();

        // app.whenReady().then(async () => {
        //   // ...
        //   try {
        //       await remoteIntegrationManager.loadConfiguredIntegrations();
        //       const currentUserId = getCurrentUserId(); // Placeholder logic
        //       if (currentUserId) {
        //           await remoteIntegrationManager.connectAllEnabledIntegrations(currentUserId);
        //       } else { /* ... */ }
        //   } catch (error) { /* ... */ }
        //   notifyRemoteIntegrationStatusAndToolsChanged(); // New combined notifier
        // });
        ```

*   **Step 4.2: Create/Update Central Tool Service**
    *   **File:** `aios-desktop-app/src/main/tool-service.ts`
    *   **Update constructor and methods:**
        ```typescript
        // import type { RemoteIntegrationManager } from './remote-integration-manager';
        export class ToolService {
            // ...
            private remoteIntegrationManager: RemoteIntegrationManager;

            constructor(/*extensionManager: ExtensionManager,*/ remoteIntegrationManager: RemoteIntegrationManager) {
                // ...
                this.remoteIntegrationManager = remoteIntegrationManager;
            }

            getAllActiveTools(): StructuredToolInterface[] {
                const localTools: StructuredToolInterface[] = []; // Placeholder
                const remoteTools = this.remoteIntegrationManager.getAllActiveIntegrationTools();
                return [...localTools, ...remoteTools];
            }

            async callTool(toolName: string, params: any, toolExtensionId?: string): Promise<any> {
                const remoteIntegrationConfig = this.remoteIntegrationManager.getConfiguredIntegration(toolExtensionId || "");
                
                if (toolExtensionId && remoteIntegrationConfig && toolName.startsWith(remoteIntegrationConfig.serviceType + '_')) {
                    const activeConnection = this.remoteIntegrationManager['activeConnections'].get(toolExtensionId); // Simplified access for example
                    if (activeConnection?.client) {
                        const nameSlug = toolExtensionId; // which is the nameSlug
                        // Reconstruct original tool name by removing prefix
                        const originalToolName = toolName.replace(`${remoteIntegrationConfig.serviceType}_${nameSlug}_`, '');
                        return activeConnection.client.callTool({ name: originalToolName, arguments: params });
                    }
                } 
                // Add local extension tool calling here if ExtensionManager is integrated
                throw new Error(`Tool call routing for '${toolName}' (extId: ${toolExtensionId}) failed or not implemented.`);
            }
        }
        ```

## Phase 5: IPC Channels (`main/index.ts` and `preload/index.ts`)

*   **Step 5.1: Define IPC Channel Names (`@shared/ipc-channels.ts`)**
    *   **Update channel names:**
        ```typescript
        export const IpcChannels = {
            discoverRemoteApps: 'discover-remote-apps', 
            getRemoteAppDetails: 'get-remote-app-details', 

            getConfiguredRemoteIntegrations: 'get-configured-remote-integrations',
            addRemoteIntegration: 'add-remote-integration', // Payload: PipedreamAppMetadata (or generic RemoteAppMetadata)
            removeRemoteIntegration: 'remove-remote-integration',   
            enableRemoteIntegration: 'enable-remote-integration', // Payload: { nameSlug: string, userId: string }
            disableRemoteIntegration: 'disable-remote-integration', 
            connectRemoteIntegration: 'connect-remote-integration', // Payload: { nameSlug: string, userId: string }
            disconnectRemoteIntegration: 'disconnect-remote-integration',
            getConnectedRemoteIntegrations: 'get-connected-remote-integrations', 

            getAllActiveTools: 'get-all-active-tools', 
            toolsUpdated: 'tools-updated', 
            remoteIntegrationStatusChanged: 'remote-integration-status-changed', 
        };
        ```

*   **Step 5.2: Implement IPC Handlers in `main/index.ts`**
    *   **Update handlers to use `RemoteIntegrationManager` and new channel names. `addRemoteIntegration` takes `PipedreamAppMetadata`. `enableRemoteIntegration` and `connectRemoteIntegration` need `userId`.**
        ```typescript
        // ipcMain.handle(IpcChannels.discoverRemoteApps, async (_event, searchTerm?: string) => {
        //     return remoteIntegrationManager.discoverPipedreamApps(searchTerm); // Still calls Pipedream-specific discovery
        // });
        // ipcMain.handle(IpcChannels.getRemoteAppDetails, async (_event, appIdOrSlug: string) => {
        //     return remoteIntegrationManager.getPipedreamAppDetails(appIdOrSlug);
        // });

        // ipcMain.on(IpcChannels.addRemoteIntegration, async (_event, appMeta: PipedreamAppMetadata) => {
        //     try {
        //         await remoteIntegrationManager.addConfiguredIntegration(appMeta);
        //         notifyRemoteIntegrationStatusAndToolsChanged(); 
        //     } catch (error) { /* ... */ }
        // });
        
        // ipcMain.on(IpcChannels.enableRemoteIntegration, async (_event, { nameSlug, userId }: { nameSlug: string, userId: string }) => {
        //    try {
        //        await remoteIntegrationManager.enableIntegration(nameSlug, userId);
        //        notifyRemoteIntegrationStatusAndToolsChanged();
        //    } catch (error) { /* ... */ }
        // });
        
        // ipcMain.on(IpcChannels.connectRemoteIntegration, async (_event, { nameSlug, userId }: { nameSlug: string, userId: string }) => {
        //    try {
        //        await remoteIntegrationManager.connectIntegration(nameSlug, userId);
        //        notifyRemoteIntegrationStatusAndToolsChanged();
        //    } catch (error) { /* ... */ }
        // });
        
        // // ipcMain.handle(IpcChannels.getAllActiveTools, ...);
        // export function notifyRemoteIntegrationStatusAndToolsChanged() { // Updated name
        //     if (mainWindow) { // Ensure mainWindow is accessible
        //         const configured = remoteIntegrationManager.getConfiguredIntegrations();
        //         const connected = remoteIntegrationManager.getConnectedIntegrationsInfo();
        //         mainWindow.webContents.send(IpcChannels.remoteIntegrationStatusChanged, { configured, connected });
        
        //         if (toolService) { // Ensure toolService is accessible
        //            const allTools = toolService.getAllActiveTools();
        //            const simpleTools = allTools.map(t => ({ name: t.name, description: t.description, extensionId: (t as any).extensionId }));
        //            mainWindow.webContents.send(IpcChannels.toolsUpdated, simpleTools);
        //         }
        //     }
        // }
        ```

*   **Step 5.3: Expose IPC Functions in `preload/index.ts`**
    *   **Update exposed API and listener:**
        ```typescript
            discoverRemoteApps: (searchTerm?: string) => ipcRenderer.invoke(IpcChannels.discoverRemoteApps, searchTerm),
            getRemoteAppDetails: (appIdOrSlug: string) => ipcRenderer.invoke(IpcChannels.getRemoteAppDetails, appIdOrSlug),
            getConfiguredRemoteIntegrations: () => ipcRenderer.invoke(IpcChannels.getConfiguredRemoteIntegrations),
            addRemoteIntegration: (appMeta: PipedreamAppMetadata) => ipcRenderer.send(IpcChannels.addRemoteIntegration, appMeta),
            removeRemoteIntegration: (nameSlug: string) => ipcRenderer.send(IpcChannels.removeRemoteIntegration, nameSlug),
            enableRemoteIntegration: (args: { nameSlug: string, userId: string }) => ipcRenderer.send(IpcChannels.enableRemoteIntegration, args),
            disableRemoteIntegration: (nameSlug: string) => ipcRenderer.send(IpcChannels.disableRemoteIntegration, nameSlug),
            connectRemoteIntegration: (args: { nameSlug: string, userId: string }) => ipcRenderer.send(IpcChannels.connectRemoteIntegration, args),
            disconnectRemoteIntegration: (nameSlug: string) => ipcRenderer.send(IpcChannels.disconnectRemoteIntegration, nameSlug),
            getConnectedRemoteIntegrations: () => ipcRenderer.invoke(IpcChannels.getConnectedRemoteIntegrations),
            
            onRemoteIntegrationStatusChanged: (callback: (status: {configured: PersistedRemoteIntegrationConfig[], connected: RuntimeRemoteIntegrationDetails[]}) => void) => {
                const listener = (_event: any, statusUpdate: any) => callback(statusUpdate);
                ipcRenderer.on(IpcChannels.remoteIntegrationStatusChanged, listener);
                return () => ipcRenderer.removeListener(IpcChannels.remoteIntegrationStatusChanged, listener);
            }
            // onToolsUpdate remains largely the same
        ```

## Phase 6: Frontend Integration (`renderer/src`)

*   **Step 6.1: Define Renderer-Side Display Types (`@shared/types/display.ts`)**
    *   **Update types to be more generic:**
        ```typescript
        import type { SimpleToolInfo } from './index'; 
        import type { PipedreamAppMetadata } from './remote-integration'; 
        import type { PersistedRemoteIntegrationConfig, RuntimeRemoteIntegrationDetails } from './remote-integration';

        export type RemoteDisplayType = 
            | 'remote-configured' 
            | 'remote-discoverable'; // For now, assumes Pipedream is the only source of discoverable remote apps

        export interface BaseRemoteDisplayItem {
            id: string; // discoverable: Pipedream's app_id. configured: nameSlug.
            type: RemoteDisplayType;
            displayName: string;
            description?: string;
            iconUrl?: string; 
            isLoading?: boolean;
            actionError?: string;
        }

        export interface DisplayRemoteConfigured extends BaseRemoteDisplayItem {
            id: string; // This is the nameSlug
            type: 'remote-configured';
            isEnabled: boolean;
            isConnected: boolean;
            tools?: SimpleToolInfo[]; 
            sourceDetails: PersistedRemoteIntegrationConfig; 
            // For richer display, the hook might merge this with PipedreamAppMetadata or RuntimeRemoteIntegrationDetails
        }

        export interface DisplayRemoteDiscoverable extends BaseRemoteDisplayItem {
            id: string; // This is Pipedream's app_id (or other service's equivalent)
            type: 'remote-discoverable';
            sourceDetails: PipedreamAppMetadata; // Specific to Pipedream for now
            // If other services: sourceDetails: RemoteAppMetadata (union type)
        }

        export type RemoteDisplayItem = DisplayRemoteConfigured | DisplayRemoteDiscoverable;
        ```

*   **Step 6.2: Create/Update Renderer Hooks (e.g., `useRemoteIntegrationData.ts`)**
    *   **File:** `aios-desktop-app/src/renderer/src/hooks/useRemoteIntegrationData.ts` (New/Renamed)
    *   **Update state and logic for generic remote integrations (though initially Pipedream-focused):**
        ```typescript
        import type { PipedreamAppMetadata } from '@shared/types/remote-integration';
        import type { PersistedRemoteIntegrationConfig, RuntimeRemoteIntegrationDetails } from '@shared/types/remote-integration';
        import type { DisplayRemoteConfigured, DisplayRemoteDiscoverable, RemoteDisplayItem } from '@shared/types/display';

        interface RemoteIntegrationDataState {
            discoverableApps: PipedreamAppMetadata[]; // Pipedream-specific for now
            configuredPersisted: PersistedRemoteIntegrationConfig[];
            connectedRuntimeDetails: RuntimeRemoteIntegrationDetails[];
            // ...
        }

        export function useRemoteIntegrationData() {
            // ... state ...
            const fetchData = useCallback(async () => {
                // ...
                const [discovered, configured, connectedResult] = await Promise.all([
                    window.api.discoverRemoteApps(), // Fetches Pipedream apps
                    window.api.getConfiguredRemoteIntegrations(),
                    window.api.getConnectedRemoteIntegrations()
                ]);
                // ...
            }, []);

            useEffect(() => {
                fetchData();
                const removeStatusListener = window.api.onRemoteIntegrationStatusChanged(({ configured, connected }) => {
                    setState(prev => ({
                        ...prev,
                        configuredPersisted: configured || [],
                        connectedRuntimeDetails: connected || [],
                    }));
                });
                return () => removeStatusListener();
            }, [fetchData]);
            
            const processedDiscoverable: DisplayRemoteDiscoverable[] = state.discoverableApps.map(appMeta => ({
                id: appMeta.id, 
                type: 'remote-discoverable',
                displayName: appMeta.name,
                description: appMeta.description,
                iconUrl: appMeta.img_src,
                sourceDetails: appMeta, // PipedreamAppMetadata
                isLoading: state.actionStates[appMeta.id], 
            }));
            
            const processedConfigured: DisplayRemoteConfigured[] = state.configuredPersisted.map(persistedConf => {
                const connectedDetail = state.connectedRuntimeDetails.find(conn => conn.nameSlug === persistedConf.nameSlug);
                // Attempt to get richer metadata from discoverable apps list if not connected, or use cache
                const appMetaForDisplay = state.discoverableApps.find(app => app.name_slug === persistedConf.nameSlug);

                return {
                    id: persistedConf.nameSlug, 
                    type: 'remote-configured',
                    displayName: connectedDetail?.displayName || persistedConf.cachedDisplayName || appMetaForDisplay?.name || persistedConf.nameSlug,
                    iconUrl: connectedDetail?.iconUrl || persistedConf.cachedIconUrl || appMetaForDisplay?.img_src,
                    description: connectedDetail?.description || appMetaForDisplay?.description,
                    isEnabled: persistedConf.enabled,
                    isConnected: !!connectedDetail,
                    sourceDetails: persistedConf,
                    isLoading: state.actionStates[persistedConf.nameSlug],
                };
            });

            const addIntegration = useCallback(async (appMeta: PipedreamAppMetadata) => { // appMeta is Pipedream-specific
                setActionState(appMeta.name_slug, true); 
                try {
                    await window.api.addRemoteIntegration(appMeta); // Backend handles creating PersistedRemoteIntegrationConfig
                } catch (err:any) { /* ... */ }
                finally { setActionState(appMeta.name_slug, false); }
            }, [setActionState]);

            const enableIntegration = useCallback(async (nameSlug: string, userId: string) => {
                 setActionState(nameSlug, true);
                 try { await window.api.enableRemoteIntegration({ nameSlug, userId });}
                 catch (err:any) { /* ... */ }
                 finally { setActionState(nameSlug, false); }
            }, [setActionState]);
            
            const connectIntegration = useCallback(async (nameSlug: string, userId: string) => {
                 setActionState(nameSlug, true);
                 try { await window.api.connectRemoteIntegration({ nameSlug, userId });}
                 catch (err:any) { /* ... */ }
                 finally { setActionState(nameSlug, false); }
            }, [setActionState]);


            return {
                discoverableItems: processedDiscoverable,
                configuredItems: processedConfigured,
                // ...
                addIntegration,
                enableIntegration, // expose new action
                connectIntegration, // expose new action
                // ...other actions mapped to window.api calls
            };
        }
        ```

*   **Step 6.3: Create UI Components for Remote Integrations**
    *   Files in `aios-desktop-app/src/renderer/src/components/remote-integrations/`
    *   `RemoteIntegrationsPage.tsx`, `DiscoverRemoteAppsTab.tsx`, `RemoteAppCard.tsx`, `AddRemoteIntegrationModal.tsx`, `ConfiguredRemoteIntegrationsTab.tsx`, `ConfiguredRemoteItem.tsx`.
    *   `AddRemoteIntegrationModal.tsx`: When adding from a `PipedreamAppMetadata` card, it calls `addIntegration(appMetadataFromCard)`. The backend creates the `PersistedRemoteIntegrationConfig`.
    *   `ConfiguredRemoteItem.tsx`: "Enable" and "Connect" buttons will need the dynamic `currentUserId` (from app global state or context) to pass to `enableIntegration(nameSlug, userId)` and `connectIntegration(nameSlug, userId)`.

## Phase 7: Testing and Refinement

*   **Step 7.1: Unit/Integration Tests for Managers**
*   **Step 7.2: End-to-End Testing**
*   **Step 7.3: Code Review and Refactor**

---
This plan provides a comprehensive roadmap. Each step should be reviewed and tested upon completion. 