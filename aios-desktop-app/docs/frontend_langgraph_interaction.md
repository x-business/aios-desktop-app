# Frontend Interaction with LangGraph Backend

This document outlines how the frontend application connects to and interacts with the LangGraph backend, focusing on connection management, thread handling, run initiation, and passing custom configurations.

## Project Structure Overview

The relevant frontend code resides primarily within the `/src/renderer/src` directory, structured as a React/TypeScript project using Vite. Key subdirectories include:

-   `components/`: Reusable UI components (including the main chat interface).
-   `hooks/`: Custom React hooks.
-   `lib/`: Utility functions and API key handling (`@/lib/api-key`).
-   `providers/`: React Context providers for managing application state related to LangGraph (`ThreadProvider`, `StreamProvider`) and client instantiation (`client.ts`).

## Core Files and Components

-   **`src/renderer/src/main.tsx`**: The application entry point. It sets up routing and wraps the main `App` component with essential providers, including `ThreadProvider` and `StreamProvider`.
-   **`src/renderer/src/providers/client.ts`**: Contains the `createClient` function, which instantiates the LangGraph `Client` from `@langchain/langgraph-sdk` using the provided `apiUrl` and `apiKey`.
-   **`src/renderer/src/providers/ThreadProvider.tsx`**: Manages fetching and providing a list of existing threads. It uses the `createClient` function and fetches threads based on `apiUrl` and `assistantId` (obtained from URL query parameters). It *does not* handle initiating new runs.
-   **`src/renderer/src/providers/StreamProvider.tsx`**: The core component for managing the real-time connection.
    -   It uses the `useStream` hook from `@langchain/langgraph-sdk/react`.
    -   Handles initial setup: If `apiUrl` or `assistantId` are missing from the URL, it prompts the user for the Deployment URL, Assistant/Graph ID, and an optional API Key (stored in local storage).
    -   Calls `useStream` with `apiUrl`, `apiKey`, `assistantId`, and `threadId` (also from URL query parameters).
    -   Manages the WebSocket connection and provides the stream state (messages, errors, loading status) and control functions (like `submit`) via React Context (`StreamContext`).
-   **`src/renderer/src/components/thread/index.tsx`**: The main chat interface component.
    -   Consumes the `StreamContext` using the `useStreamContext` hook.
    -   Handles user input and message submission in the `handleSubmit` function.
    -   Calls `stream.submit()` to send messages to the backend and initiate new runs.

## Connection and Thread Management

1.  **Connection:** Established and managed by the `useStream` hook within `StreamProvider`. It uses `apiUrl`, `apiKey`, and `assistantId` for connection details.
2.  **Thread Identification:** The specific chat thread is identified by `threadId`, passed to `useStream`.
3.  **Thread Creation:** If `threadId` is not initially provided (e.g., a new chat session), the `useStream` hook likely handles the creation of a new thread implicitly when the first message is sent via `stream.submit()`. The backend assigns a new `threadId`, which is then received by the frontend via the `onThreadId` callback in `useStream`'s configuration and updated in the URL.
4.  **Thread Listing:** `ThreadProvider` is responsible for fetching and displaying the list of available threads for the given `assistantId`.

## Initiating Runs and Streaming Responses

-   Runs are initiated when the user sends a message.
-   The `handleSubmit` function in `components/thread/index.tsx` captures the user input.
-   It calls `stream.submit(input, options)`. This function, provided by `useStream`, sends the `input` payload over the established WebSocket connection to the backend graph.
-   The backend processes the input, runs the graph, and streams back responses (messages, UI updates), which are handled by `useStream` and update the state managed by `StreamProvider`.

## Sending Custom Configuration

To send custom configuration data along with a message (run initiation), you need to modify the `input` payload passed to `stream.submit()`.

1.  **Backend Requirement:** Ensure your LangGraph backend graph is designed to accept and process the custom configuration within its input schema.
2.  **Frontend Modification:** Update the `handleSubmit` function in `src/renderer/src/components/thread/index.tsx`. Add your custom configuration object as a property within the first argument passed to `stream.submit()`.

    **Example:**

    ```typescript
    // In src/renderer/src/components/thread/index.tsx, inside handleSubmit:

    const myCustomConfig = {
      user_preference: "detailed",
      session_id: "xyz789",
      // Add other custom key-value pairs here
    };

    const newHumanMessage: Message = {
      id: uuidv4(),
      type: "human",
      content: input,
    };

    const toolMessages = ensureToolCallsHaveResponses(stream.messages);

    // Modify this call to include your custom config
    stream.submit(
      {
        messages: [...toolMessages, newHumanMessage],
        custom_config: myCustomConfig, // <-- Add your config object here
      },
      {
        streamMode: ["values"],
        optimisticValues: (prev) => ({
          // ... (optimistic update logic)
        }),
      },
    );
    ```

This modification ensures your custom data is sent as part of the payload for each run initiated by the user's message. 