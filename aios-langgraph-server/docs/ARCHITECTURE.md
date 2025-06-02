# AIOS LangGraph Server Architecture

This document provides an overview of the AIOS LangGraph Server project, detailing its structure, components, and the unique communication flow it employs.

## Project Goal

The primary goal of this project is to host a LangGraph agent (specifically a ReAct-style agent) while enabling the agent to utilize tools that reside and execute on the *client's* machine, rather than on the server where the agent logic runs.

## High-Level Workflow

The system uses a hybrid communication model:

1.  **Agent Interaction (HTTP):** The main interaction with the LangGraph agent (invoking runs, streaming messages/responses) is handled via standard HTTP requests facilitated by the LangGraph SDK. The client interacts with the LangGraph-managed endpoints.
2.  **Tool Execution (WebSocket):** When the agent needs to execute a tool during its reasoning process, a dedicated WebSocket connection is used to send the tool call request to the specific client, execute the tool on the client-side, and return the result back to the server to continue the agent's execution.

## Core Components

### `src/react_agent/`

This is the main Python package containing the server-side agent logic.

#### `src/react_agent/web/`

This sub-package manages the WebSocket communication layer specifically for remote tool execution.

*   **`server.py`**:
    *   Runs a FastAPI application dedicated to WebSocket connections on the `/ws` endpoint.
    *   **Responsibilities:**
        *   Accepts new WebSocket connections from clients.
        *   Receives an initial configuration message from each client containing the `tools` they can execute.
        *   Uses the `ConnectionManager` to register the connection and its associated tools, generating a unique `connection_id`.
        *   Sends the `connection_id` back to the client.
        *   Listens for incoming messages. Critically, it listens for tool *responses* from the client, identified by a `tool_call_id`.
        *   Routes these responses to the `ConnectionManager`'s `handle_response` method.
        *   Handles WebSocket disconnections.
*   **`connection.py`**:
    *   Defines the `ConnectionManager` (singleton) and `WebSocketConnection` dataclass.
    *   **Responsibilities:**
        *   Maintains a registry (`active_connections`) of currently connected clients, mapping `connection_id` to their WebSocket object and tool definitions.
        *   Manages pending tool calls using a dictionary (`response_callbacks`) that maps `tool_call_id` to `asyncio.Future` objects.
        *   `connect()`: Stores new connection details.
        *   `disconnect()`: Cleans up connection details.
        *   `call_tool()`:
            *   Called by the LangGraph agent (`graph.py`).
            *   Creates an `asyncio.Future` to represent the pending result.
            *   Stores the Future using the `tool_call_id`.
            *   Sends the `tool_call` request (name, args, `tool_call_id`) over the correct client's WebSocket.
            *   Returns the Future immediately to the caller (`graph.py`).
        *   `handle_response()`:
            *   Called by `server.py` when a tool result arrives via WebSocket.
            *   Finds the corresponding Future using `tool_call_id`.
            *   Sets the result on the Future (`future.set_result(response_data)`), unblocking the waiting code in `graph.py`.
*   **`connection_factory.py`**: Provides a simple way to get the singleton instance of `ConnectionManager`.

#### `src/react_agent/` (Main Agent Logic)

*   **`graph.py`**:
    *   Defines the core LangGraph `StateGraph` for the ReAct agent.
    *   **Nodes:**
        *   `call_model`: Invokes the LLM (configured with client-provided tools via `RunnableConfig`), processes the response, and updates the state. Passes the `websocket_connection_id` in the state.
        *   `tools_node` (Custom): Replaces the standard `ToolNode`. When the model decides to call tools:
            *   Retrieves the `websocket_connection_id` from the state.
            *   For each tool call, it uses `ConnectionManager.call_tool()` to send the request via WebSocket and gets back an `asyncio.Future`.
            *   It `await`s this Future, effectively pausing graph execution for that tool call until the result is received via WebSocket and the Future is resolved by `handle_response`.
            *   Formats the received results and updates the graph state.
    *   **Edges:** Defines the flow: `__start__` -> `call_model`. `call_model` conditionally routes to `tools_node` (if tool calls exist) or `__end__`. `tools_node` always routes back to `call_model`.
    *   **Compilation:** Compiles the graph into an executable object.
*   **`state.py`**: Defines the `State` (likely a TypedDict) used within the LangGraph graph, including fields for messages, configuration, `websocket_connection_id`, and `user_tools`.
*   **`configuration.py`**: Defines the `Configuration` object, likely used with `RunnableConfig` to pass settings (model, system prompt, tools, `websocket_connection_id`) into the graph execution.
*   **`tools.py`**: May contain structures or enums related to tools, but the actual execution is delegated.
*   **`prompts.py`**: Stores prompt templates (e.g., the ReAct system prompt).
*   **`utils.py`**: Helper functions.

### Client-Side (`client.ts` - For Context)

*   Connects to both the LangGraph HTTP endpoint (using `@langchain/langgraph-sdk`) and the WebSocket endpoint (`/ws`).
*   On WebSocket connection, sends its available `tools` to the server.
*   Receives and stores the `connection_id` from the server.
*   When invoking the agent via the LangGraph SDK, it passes the `connection_id` and serialized `tools` in the `config`.
*   Listens on the WebSocket for `tool_call` messages from the server.
*   When a `tool_call` message is received, it executes the specified tool locally (e.g., using `mcpClientService`).
*   Sends the tool's result back over the WebSocket, including the original `tool_call_id`.
*   Receives the agent's streamed messages/final response via the LangGraph SDK's HTTP connection.

## Interaction Flow Summary

1.  **Client Connect (WS):** Client -> `/ws` endpoint (`server.py`). Tools registered, `connection_id` returned.
2.  **Agent Invoke (HTTP):** Client (SDK) -> LangGraph endpoint. `config` includes `connection_id` and `tools`. -> `graph.py` (`call_model`).
3.  **Tool Call Req (Internal):** `call_model` -> LLM requests tool -> State updated -> `route_model_output` -> `tools_node`.
4.  **Tool Call Delegate (WS):** `tools_node` -> `connection.py` (`call_tool`) -> Sends msg to Client. Graph pauses (`await future`).
5.  **Tool Exec (Client):** Client receives WS msg -> Executes tool locally.
6.  **Tool Result (WS):** Client sends result msg -> `/ws` endpoint (`server.py`) -> `connection.py` (`handle_response`) -> Resolves Future.
7.  **Graph Resume (Internal):** `await future` in `tools_node` unblocks -> Processes result -> Updates state.
8.  **Cycle/End (Internal):** `tools_node` -> `call_model`. Model processes result -> Generates response or calls another tool.
9.  **Agent Response (HTTP):** LangGraph endpoint -> Streams response back to Client (SDK).

This architecture cleverly separates the agent's reasoning loop (managed by LangGraph on the server) from the tool execution environment (managed by the client), using WebSockets as the bridge for asynchronous tool calls. 