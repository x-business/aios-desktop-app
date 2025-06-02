import * as fsPromises from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import axios from 'axios';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHTTP.js';
import { loadMcpTools } from '@langchain/mcp-adapters';
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { PersistedRemoteIntegrationConfig, PipedreamAppMetadata, ActiveRemoteIntegrationConnection, RuntimeRemoteIntegrationDetails, PipedreamAppDiscoveryResult, PipedreamPageInfo } from '../shared/types/remote-integration.js';

// Pipedream-Specific Configuration (as Pipedream is the first remote service)
const PIPEDREAM_API_BASE_URL = process.env.PIPEDREAM_API_BASE_URL || 'https://mcp.pipedream.com/api';
const PIPEDREAM_MCP_BASE_URL_TEMPLATE = process.env.PIPEDREAM_MCP_URL_TEMPLATE || 'http://34.51.146.169:3010/v1/{userId}/{slug}';
const PIPEDREAM_API_TOKEN = 'e56cf608b5606021e68881becf0dd81c';

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

    async loadConfiguredIntegrations(): Promise<void> {
        try {
            const data = await fsPromises.readFile(INTEGRATIONS_FILE_PATH, 'utf-8');
            const jsonObject: Record<string, PersistedRemoteIntegrationConfig> = JSON.parse(data);
            this.configuredIntegrations.clear();
            for (const nameSlug in jsonObject) {
                if (Object.prototype.hasOwnProperty.call(jsonObject, nameSlug)) {
                    const entry = jsonObject[nameSlug];
                    if (entry && entry.id && entry.name_slug === nameSlug &&
                        entry.serviceType === 'pipedream' && 
                        typeof entry.enabled === 'boolean' && entry.name) {
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

    // This method is Pipedream-specific for now.
    // If adding other services, you might have discoverServiceXApps(), or a generic discoverRemoteApps(serviceType)
    async discoverPipedreamApps(searchTerm?: string, pageToFetch: number = 1, category?: string): Promise<PipedreamAppDiscoveryResult> {
        // if (!PIPEDREAM_API_TOKEN) {
        //     console.warn('PIPEDREAM_API_TOKEN is not set. Cannot discover Pipedream apps.');
        //     return {
        //         apps: [],
        //         pageInfo: {
        //             currentPage: pageToFetch,
        //             pageSize: 0,
        //             hasMore: false,
        //             totalCount: 0
        //         }
        //     };
        // }

        console.log(`Discovering Pipedream apps. Search: '${searchTerm}', Page: ${pageToFetch}, Category: '${category || "any"}'`);

        try {
            const params: Record<string, string | number> = { has_components: '1', page: pageToFetch };
            if (searchTerm) {
                params.q = searchTerm;
            }
            if (category) {
                params.category = category; // Assuming Pipedream uses 'category' as the query param
            }

            // Define the expected structure of Pipedream's page_info object
            type PipedreamApiResponsePageInfo = {
                total_count: number;
                current_page: number;
                page_size: number;
                has_more: boolean;
            };

            const response = await axios.get<{ data: PipedreamAppMetadata[], page_info: PipedreamApiResponsePageInfo }>(
                `${PIPEDREAM_API_BASE_URL}/apps`,
                {
                    // headers: { 'Authorization': `Bearer ${PIPEDREAM_API_TOKEN}`, 'Content-Type': 'application/json' },
                    params: params
                }
            );

            const fetchedApps = response.data.data || [];
            const pdApiPageInfo = response.data.page_info;

            fetchedApps.forEach(app => {
                if (app.app_hid && !app.img_src) {
                    app.img_src = `https://pipedream.com/s.v0/${app.app_hid}/logo/orig`;
                }
                this.appMetadataCache.set(app.name_slug, app);
                if (app.id) this.appMetadataCache.set(app.id, app);
            });

            const pageInfo: PipedreamPageInfo = {
                currentPage: pdApiPageInfo.current_page,
                pageSize: pdApiPageInfo.page_size,
                totalCount: pdApiPageInfo.total_count,
                hasMore: pdApiPageInfo.has_more,
                nextPage: pdApiPageInfo.has_more ? pdApiPageInfo.current_page + 1 : undefined
            };
            
            console.log(`Successfully discovered ${fetchedApps.length} Pipedream apps on page ${pageToFetch} (Category: '${category || "any"}'). Has more: ${pageInfo.hasMore}`);
            return { apps: fetchedApps, pageInfo };

        } catch (error: any) {
            console.error(`Error fetching Pipedream apps (Page: ${pageToFetch}, Search: '${searchTerm}', Category: '${category || "any"}'): ${error.message}`);
            return {
                apps: [],
                pageInfo: {
                    currentPage: pageToFetch,
                    pageSize: 0,
                    hasMore: false,
                    totalCount: 0,
                    nextPage: undefined
                }
            };
        }
    }

    // Pipedream-specific detail fetching
    async getPipedreamAppDetails(appIdOrSlug: string): Promise<PipedreamAppMetadata | null> {
        if (this.appMetadataCache.has(appIdOrSlug)) {
            const cachedApp = this.appMetadataCache.get(appIdOrSlug)!;
            // Ensure img_src is constructed if not present and app_hid is
            if (cachedApp.app_hid && !cachedApp.img_src) {
                cachedApp.img_src = `https://pipedream.com/s.v0/${cachedApp.app_hid}/logo/orig`;
            }
            return cachedApp;
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
                if (appDetails.app_hid && !appDetails.img_src) {
                    appDetails.img_src = `https://pipedream.com/s.v0/${appDetails.app_hid}/logo/orig`;
                }
                this.appMetadataCache.set(appDetails.name_slug, appDetails);
                if (appDetails.id) this.appMetadataCache.set(appDetails.id, appDetails);
            }
            return appDetails;
        } catch (error: any) {
            console.error(`Error fetching Pipedream app details for ${appIdOrSlug}: ${error.message}`);
            return null;
        }
    }

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
            ...appMetadata,
            enabled: false,
            serviceType: serviceType,
        };
        this.configuredIntegrations.set(nameSlug, newPersistedConfig);
        await this._saveConfiguredIntegrations();
        console.log(`Added remote integration: ${newPersistedConfig.name} (Slug: ${nameSlug}, Type: ${serviceType})`);
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

    async updateIntegrationEnabledStatus(nameSlug: string, enabled: boolean, userId?: string): Promise<void> {
        const integration = this.configuredIntegrations.get(nameSlug);
        if (!integration) {
            throw new RemoteIntegrationManagerError(`Remote integration with slug '${nameSlug}' not found.`);
        }
        if (integration.enabled === enabled) {
            console.log(`Remote integration '${nameSlug}' already has enabled status: ${enabled}.`);
            // If it's already enabled and we want it enabled, try connecting if not already connected and userId is provided
            if (enabled && userId && !this.activeConnections.has(nameSlug)) {
                console.log(`Integration '${nameSlug}' was already enabled, attempting to connect as it's not an active connection.`);
                try {
                    await this.connectIntegration(nameSlug, userId);
                } catch (error: any) {
                    console.error(`Error auto-connecting already enabled integration '${nameSlug}' during status update: ${error.message}`);
                    // Do not re-throw here, as the primary goal (status update) is technically met.
                    // The connectIntegration method will handle its own error reporting/status updates to UI.
                }
            }
            return;
        }

        integration.enabled = enabled;
        this.configuredIntegrations.set(nameSlug, integration);
        await this._saveConfiguredIntegrations();
        console.log(`Updated enabled status for remote integration '${nameSlug}' to ${enabled}.`);

        if (enabled) {
            if (!userId) {
                console.warn(`Cannot connect integration '${nameSlug}' after enabling: userId not provided.`);
                // Optionally, you might want to throw an error or send a specific status to the UI
                // For now, it just logs a warning. The connection won't be attempted.
                return;
            }
            if (this.activeConnections.has(nameSlug)) {
                console.log(`Integration '${nameSlug}' is already connected.`);
                return;
            }
            console.log(`Attempting to connect integration '${nameSlug}' after enabling...`);
            try {
                await this.connectIntegration(nameSlug, userId);
            } catch (error: any) {
                console.error(`Error connecting integration '${nameSlug}' after enabling: ${error.message}`);
                // Do not re-throw, allow the flow to continue. connectIntegration handles its errors.
            }
        } else {
            // If disabling, ensure it's disconnected
            if (this.activeConnections.has(nameSlug)) {
                console.log(`Attempting to disconnect integration '${nameSlug}' after disabling...`);
                await this.disconnectIntegration(nameSlug);
            }
        }
    }

    private async _buildRuntimeDetails(
        nameSlug: string, 
        userId: string 
    ): Promise<RuntimeRemoteIntegrationDetails | null> {
        const persistedConfig = this.configuredIntegrations.get(nameSlug);
        if (!persistedConfig) return null;

        let appMeta: PipedreamAppMetadata | null = null;
        if (persistedConfig.serviceType === 'pipedream') {
            const cachedAppMeta = this.appMetadataCache.get(nameSlug) || this.appMetadataCache.get(persistedConfig.id);
            appMeta = cachedAppMeta === undefined ? null : cachedAppMeta;
            if (!appMeta) {
                appMeta = await this.getPipedreamAppDetails(persistedConfig.id || nameSlug);
            }
        }
        // Add logic for other serviceTypes if appMeta structure or fetching differs

        const details: RuntimeRemoteIntegrationDetails = {
            appId: persistedConfig.id,
            nameSlug: persistedConfig.name_slug,
            serviceType: persistedConfig.serviceType,
            userId: userId,
            enabled: persistedConfig.enabled,
            displayName: appMeta?.name || persistedConfig.name,
            description: appMeta?.description ?? undefined,
            iconUrl: appMeta?.img_src || persistedConfig.img_src,
            categories: appMeta?.categories || persistedConfig.categories || [],
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

        const transport = new StreamableHTTPClientTransport(new URL(mcpEndpoint));
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
                promises.push(this.connectIntegration(persistedConfig.name_slug, userId).catch(error => {
                    console.error(`Error auto-connecting remote integration ${persistedConfig.name_slug}: ${error.message}`);
                }));
            }
        }
        return Promise.all(promises);
    }

    async reconnectIntegration(nameSlug: string, userId: string): Promise<void> {
        console.log(`Attempting to reconnect remote integration: ${nameSlug} for user: ${userId}`);
        const persistedConfig = this.configuredIntegrations.get(nameSlug);

        if (!persistedConfig) {
            throw new RemoteIntegrationManagerError(`Remote integration '${nameSlug}' not found. Cannot reconnect.`);
        }

        if (!persistedConfig.enabled) {
            console.log(`Remote integration '${nameSlug}' is not enabled. Skipping reconnect. Please enable it first.`);
            // Optionally, throw an error or send a specific status to UI that it needs to be enabled first.
            // For now, just logging and returning.
            return;
        }

        // If it's already connecting or connected, we might not need to do much,
        // or we might want to force a disconnect and then a fresh connect.
        // For a simple reconnect, let's try disconnecting first if active, then connecting.
        if (this.activeConnections.has(nameSlug)) {
            console.log(`Integration '${nameSlug}' is currently active or connecting. Disconnecting before reconnecting.`);
            await this.disconnectIntegration(nameSlug); 
            // Add a small delay to ensure disconnection completes before reconnecting
            await new Promise(resolve => setTimeout(resolve, 250)); 
        }

        try {
            await this.connectIntegration(nameSlug, userId);
            console.log(`Successfully reconnected remote integration '${nameSlug}'.`);
        } catch (error: any) {
            console.error(`Error during reconnect for remote integration '${nameSlug}': ${error.message}`);
            // Re-throw the error so the caller (IPC handler) can manage UI feedback
            throw error;
        }
    }

    getActiveIntegrationTools(nameSlug: string): StructuredToolInterface[] {
        return this.activeConnections.get(nameSlug)?.tools ?? [];
    }

    getAllActiveIntegrationTools(): StructuredToolInterface[] {
        let allTools: StructuredToolInterface[] = [];
        for (const [nameSlug, connection] of this.activeConnections.entries()) {
            if (connection.tools.length > 0) { 
                allTools = allTools.concat(connection.tools.map(tool => ({
                    ...tool,
                    name: `int__${nameSlug}__${tool.name}`, 
                    description: tool.description,
                    extensionId: nameSlug,
                    isRemote: true
                })));
            }
        }
        return allTools;
    }

    // Added to explicitly expose the active connections map
    public getActiveConnections(): Map<string, ActiveRemoteIntegrationConnection> {
        return this.activeConnections;
    }

    getConnectedIntegrationsInfo(): RuntimeRemoteIntegrationDetails[] {
        return Array.from(this.activeConnections.values())
            .filter(conn => conn.tools.length > 0) 
            .map(conn => conn.details);
    }
} 