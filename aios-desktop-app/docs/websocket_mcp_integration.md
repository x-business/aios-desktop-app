# Frontend WebSocket & MCP Integration Documentation

This document details the components added to the React frontend to enable communication with the LangGraph backend via WebSockets for client-side tool execution using the Model-Calling Protocol (MCP).

## Overview

The core idea is to allow the LangGraph agent running on the server to request the execution of tools that reside on the client machine. This is achieved through a dedicated WebSocket connection managed by the frontend, alongside the standard HTTP streaming handled by the LangGraph SDK.

1.  **WebSocket Connection**: The frontend establishes and maintains a WebSocket connection to a specific endpoint on the backend (e.g., `/ws`).
2.  **MCP Client**: The frontend initializes an MCP client that discovers and connects to local tool servers defined in `src/renderer/mcp.json`.
3.  **Tool Registration**: Upon successful WebSocket connection, the frontend sends a list of available MCP tools (their definitions) to the backend.
4.  **Connection ID**: The backend registers the client and sends back a unique `connection_id`.
5.  **Run Initiation**: When the user sends a message, the frontend uses the enhanced `useLangGraphWithTools` hook. This hook automatically injects the `connection_id` and the registered `tools` into the `config.configurable` object sent to the LangGraph backend via the standard `stream.submit` method.
6.  **Tool Call Request**: If the backend agent decides to use a client-side tool, it sends a `tool_call` message over the WebSocket to the specific client using the `connection_id`.
7.  **Tool Execution**: The frontend receives the `tool_call`, uses the `MCPClientService` to execute the requested tool locally with the provided arguments.
8.  **Tool Response**: The frontend sends the tool's result (or error) back to the backend over the WebSocket, referencing the original `tool_call_id`.
9.  **Agent Continues**: The backend receives the result, resolves the pending tool call, and the LangGraph agent continues its execution.

## Core Components & Files

Here's a breakdown of the newly added files and their roles:

### Libraries (`src/renderer/src/lib/`)

*   **`websocket-client.ts` (`WebSocketClient` class)**
    *   **Purpose**: Provides a low-level, reusable class for managing a raw WebSocket connection.
    *   **Functionality**: Handles connection opening, message sending/receiving, error handling, and closing.
    *   **Usage**: Instantiated and used internally by `ConnectionService`.

*   **`mcp-client.ts` (`MCPClientService` class, `mcpClientService` singleton)**
    *   **Purpose**: Manages the connection to local MCP tool servers.
    *   **Functionality**: Reads configuration from `src/renderer/mcp.json`, initializes connections to defined MCP servers (like `windows_cli`, `filesystem`, etc.), discovers available tools, provides methods to get tool definitions (`getTools`) and execute tools (`callTool`).
    *   **Usage**: Used by `ConnectionService` during tool registration and execution.

*   **`connection-service.ts` (`ConnectionService` class)**
    *   **Purpose**: Orchestrates the WebSocket connection lifecycle and the tool execution protocol.
    *   **Functionality**: Uses `WebSocketClient` to connect. Initializes `mcpClientService`. Registers discovered tools with the backend upon connection. Listens for `tool_call` messages from the backend. Delegates tool execution to `mcpClientService`. Sends tool responses back. Manages connection state (`status`, `connectionId`, `error`). Provides event listeners (`onStatusChange`, `onError`, `onToolCall`).
    *   **Usage**: Instantiated and managed by `WebSocketProvider`.

*   **`websocket-config.ts` (Utility Functions)**
    *   **Purpose**: Provides helper functions for managing WebSocket connection URLs.
    *   **Functionality**: `getWebSocketUrl` (retrieves URL from query params or local storage), `saveWebSocketUrl`, `deriveWebSocketUrl` (infers WS URL from HTTP API URL).
    *   **Usage**: Used by `WebSocketProvider` to determine the connection endpoint.

### Types (`src/renderer/src/types/`)

*   **`websocket-types.ts` (Interfaces & Types)**
    *   **Purpose**: Defines the TypeScript structures for messages exchanged over the WebSocket (e.g., `ToolRegistrationMessage`, `ConnectionEstablishedMessage`, `ToolCallMessage`, `ToolResponseMessage`), tool definitions (`ToolDefinition`, `ToolParameters`), connection status (`ConnectionStatus`), and the configuration object (`LangGraphRunConfig`) expected by the backend.
    *   **Usage**: Used throughout the WebSocket-related components for type safety.

### Providers (`src/renderer/src/providers/`)

*   **`WebSocketProvider.tsx` (`WebSocketProvider` component, `useWebSocket` hook)**
    *   **Purpose**: Manages the `ConnectionService` instance and provides WebSocket connection state via React Context.
    *   **Functionality**: Creates a `ConnectionService` instance. Handles auto-connection. Provides the service instance, `connectionId`, `status`, `error`, and registered `tools` through the `useWebSocket` hook.
    *   **Usage**: Wrap relevant parts of your application (likely near the root, potentially inside or alongside `StreamProvider`) with `<WebSocketProvider>`. Components can then use the `useWebSocket` hook to access connection details.

### Hooks (`src/renderer/src/hooks/`)

