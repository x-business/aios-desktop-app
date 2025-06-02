export interface MCPExtensionInfo {
  id: string;
  path: string;
  iconPath?: string;
  name: string;
  description?: string;
  command: string;
  args: string[];
  transport: 'stdio';
  manifest: MCPExtensionManifest;
}

/**
 * System information for providing context to the AI
 */
export interface SystemInfo {
  platform: string;      // Operating system platform
  release: string;       // OS release version
  arch: string;          // CPU architecture
  hostname: string;      // Device hostname
  cpus?: {               // CPU information
    model: string;       // CPU model
    speed: number;       // CPU speed in MHz
  }[];
  totalMemoryMB: number; // Total system memory in MB
  username?: string;     // Username (needed for path construction)
}

export interface MCPExtensionManifest {
  name: string;
  version: string;
  displayName: string;
  description?: string;
  runtime: 'node' | 'python';
  executable: string;
  frontend: string;
  icon?: string;
  args?: string[];
  // configSchema?: object; // Optional future use
}

/**
 * Represents an entry in the online extension registry (registry.json).
 */
export interface ExtensionRegistryEntry {
    id: string;                 // Unique identifier (matches eventual folder name)
    name: string;               // Display name
    version: string;            // Latest available version (SemVer)
    description?: string;       // Optional description
    icon?: string;              // URL to an icon (optional)
    author?: string;            // Extension author (optional)
    repository?: string;        // URL to source code repository (optional)
    downloadUrls: {             // Download URLs per platform
        win32?: string;
        darwin?: string;
        linux?: string;
        default?: string;
    };
}

/**
 * Structure of the data stored for each managed extension in extensions.json
 */
export interface ManagedExtensionStatus {
    id: string;
    version: string; // Version when it was managed
    enabled: boolean; // Whether to auto-connect
}

/** Simplified tool information for the UI */
export interface SimpleToolInfo {
  name: string;
  description: string;
}

/** WebSocket connection state information (no tools) */
export interface ConnectionState {
  status: ConnectionStatus;
  connectionId: string | null;
  error: ConnectionError | null;
}

/**
 * Types for WebSocket communication with the LangGraph server
 */

/**
 * Represents any message sent or received over the WebSocket.
 * Specific message types below narrow this down.
 */
export type WebSocketMessage = 
  | ToolRegistrationMessage 
  | ConnectionEstablishedMessage 
  | ToolCallMessage 
  | ToolResponseMessage
  // Add other message types here (e.g., PingMessage, ErrorMessageFromServer)
  | { type: string; payload?: any; }; // Fallback for unknown types

/**
 * Message sent by the client when registering available tools
 * (Note: Currently unused in the main process flow, as tools are sent via HTTP)
 */
export interface ToolRegistrationMessage {
  type: 'register_tools';
  payload: { // Added payload wrapper for consistency
    tools: ToolDefinition[];
  };
}

/**
 * Connection established message sent by the server
 */
export interface ConnectionEstablishedMessage {
  type: 'connection_established';
  payload: { // Added payload wrapper
    connection_id: string;
  };
}

/**
 * Tool call message sent by the server
 */
export interface ToolCallMessage {
  type: 'tool_call';
  payload: { // Added payload wrapper
    tool_call_id: string;
    tool_name: string;
    tool_params: Record<string, any>;
  };
}

/**
 * Tool response message sent by the client (main process)
 */
export interface ToolResponseMessage {
  type: 'tool_response'; // Added type field
  payload: { // Added payload wrapper
    tool_call_id: string;
    result?: any; // Result if successful
    error?: string; // Error message if failed
  };
}

/**
 * Definition of a tool for registration with the server
 * (Also used when sending tools via HTTP)
 */
export interface ToolDefinition {
  name: string;
  description: string;
  // Assuming LangChain tool schema structure
  schema: { 
    // Standard JSON schema representation
    title?: string; // Often the tool name again
    description?: string; // Tool description
    type: 'object';
    properties: Record<string, { 
        type: string; 
        description?: string;
        // Add other JSON schema properties as needed (e.g., enum, items)
    }>;
    required?: string[];
  };
}

/**
 * Status of the WebSocket connection managed by the Main process
 */
export type ConnectionStatus = 
  | 'disconnected'    // No connection attempt has been made or connection closed
  | 'initializing'    // MCP client initializing before connection attempt
  | 'connecting'      // WebSocket connection attempt in progress
  | 'connected'       // WebSocket connected, waiting for registration/ID from server
  | 'registering'     // (Optional) If main process sends registration message
  | 'registered'      // Connected and server assigned connectionId
  | 'error';          // Error occurred with connection or MCP initialization

/**
 * Configuration options passed from Renderer to Backend via HTTP
 */
export interface LangGraphRunConfig {
  websocket_connection_id: string; // ID received via IPC from main process
  tools: ToolDefinition[]; // Tool list received via IPC from main process
  [key: string]: any;  // Additional custom configuration
}

/**
 * Error details provided to the Renderer via IPC
 */
export interface ConnectionError {
  message: string;
  // Type to categorize the error source
  type: 'initialization' | 'websocket' | 'message_processing' | 'mcp' | 'unknown'; 
  code?: number | string; // Optional WebSocket close code or other relevant code
  timestamp?: number; // Optional timestamp
} 