Okay, factoring in your clarifications, here is the refined, detailed plan to move both WebSocket communication and MCP client logic to the Electron main process:
Goal: Centralize WebSocket connection management and MCP tool execution in the main process for better access to Node.js APIs and system resources. The renderer will interact via secure IPC to get status and the necessary tool information for HTTP requests.
Phase 1: Main Process Implementation
Create MainConnectionManager:
Location: electron/main/connection-manager.ts (or similar).
Responsibilities:
Initialize and manage MCPClientService (reading mcp.json using fs/path).
Initialize and manage WebSocketClient (using a configurable webSocketUrl).
Handle the full WebSocket lifecycle (connect, message parsing, error, close).
Execute MCP tools upon receiving tool_call via WebSocket.
Maintain connection state (status, connectionId, tools list, error).
Provide state and control via IPC.
Details:
Constructor: Accepts configuration (e.g., webSocketUrl). Instantiates MCPClientService and WebSocketClient.
initialize() Method:
Calls mcpClientService.initialize().
Stores the result: this.tools = mcpClientService.getTools().
Calls this.webSocketClient.connect(). (Auto-connect for now).
Sets initial status to 'initializing' or 'connecting'.
Sends initial state update to renderer.
WebSocketClient Event Handlers:
onOpen: Log connection attempt. Update status if needed.
onMessage:
Parse message.
connection_established: Store connectionId, set status = 'registered', notify renderer.
tool_call: Asynchronously await this.mcpClientService.callTool(...), send tool_response (success or error) back via WebSocket. Log interactions.
Other messages: Handle as needed.
onError: Set status = 'error', store error, notify renderer.
onClose: Set status = 'disconnected', clear connectionId, notify renderer. (Implement optional auto-reconnect later).
State Management: Keep track of status, connectionId, tools, error.
notifyRendererState() Method: Sends the entire current state object { status, connectionId, tools, error } via mainWindow.webContents.send('connection-state-update', state). Called whenever state changes.
getState() Method: Returns the current state object synchronously.
(Future) connect()/disconnect() Methods: Wrap webSocketClient.connect() and webSocketClient.close(), updating status and notifying renderer.
Integrate into Main Process Entry (electron/main/index.ts):
Import MainConnectionManager.
Import MCPClientService and WebSocketClient (if not fully encapsulated in MainConnectionManager).
After the main window (mainWindow) is created:
Determine the webSocketUrl (e.g., from config, env variables, or derived).
Instantiate const mainConnectionManager = new MainConnectionManager({ webSocketUrl });.
Call mainConnectionManager.initialize();.
Store the instance for IPC handlers.
Setup IPC Handlers (ipcMain):
ipcMain.handle('get-connection-state', () => { return mainConnectionManager.getState(); });
(Future) ipcMain.handle('connect-websocket', async () => { await mainConnectionManager.connect(); return mainConnectionManager.getState(); });
(Future) ipcMain.handle('disconnect-websocket', async () => { await mainConnectionManager.disconnect(); return mainConnectionManager.getState(); });
Phase 2: Secure IPC via Preload Script
Modify electron/preload/index.ts:
Use contextBridge.exposeInMainWorld precisely as planned:
Apply to index.ts
Update Renderer TypeScript Definitions: Ensure src/renderer/src/vite-env.d.ts (or similar) accurately types the exposed window.electron.ipcRenderer object.
Phase 3: Renderer Refactoring
Remove Obsolete Files:
Delete src/renderer/src/lib/connection-service.ts.
Delete src/renderer/src/lib/websocket-client.ts.
Delete src/renderer/src/lib/mcp-client.ts (as its responsibility moves to main).
Refactor WebSocketProvider (src/renderer/src/providers/WebSocketProvider.tsx):
Remove ConnectionService instantiation and related logic.
Manage state (status, connectionId, tools, error) using useState.
useEffect for Initial State:
Apply to index.ts
useEffect for State Updates:
Apply to index.ts
Context Value: Provide { status, connectionId, tools, error }. Remove connectionService, connect, disconnect.
Refactor useLangGraphWithTools (src/renderer/src/hooks/useLangGraphWithTools.ts):
Keep using the (refactored) useWebSocket hook.
Get status, connectionId, tools from the context.
The core logic remains: In the overridden submit function, inject connection_id: connectionId and tools: tools (the list now provided by the main process via IPC) into config.configurable.
Add connectionReady = status === 'registered' to the return value. You can use this in the UI component to disable the submit button if not ready.
Update UI (WebSocketStatus.tsx, Thread/index.tsx):
WebSocketStatus should work mostly as-is, consuming the updated context.
Thread/index.tsx: Can use stream.connectionReady (from useLangGraphWithTools) to conditionally disable the send button or show a warning if the WebSocket isn't registered yet.
Phase 4: Cleanup and Testing
Remove Unused Imports/Code: Clean up renderer components.
Configuration: Ensure the webSocketUrl is correctly configured/passed to the main process. Remove related config logic from the renderer (main.tsx).
Testing: Thoroughly test the end-to-end flow:
App start -> Main process initializes MCP & WebSocket.
Renderer receives initial state via IPC.
Renderer sends HTTP request with tools & connection ID.
Backend sends tool_call via WebSocket.
Main process receives tool_call, executes via MCP, sends tool_response.
Backend continues.
Renderer state updates correctly on connect/disconnect/error.
This detailed plan addresses your requirements, ensures secure IPC, and establishes a clear separation of concerns between the Electron main and renderer processes.