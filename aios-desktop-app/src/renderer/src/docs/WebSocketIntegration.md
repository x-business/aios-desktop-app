# WebSocket Client Integration Guide

This guide explains how to integrate the WebSocket client for LangGraph remote tool execution into your React application.

## Overview

The WebSocket client enables client-side tool execution for LangGraph agents. Instead of executing tools on the server, the LangGraph server can send tool execution requests to the client, which executes the tools locally and sends the results back to the server.

## Installation

Make sure you have the required dependencies installed:

```bash
npm install @langchain/mcp-adapters @langchain/core
```

## Integration Steps

### 1. Add the WebSocketProvider to your application

First, wrap your application with the `WebSocketProvider` component:

```tsx
// In your App.tsx or main.tsx
import { WebSocketProvider } from './providers/WebSocketProvider';
import { getWebSocketUrl } from './lib/websocket-config';

function App() {
  // Get WebSocket URL from config
  const wsUrl = getWebSocketUrl();
  
  return (
    <WebSocketProvider webSocketUrl={wsUrl} autoConnect={true}>
      {/* Your application components */}
      <YourApp />
    </WebSocketProvider>
  );
}
```

### 2. Use the enhanced LangGraph hook

In your chat components, use the enhanced `useLangGraphWithTools` hook instead of the standard `useStream` hook:

```tsx
// In your chat component
import { useLangGraphWithTools } from '../hooks/useLangGraphWithTools';

function ChatComponent() {
  const {
    messages,
    submit,
    connectionReady,
    connectionStatus,
    // ... other stream properties
  } = useLangGraphWithTools({
    apiUrl: "http://localhost:8000",
    apiKey: "your-api-key",  // Optional
    assistantId: "your-assistant-id"
  });
  
  const handleSubmit = async (input: string) => {
    if (!connectionReady) {
      console.error("WebSocket connection not ready. Cannot send message.");
      return;
    }
    
    await submit({
      messages: [...messages, { content: input, type: "human" }]
      // No need to manually add connection_id and tools,
      // the hook will add them automatically
    });
  };
  
  return (
    <div>
      {/* Display connection status */}
      <WebSocketStatus />
      
      {/* Your chat UI */}
      <div className="messages">
        {messages.map(message => (
          <div key={message.id} className={`message ${message.type}`}>
            {message.content}
          </div>
        ))}
      </div>
      
      {/* Input form */}
      <form onSubmit={e => {
        e.preventDefault();
        const input = e.target.elements.messageInput.value;
        handleSubmit(input);
        e.target.reset();
      }}>
        <input
          name="messageInput"
          placeholder="Type your message..."
          disabled={!connectionReady}
        />
        <button type="submit" disabled={!connectionReady}>
          Send
        </button>
      </form>
    </div>
  );
}
```

### 3. Configure your LangGraph server

On the server side, make sure your LangGraph application is configured to use WebSocket-based tool execution. The server should:

1. Accept WebSocket connections
2. Register client tools
3. Send tool call requests to the client
4. Use the client's connection ID in the LangGraph agent's configuration

## Advanced Usage

### Accessing the WebSocket connection directly

If you need direct access to the WebSocket connection:

```tsx
import { useWebSocket } from '../providers/WebSocketProvider';

function YourComponent() {
  const { 
    connectionService, 
    connectionId, 
    status, 
    tools,
    connect,
    disconnect
  } = useWebSocket();
  
  // Use the connection properties as needed
  
  return (
    <div>
      <p>Connection status: {status}</p>
      <p>Connection ID: {connectionId || 'Not connected'}</p>
      <p>Available tools: {tools.length}</p>
      
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

### Custom Tool Execution

If you need more control over tool execution:

```tsx
import { useWebSocket } from '../providers/WebSocketProvider';
import { mcpClientService } from '../lib/mcp-client';

function CustomToolHandler() {
  const { connectionService } = useWebSocket();
  
  useEffect(() => {
    // Initialize MCP client
    mcpClientService.initialize().catch(console.error);
    
    // Custom tool call handler
    const unsubscribe = connectionService?.onToolCall(async (toolCall) => {
      try {
        // Custom logic before executing the tool
        console.log(`Custom handling for tool: ${toolCall.data.name}`);
        
        // Execute the tool
        const result = await mcpClientService.callTool(
          toolCall.data.name,
          toolCall.data.arguments
        );
        
        // Custom post-processing of the result
        const processedResult = processResult(result);
        
        // Send the response back through the connection service
        connectionService.sendToolResponse(toolCall.tool_call_id, {
          status: 'success',
          result: processedResult
        });
      } catch (error) {
        // Handle errors
        connectionService.sendToolResponse(toolCall.tool_call_id, {
          status: 'error',
          error: error.message
        });
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [connectionService]);
  
  // Component UI
}
```

## Troubleshooting

### Connection Issues

- Check that the WebSocket URL is correct
- Ensure the server is running and has WebSocket support enabled
- Look for CORS issues in browser developer tools
- Check for network connectivity problems

### Tool Execution Issues

- Ensure MCP tools are properly initialized
- Check that tool names match between client and server
- Verify that tool arguments are correctly formatted
- Look for errors in the browser console

## Further Help

See the source code documentation for more details on the WebSocket client implementation. 