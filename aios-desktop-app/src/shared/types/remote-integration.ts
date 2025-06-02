import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import type { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHTTP.js';
import type { StructuredToolInterface } from '@langchain/core/tools';

/**
 * Represents the metadata for a Pipedream app as fetched from their API's /apps endpoint.
 * This is what we get when "discovering" apps.
 */
export interface PipedreamAppMetadata {
    id: string;                 // e.g., "app_mWnheL" (was app_id)
    app_hid: string;            // e.g., "app_mWnheL" - For constructing image URLs
    name_slug: string;          // e.g., "slack_bot"
    name: string;               // e.g., "Slack Bot"
    description: string | null;
    img_src?: string;            // e.g., "https://assets.pipedream.net/s.v0/app_mWnheL/logo/orig" (was icon_url)
    categories?: string[];
    auth_type?: string;          // e.g., "keys", "oauth" - New
    custom_fields_json?: string; // JSON string for custom auth fields, e.g., "[{\"name\":\"bot_token\",...}]" - New
    featured_weight?: number;    // New
    // TODO: Are there other fields from Pipedream's /apps endpoint we might want?
    // Check https://pipedream.com/docs/api/rest-api/#get-apps
}

// Add other AppMetadata types here if integrating other remote services, e.g.:
// export interface ServiceXAppMetadata { /* ... */ }
// export type RemoteAppMetadata = PipedreamAppMetadata | ServiceXAppMetadata;

/**
 * Represents the configuration of a remote integration that is persisted by AIOS.
 * This includes all original Pipedream app metadata plus AIOS-specific state.
 */
export interface PersistedRemoteIntegrationConfig extends PipedreamAppMetadata {
    enabled: boolean;
    serviceType: 'pipedream'; // | 'otherService'; // Example for future extension
    // Potential future fields:
    // accountId?: string; // If multiple accounts of the same integration are allowed
    // lastSync?: string; // Timestamp of last synchronization
    // customUserConfig?: Record<string, any>; // For user-specific settings not part of app metadata
}

export interface PipedreamPageInfo {
    currentPage: number;
    pageSize: number;
    totalCount?: number;
    hasMore: boolean;
    nextPage?: number;
}

export interface PipedreamAppDiscoveryResult {
    apps: PipedreamAppMetadata[];
    pageInfo: PipedreamPageInfo;
}

/**
 * In-memory, enriched representation of a configured remote integration,
 * combining persisted config with dynamic runtime data.
 */
export interface RuntimeRemoteIntegrationDetails {
    appId: string;                   // From persisted config
    nameSlug: string;                // From persisted config
    serviceType: string;             // From persisted config
    userId: string;                  // Dynamically obtained user ID for MCP URL construction
    enabled: boolean;                // From persisted config
    
    displayName: string;             // Initially from cache, then updated from fresh API call
    description?: string;            // Fetched from remote API
    iconUrl?: string;                // Fetched from remote API
    
    categories?: string[];           // Added
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