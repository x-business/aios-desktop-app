// src/renderer/src/config.ts

// Read environment variables once and export them
export const apiUrl = import.meta.env.VITE_PUBLIC_LANGGRAPH_API_URL ??"http://34.51.146.169:2024";
export const assistantId = import.meta.env.VITE_PUBLIC_LANGGRAPH_ASSISTANT_ID ?? "agent";
export const langsmithApiKey = import.meta.env.VITE_PUBLIC_LANGSMITH_API_KEY ?? "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";

// --- Add STT WebSocket URL ---
export const sttWebSocketUrl = import.meta.env.VITE_STT_WEBSOCKET_URL ?? 'ws://34.51.146.169:2024/stt/stt-stream';

// You can add other configuration values here as needed
export const DEFAULT_RECURSION_LIMIT = 100;
// Basic validation (optional but recommended)
if (!apiUrl) {
  console.error("Configuration error: VITE_PUBLIC_LANGGRAPH_API_URL is not defined in the environment variables.");
  // Optionally, throw an error or set a default, depending on how critical this is
  // throw new Error("Missing required configuration: API URL");
}

if (!assistantId) {
  console.warn("Configuration warning: VITE_PUBLIC_LANGGRAPH_ASSISTANT_ID is not defined in the environment variables.");
  // Assistant ID might be optional or have a default, so a warning might suffice
}

// --- Add validation for STT URL (optional) ---
if (!sttWebSocketUrl) {
  console.error("Configuration error: VITE_STT_WEBSOCKET_URL is not defined in the environment variables and no default is set.");
  // Decide if this is critical and should throw an error
} 