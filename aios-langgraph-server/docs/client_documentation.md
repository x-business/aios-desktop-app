# LangGraph Client Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Code Documentation](#code-documentation)
   - [config.ts](#configts)
   - [websocketClient.ts](#websocketclientts)
   - [connectionService.ts](#connectionservicets)
   - [mcpClient.ts](#mcpclientts)
   - [authService.ts](#authservicets)
   - [client.ts](#clientts)
4. [Required Packages](#required-packages)
5. [Integration Guide](#integration-guide)
   - [React Integration](#react-integration)
   - [Setup Instructions](#setup-instructions)
   - [API Reference](#api-reference)
6. [Environment Variables](#environment-variables)

## Introduction

This client package facilitates communication with a LangGraph server, enabling AI agents to leverage tools that reside on the client machine rather than the server. The architecture uses a combination of WebSockets and HTTP/RESTful API requests:

- HTTP/REST: Used for standard LangGraph operations (creating threads, assistants, etc.)
- WebSockets: Used to proxy tool calls from the server to the client where the actual tools reside

This implementation enables a powerful pattern where:
1. The LangGraph server manages the AI agent's state, conversation thread, and execution flow
2. When a tool call is needed, the server sends the request to the client via WebSocket
3. The client executes the tool locally and returns the result back to the server
4. The server continues processing with the tool's results

## Architecture Overview

The client consists of several key components that work together:

1. **WebSocketClient** (`websocketClient.ts`): Handles low-level WebSocket communication
2. **ConnectionService** (`connectionService.ts`): Manages the WebSocket connection lifecycle and processes tool calls
3. **MCPClient** (`mcpClient.ts`): Provides access to local tools via LangChain's Model-Calling-Protocol (MCP)
4. **AuthService** (`authService.ts`): Handles authentication with the LangGraph server
5. **Config** (`config.ts`): Manages configuration settings from environment variables
6. **Client** (`client.ts`): Main entry point that coordinates all components

### Communication Flow

1. Client connects to the WebSocket endpoint at `ws://server/ws`
2. Server assigns a unique connection ID that identifies this client
3. Client uses the LangGraph HTTP API to create a thread and run with this connection ID 
4. When the agent needs to call a tool:
   - Server sends a tool call message via WebSocket
   - Client receives the message, executes the tool locally
   - Client sends the result back through the WebSocket
5. Server continues processing agent execution with the tool results 

## Code Documentation

### config.ts

The configuration module loads environment variables and provides default values.

```typescript
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from the parent directory (client/)
const envPath = path.resolve(__dirname, '../.env');
const result = dotenv.config({ path: envPath });

const OPENAI_CHAT_MODEL = "openai/gpt-4o";
const GOOGLE_GENAI_CHAT_MODEL = "google_genai/gemini-2.5-pro-exp-03-25";
const CLAUDE_CHAT_MODEL = "anthropic/claude-3-5-sonnet-latest";

if (result.error) {
    console.warn(`Warning: Could not load .env file from ${envPath}. Using defaults or environment variables. Error: ${result.error.message}`);
}

interface Config {
    langGraphApiUrl: string;
    webSocketUrl: string;
    authApiUrl: string;
    modelName: string;
    systemPrompt: string;
}

const config: Config = {
    langGraphApiUrl: process.env.LANGGRAPH_API_URL || 'http://127.0.0.1:8000',
    webSocketUrl: process.env.WEBSOCKET_URL || 'ws://127.0.0.1:8000/ws',
    authApiUrl: process.env.AUTH_API_URL || 'http://127.0.0.1:8000',
    modelName: process.env.MODEL_NAME || OPENAI_CHAT_MODEL,
    systemPrompt: process.env.SYSTEM_PROMPT || "You are a helpful AI assistant that can use tools remotely."
};

// Validate URLs (simple check)
if (!config.langGraphApiUrl.startsWith('http')) {
    console.error(`Invalid LANGGRAPH_API_URL: ${config.langGraphApiUrl}`);
    process.exit(1);
}
if (!config.webSocketUrl.startsWith('ws')) {
    console.error(`Invalid WEBSOCKET_URL: ${config.webSocketUrl}`);
    process.exit(1);
}

console.log('Configuration loaded:');
console.log(` - LangGraph API URL: ${config.langGraphApiUrl}`);
console.log(` - WebSocket URL: ${config.webSocketUrl}`);
console.log(` - Auth API URL: ${config.authApiUrl}`);
console.log(` - Model Name: ${config.modelName}`);
console.log(` - System Prompt: ${config.systemPrompt}`);

export default config;
```

### websocketClient.ts

Low-level WebSocket client that handles connection lifecycle and message passing.

```typescript
import WebSocket from 'ws';

interface WebSocketMessage {
    type: string;
    data?: any;
    tool_call_id?: string;
    connection_id?: string;
}

class WebSocketClient {
    private wsUrl: string;
    private ws: WebSocket | null;
    private isConnected: boolean;
    private messageHandlers: ((message: any) => void)[];
    private connectionPromise: Promise<void> | null = null;
    private connectionResolve: (() => void) | null = null;
    private connectionReject: ((reason?: any) => void) | null = null;

    constructor(url: string) {
        this.wsUrl = url;
        this.ws = null;
        this.isConnected = false;
        this.messageHandlers = [];
    }

    connect(): Promise<void> {
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.connectionPromise = new Promise((resolve, reject) => {
            this.connectionResolve = resolve;
            this.connectionReject = reject;

            console.log(`Attempting to connect to WebSocket server at ${this.wsUrl}`);
            this.ws = new WebSocket(this.wsUrl);

            this.ws.on('open', () => {
                console.log(`Connected to WebSocket server at ${this.wsUrl}`);
                this.isConnected = true;
                if (this.connectionResolve) {
                    this.connectionResolve();
                }
            });

            this.ws.on('message', (data: WebSocket.RawData) => {
                this.handleMessage(data);
            });

            this.ws.on('error', (error: Error) => {
                console.error('WebSocket error:', error);
                this.isConnected = false;
                this.resetConnectionPromise();
                if (this.connectionReject) {
                    this.connectionReject(error);
                }
            });

            this.ws.on('close', (code, reason) => {
                const reasonStr = reason ? reason.toString() : 'No reason provided';
                console.log(`WebSocket connection closed. Code: ${code}, Reason: ${reasonStr}`);
                this.isConnected = false;
                this.resetConnectionPromise();
                if (this.connectionReject) {
                    this.connectionReject(new Error(`WebSocket closed unexpectedly. Code: ${code}, Reason: ${reasonStr}`));
                }
            });
        });
        return this.connectionPromise;
    }

    private resetConnectionPromise() {
        this.connectionPromise = null;
        this.connectionResolve = null;
        this.connectionReject = null;
    }

    private handleMessage(rawData: WebSocket.RawData): void {
        try {
            const message = JSON.parse(rawData.toString());
            this.messageHandlers.forEach(handler => handler(message));
        } catch (error) {
            console.error('Failed to parse incoming WebSocket message:', rawData.toString(), error);
        }
    }

    onMessage(handler: (message: any) => void): void {
        this.messageHandlers.push(handler);
    }

    send(data: any): void {
        if (!this.isConnected || !this.ws) {
            console.error('WebSocket send error: Not connected.');
            throw new Error('WebSocket is not connected');
        }
        try {
            this.ws.send(JSON.stringify(data));
        } catch (error) {
            console.error('WebSocket send error:', error);
            throw error;
        }
    }

    close(code?: number, reason?: string): void {
        if (this.ws) {
            console.log(`Closing WebSocket connection... Code: ${code}, Reason: ${reason}`)
            this.ws.close(code, reason);
            this.resetConnectionPromise();
        }
    }
}

export default WebSocketClient;
```

### mcpClient.ts

Provides access to local tools via LangChain's Model-Calling-Protocol (MCP).

```typescript
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { StructuredToolInterface } from '@langchain/core/tools';
/**
 * A class to handle MCP client operations
 */
export class MCPClientService {
    private mcpClient: MultiServerMCPClient;
    private initialized: boolean = false;

    constructor() {
        this.mcpClient = new MultiServerMCPClient();
    }

    /**
     * Initialize connections to MCP servers
     */
    async initialize(): Promise<void> {
        if (!this.initialized) {
            await this.mcpClient.initializeConnections();
            this.initialized = true;
        }
    }

    /**
     * Get all available tools from the MCP client
     */
    getTools(): StructuredToolInterface[] {
        if (!this.initialized) {
            throw new Error('MCP client not initialized. Call initialize() first.');
        }
        return this.mcpClient.getTools();
    }

    /**
     * Generic function to call a tool with given name and parameters
     * @param toolName The name of the tool to call
     * @param params Parameters required for the tool
     * @returns Promise with the tool execution result
     */
    async callTool<T = any>(toolName: string, params: Record<string, any>): Promise<T> {
        if (!this.initialized) {
            throw new Error('MCP client not initialized. Call initialize() first.');
        }
        
        // Get all available tools
        const tools = this.mcpClient.getTools();
        
        // Find the specific tool by name
        const tool = tools.find(t => t.name === toolName);
        
        if (!tool) {
            throw new Error(`Tool "${toolName}" not found`);
        }
        
        try {
            // Call the tool with provided parameters
            const result = await tool.invoke(params);
            return result as T;
        } catch (error: any) {
            // Enhance error message with tool context
            throw new Error(`Error executing tool "${toolName}": ${error.message}`);
        }
    }

    /**
     * Close the MCP client connections
     */
    close(): void {
        if (this.initialized) {
            this.mcpClient.close();
            this.initialized = false;
        }
    }
}

// Export singleton instance for use throughout the application
export const mcpClientService = new MCPClientService();
```

### connectionService.ts

Manages the WebSocket connection lifecycle and tool execution protocol.

```typescript
import WebSocketClient from './websocketClient.js';
import { mcpClientService } from './mcpClient.js'; // Assuming this is the tooling service
import config from './config.js';

interface ConnectionEstablishedMessage {
    type: 'connection_established';
    connection_id: string;
}

interface ToolCallMessage {
    type: 'tool_call';
    tool_call_id: string;
    data: {
        name: string;
        arguments: any;
    };
}

/**
 * Manages the WebSocket connection lifecycle and application-specific protocol
 * for interacting with the AIOS tool server.
 */
class ConnectionService {
    private wsClient: WebSocketClient;
    private toolingService: typeof mcpClientService; // Use the actual type if available
    private connectionId: string | null = null;
    private isReady: boolean = false;
    private readyPromise: Promise<string>;
    private resolveReady!: (connectionId: string) => void;
    private rejectReady!: (reason?: any) => void;

    constructor(websocketClient: WebSocketClient, toolingService: typeof mcpClientService) {
        this.wsClient = websocketClient;
        this.toolingService = toolingService;
        this.readyPromise = new Promise((resolve, reject) => {
            this.resolveReady = resolve;
            this.rejectReady = reject;
        });
    }

    /**
     * Initializes the connection:
     * 1. Connects the WebSocketClient.
     * 2. Sets up message handling for the application protocol.
     * 3. Waits for the 'connection_established' message.
     * @returns {Promise<string>} Resolves with the connection ID when ready.
     */
    async initialize(): Promise<string> {
        // Register message handler *before* connecting
        this.wsClient.onMessage(this.handleWebSocketMessage.bind(this));

        try {
            // Attempt to connect
            await this.wsClient.connect();
            console.log('ConnectionService: WebSocket connected.');

            // Now wait for the connection_established message (max 5 seconds)
            const timeoutPromise = new Promise<string>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout waiting for connection_established message')), 5000)
            );

            // Race the readyPromise against the timeout
            this.connectionId = await Promise.race([this.readyPromise, timeoutPromise]);
            this.isReady = true;
            console.log(`ConnectionService: Ready. Received Connection ID: ${this.connectionId}`);
            return this.connectionId;

        } catch (error) {
            console.error('ConnectionService: Initialization failed.', error);
            this.isReady = false;
            // Ensure wsClient is closed if connection attempt partially succeeded but setup failed
            this.wsClient.close();
            throw error; // Re-throw the error for the main application flow
        }
    }

    private handleWebSocketMessage(message: any): void {
        // console.log('ConnectionService received message:', message); // Debug log

        if (typeof message !== 'object' || message === null) {
            console.warn('ConnectionService: Received non-object message, ignoring:', message);
            return;
        }

        switch (message.type) {
            case 'connection_established':
                const connMsg = message as ConnectionEstablishedMessage;
                if (connMsg.connection_id) {
                    if (!this.isReady) { // Only resolve the initial promise once
                        this.resolveReady(connMsg.connection_id);
                    } else {
                        // Already initialized, maybe log a warning?
                        console.warn('ConnectionService: Received duplicate connection_established message.');
                        this.connectionId = connMsg.connection_id; // Update just in case?
                    }
                } else {
                    console.error('ConnectionService: Received connection_established message without connection_id.');
                    if (!this.isReady) {
                        this.rejectReady(new Error('Received invalid connection_established message'));
                    }
                }
                break;

            case 'tool_call':
                this.handleToolCall(message as ToolCallMessage);
                break;

            // Handle other potential message types from the server if needed
            // case 'error':
            //     console.error('ConnectionService: Received error message from server:', message.data);
            //     break;

            default:
                console.warn(`ConnectionService: Received unhandled message type '${message.type}', ignoring.`);
        }
    }

    private async handleToolCall(toolMessage: ToolCallMessage): Promise<void> {
        console.log('ConnectionService handling tool call:', toolMessage);
        let responsePayload: any;
        let status: 'success' | 'error' = 'success';
        let errorMessage: string | undefined = undefined;

        if (!toolMessage.tool_call_id || !toolMessage.data || !toolMessage.data.name) {
            console.error('ConnectionService: Received invalid tool_call message structure:', toolMessage);
            status = 'error';
            errorMessage = 'Invalid tool_call message structure received';
            responsePayload = null;
        } else {
            try {
                const rawResponse = await this.toolingService.callTool(toolMessage.data.name, toolMessage.data.arguments);

                // Handle potential stringified JSON from tool service
                if (typeof rawResponse === 'string') {
                    try {
                        responsePayload = JSON.parse(rawResponse);
                    } catch (parseError) {
                        console.warn("Tool response was string, but failed JSON parse. Sending raw string.", parseError);
                        responsePayload = rawResponse;
                    }
                } else {
                    responsePayload = rawResponse;
                }
            } catch (toolError: any) {
                console.error(`ConnectionService: Error executing tool ${toolMessage.data.name}:`, toolError);
                status = 'error';
                errorMessage = toolError.message || 'Unknown error during tool execution';
                responsePayload = null;
            }
        }

        // Construct the response object
        const toolResponse = {
            tool_call_id: toolMessage.tool_call_id,
            response: {
                status: status,
                result: status === 'success' ? responsePayload : undefined,
                error: status === 'error' ? errorMessage : undefined
            }
        };

        console.log('ConnectionService sending tool response:', JSON.stringify(toolResponse, null, 2));
        try {
            this.wsClient.send(toolResponse);
        } catch (sendError) {
            console.error('ConnectionService: Failed to send tool response via WebSocket:', sendError);
            // What should happen if sending the response fails?
        }
    }

    getConnectionId(): string {
        if (!this.isReady || !this.connectionId) {
            throw new Error('ConnectionService is not ready or connection ID not received.');
        }
        return this.connectionId;
    }

    close(): void {
        console.log('ConnectionService closing WebSocket client.');
        this.isReady = false;
        this.connectionId = null;
        // Reset the promise in case of reconnection logic later
        this.readyPromise = new Promise((resolve, reject) => {
            this.resolveReady = resolve;
            this.rejectReady = reject;
        });
        this.wsClient.close();
    }
}

export default ConnectionService;
```

### authService.ts

Handles authentication with the LangGraph server.

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import config from './config.js';

interface TokenData {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface UserInfo {
    username: string;
    email: string;
}

class AuthService {
    private apiClient: AxiosInstance;
    private token: string | null = null;
    private tokenExpiry: number | null = null;

    constructor(baseURL: string) {
        this.apiClient = axios.create({
            baseURL: baseURL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Interceptor to add the token to requests if available
        this.apiClient.interceptors.request.use(
            (config) => {
                if (this.token && Date.now() < (this.tokenExpiry ?? 0)) {
                    config.headers.Authorization = `Bearer ${this.token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );
    }

    private handleApiError(error: unknown, context: string): never {
        let message = `Error ${context}: `;
        if (axios.isAxiosError(error)) {
            message += error.response?.data?.detail || error.response?.data?.message || error.message;
        } else if (error instanceof Error) {
            message += error.message;
        } else {
            message += 'An unknown error occurred.';
        }
        console.error(message, error); // Log the full error for debugging
        throw new Error(message); // Throw a new error with combined info
    }

    private setToken(tokenData: TokenData): void {
        this.token = tokenData.access_token;
        // Store expiry time (in milliseconds) for potential future checks
        this.tokenExpiry = Date.now() + tokenData.expires_in * 1000;
        console.log("Token stored successfully.");
        // In a real app, you'd store this more securely (e.g., secure storage)
    }

    getToken(): string | null {
        // Basic check for expiry, though not strictly enforced here for simplicity
        if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.token;
        }
        this.token = null; // Clear expired token
        this.tokenExpiry = null;
        return null;
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    async register(username: string, email: string, password: string): Promise<UserInfo> {
        try {
            const response = await this.apiClient.post<UserInfo>('/register', {
                username,
                email,
                password,
            });
            console.log(`User ${response.data.username} registered successfully.`);
            return response.data;
        } catch (error) {
            this.handleApiError(error, 'during registration');
        }
    }

    async login(username: string, password: string): Promise<TokenData> {
        try {
            const response = await this.apiClient.post<TokenData>('/login', {
                username,
                password,
            });
            this.setToken(response.data);
            return response.data;
        } catch (error) {
            this.handleApiError(error, 'during login');
        }
    }

    async getCurrentUser(): Promise<UserInfo | null> {
        if (!this.isLoggedIn()) {
            console.log("Not logged in.");
            return null;
        }
        try {
            const response = await this.apiClient.get<UserInfo>('/me');
            return response.data;
        } catch (error) {
             // If token is invalid/expired server-side, it might throw 401
             if (axios.isAxiosError(error) && error.response?.status === 401) {
                console.warn("Token might be invalid or expired. Clearing local token.");
                this.token = null;
                this.tokenExpiry = null;
             } else {
                this.handleApiError(error, 'fetching current user');
             }
             return null; // Return null on error
        }
    }

    // Add other methods like changePassword, updateUsername later if needed
}

// Initialize and export a singleton instance
const authService = new AuthService(config.authApiUrl); // Assuming authApiUrl is added to config

export default authService;
``` 