*   **`useLangGraphWithTools.ts` (`useLangGraphWithTools` hook)**
    *   **Purpose**: Seamlessly integrates WebSocket tool capabilities with the existing chat functionality.
    *   **Functionality**: It's a **wrapper** around the `useStreamContext` hook (from `@/providers/Stream`). It retrieves the WebSocket `connectionId` and `tools` from `useWebSocket`. It overrides the `submit` method returned by `useStreamContext`. The new `submit` method automatically injects the `connection_id` and `tools` into the `config.configurable` object passed to the backend.
    *   **Usage**: **Replace** calls to `useStreamContext` in your chat component (`src/renderer/src/components/thread/index.tsx`) with calls to `useLangGraphWithTools`. The rest of the chat component logic remains largely the same, as the hook returns an object with the same shape as `useStreamContext`, plus `connectionReady` and `connectionStatus`.

### UI Components (`src/renderer/src/components/ui/`)

*   **`WebSocketStatus.tsx` (`WebSocketStatus` component)**
    *   **Purpose**: A simple UI component to display the current status of the WebSocket connection.
    *   **Functionality**: Uses the `useWebSocket` hook to get the connection `status`, `connectionId`, and `error`, and displays them visually. Includes a reconnect button on error/disconnect.
    *   **Usage**: Place this component anywhere within the `WebSocketProvider` context (e.g., in the header or footer of the chat interface) to show the connection status.

## Integration Guide

1.  **Wrap with Provider**: In your main application setup (`src/renderer/src/main.tsx` or `App.tsx`), wrap the relevant part of your component tree (likely including the `StreamProvider`) with `WebSocketProvider`:

    ```tsx
    import React from 'react';
    import ReactDOM from 'react-dom/client';
    import { App } from './App'; // Your main App component
    import { StreamProvider } from './providers/Stream';
    import { WebSocketProvider } from './providers/WebSocketProvider';
    import { getWebSocketUrl, deriveWebSocketUrl } from './lib/websocket-config';
    import { getApiKey } from './lib/api-key';

    // Assuming you get apiUrl, assistantId from URL or config
    const apiUrl = /* ... get API URL ... */;
    const assistantId = /* ... get Assistant ID ... */;
    const apiKey = getApiKey(); 

    // Derive or get WebSocket URL
    const wsUrl = getWebSocketUrl() || deriveWebSocketUrl(apiUrl);

    ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
      <React.StrictMode>
        <WebSocketProvider webSocketUrl={wsUrl} autoConnect={true}>
          <StreamProvider 
            apiUrl={apiUrl}
            assistantId={assistantId}
            apiKey={apiKey}
          >
            <App />
          </StreamProvider>
        </WebSocketProvider>
      </React.StrictMode>,
    );
    ```

2.  **Update Chat Component**: Modify `src/renderer/src/components/thread/index.tsx` to use the new hook:

    ```diff
    // src/renderer/src/components/thread/index.tsx
    import { cn } from "@/lib/utils";
    -import { useStreamContext } from "@/providers/Stream";
    +import { useLangGraphWithTools } from "@/hooks/useLangGraphWithTools";
    import { useState, FormEvent } from "react";
    import { Button } from "../ui/button";
    ...
    +import WebSocketStatus from "../ui/WebSocketStatus"; // Import the status component

    export function Thread() {
      ...
      const [input, setInput] = useState("");
      ...

    - const stream = useStreamContext();
    + const stream = useLangGraphWithTools(); // Use the enhanced hook
      const messages = stream.messages;
      const isLoading = stream.isLoading;

    ...

      const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
    +   // Check connection readiness before submitting if needed (optional, submit handles error)
    +   // if (!stream.connectionReady) { 
    +   //   toast.error("Cannot send message: WebSocket not ready for tools.");
    +   //   return;
    +   // }
        if (!input.trim() || isLoading) return;
        setFirstTokenReceived(false);

        const newHumanMessage: Message = {
          id: uuidv4(),
          type: "human",
          content: input,
        };

        const toolMessages = ensureToolCallsHaveResponses(stream.messages);

        // The enhanced stream.submit now automatically adds WebSocket config
        stream.submit(
          { messages: [...toolMessages, newHumanMessage] },
          {
            streamMode: ["values"],
            optimisticValues: (prev) => ({
              ...prev,
              messages: [
                ...(prev.messages ?? []),
                ...toolMessages,
                newHumanMessage,
              ],
            }),
            // You can still add other submit options here if needed
            // config: { configurable: { some_other_config: 'value' } }
          },
        );

        setInput("");
      };

      ...

      return (
        <div className="flex w-full h-screen overflow-hidden">
          {/* ... Sidebar ... */}
          <motion.div
             /* ... Motion props ... */
          >
            {chatStarted && (
              <div className="flex items-center justify-between gap-3 p-2 pl-4 z-10 relative">
                {/* ... Header content ... */}
    +           <WebSocketStatus className="ml-auto" /> {/* Add status display */}
              </div>
            )}
            {/* ... Rest of the component ... */}
          </motion.div>
        </div>
      );
    }
    ```

3.  **Configure MCP**: Ensure `src/renderer/mcp.json` correctly defines the local tool servers you want to make available to the agent.

4.  **Backend Setup**: Make sure your LangGraph backend is configured to:
    *   Accept WebSocket connections on the specified path (e.g., `/ws`).
    *   Handle the `register_tools` message.
    *   Store the client's `connection_id` and associated tools.
    *   Use a custom `tools_node` (as described in `my_backend_langgraph_server_and_concepts.md`) that uses the `connection_id` from the `config.configurable` input to delegate tool calls over the correct WebSocket.
    *   Handle incoming tool responses via WebSocket. 