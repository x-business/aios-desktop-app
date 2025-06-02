# Frontend Guide: Using the Streaming STT WebSocket Endpoint

This guide explains how the frontend application (e.g., Electron/React) can connect to and interact with the backend's real-time Speech-to-Text (STT) WebSocket endpoint.

## 1. Endpoint URL

*   **URL**: `wss://<your_backend_host_and_port>/stt/stt-stream`
    *   Replace `<your_backend_host_and_port>` with the actual address where your Python FastAPI server is running (e.g., `localhost:8000` during development).
    *   The path is composed of the STT router's prefix (`/stt`) and the specific endpoint (`/stt-stream`).

## 2. Establishing the Connection

*   Open a standard WebSocket connection to the URL specified above.
*   Once the connection is accepted by the backend, you can start sending audio data.

```typescript
// Example (TypeScript)
const socket: WebSocket = new WebSocket("wss://localhost:8000/stt/stt-stream");

socket.onopen = () => {
  console.log("STT WebSocket connection established.");
  // Now ready to send audio or an initial configuration message (if supported)
};

socket.onclose = (event: CloseEvent) => {
  console.log(`STT WebSocket connection closed: ${event.code} ${event.reason}`);
};

socket.onerror = (event: Event) => {
  console.error("STT WebSocket error:", event);
  // Handle UI updates for errors (e.g., display a message)
};
```

## 3. Sending Audio Data

*   **Format**: Audio data must be sent as **binary WebSocket frames** (e.g., `ArrayBuffer` or `Blob`).
*   **Audio Configuration**: The backend's Deepgram integration is currently configured with the following defaults:
    *   **Encoding**: `linear16` (Raw PCM, signed 16-bit, little-endian)
    *   **Sample Rate**: `16000` Hz
    *   **Channels**: `1` (Mono)
    *   It is **critical** that the audio captured by the `MediaRecorder` (or other audio source) on the frontend matches these parameters. If `MediaRecorder` cannot directly provide `linear16` PCM, the frontend might need to transcode or ensure it sends a format the backend can be reconfigured to handle (this would require backend changes to `LiveOptions`).
    *   When using `MediaRecorder`, configure its `audioBitsPerSecond`, `mimeType`, etc., to align as closely as possible or handle the raw PCM data directly if available.

```typescript
// Example: Sending an audio chunk (assuming 'audioBlob' is a Blob from MediaRecorder)
if (socket.readyState === WebSocket.OPEN) {
  socket.send(audioBlob as Blob); // or send an ArrayBuffer
}
```

*   **Initial Configuration Message (Client to Server - Optional, Future Enhancement)**:
    *   Currently, the backend uses default audio settings (16kHz, linear16, mono) and Deepgram model/language settings from its configuration.
    *   If the client needs to specify different audio parameters (e.g., a different sample rate) or a different language model, this would require sending a JSON configuration message immediately after the WebSocket `onopen` event.
    *   **This functionality is NOT YET IMPLEMENTED on the backend.** The backend `stt_stream_endpoint` has a TODO placeholder for handling such text/JSON messages. If this is needed, the backend would need to be updated to parse a message like:
        ```json
        // Example of a potential future configuration message from client
        // {
        //   "action": "configure",
        //   "audio_options": {
        //     "sample_rate": 48000,
        //     "encoding": "linear16",
        //     "channels": 1
        //   },
        //   "language": "fr-FR"
        // }
        ```
    *   For now, assume the default backend settings.

## 4. Receiving Messages from the Backend

*   The backend will send JSON messages to the client. Implement an `onmessage` handler to process these.

```typescript
// Define expected message structures (optional but good practice)
interface SttTranscriptMessage {
  type: "interim_transcript" | "final_transcript";
  transcript: string;
}

interface SttErrorMessage {
  type: "error";
  message: string;
}

interface SttStatusMessage {
  type: "status";
  message?: string;
  event?: string;
}

type SttMessage = SttTranscriptMessage | SttErrorMessage | SttStatusMessage;

socket.onmessage = (event: MessageEvent) => {
  if (typeof event.data === 'string') {
    try {
      const message = JSON.parse(event.data) as SttMessage;
      console.log("Received from STT backend:", message);

      switch (message.type) {
        case "interim_transcript":
        case "final_transcript":
          // Update UI with transcription results
          console.log(`${message.type === "interim_transcript" ? "Interim" : "Final"} Transcript:`, message.transcript);
          // Example: setInput((prevInput) => 
          //   message.type === "interim_transcript" 
          //     ? prevInput.substring(0, prevInput.lastIndexOf(' ') + 1) + message.transcript 
          //     : prevInput + message.transcript + ". "
          // );
          break;
        case "error":
          // Display error messages from the backend STT service
          console.error("Backend STT Error:", message.message);
          // Example: setSttError(message.message);
          break;
        case "status":
          // Optional: Handle status messages if backend is configured to send them
          console.log("Backend STT Status:", message.message || message.event);
          break;
        // default: // Optional: Add a default case to satisfy exhaustive checks if SttMessage is a union
        //   const _exhaustiveCheck: never = message;
        //   console.warn("Received unknown message type from STT backend:", _exhaustiveCheck);
      }
    } catch (e) {
      console.error("Failed to parse JSON message from STT backend:", event.data, e);
    }
  } else {
    console.warn("Received non-string message from STT backend:", event.data);
  }
};
```

### 4.1. Message Types:

1.  **Interim Transcripts:**
    *   `{"type": "interim_transcript", "transcript": "User speaking..."}`
    *   Provides real-time, unconfirmed transcription results as the user speaks. Use this for live captioning.
2.  **Final Transcripts:**
    *   `{"type": "final_transcript", "transcript": "User has spoken."}`
    *   Provides the confirmed transcription for a complete utterance (e.g., after a pause). This is more accurate.
3.  **Errors:**
    *   `{"type": "error", "message": "Error details from Deepgram or backend processing..."}`
    *   Indicates an error occurred in the STT process. Display this to the user.

### 4.2. Optional Status Messages (Currently Commented Out in Backend)

*   The backend's `DeepgramServiceProvider` has placeholders to send additional status messages. If these are enabled on the backend, the client might receive:
    *   `{"type": "status", "message": "STT engine connected"}` (on successful Deepgram connection)
    *   `{"type": "status", "event": "speech_started"}` (when Deepgram detects speech)
    *   `{"type": "status", "event": "utterance_end"}` (when Deepgram detects an utterance end)
    *   `{"type": "status", "message": "STT engine disconnected"}` (when Deepgram connection closes)
*   To use these, the corresponding code in `src/react_agent/web/stt/providers/deepgram.py` needs to be uncommented, and the frontend needs to handle the `status` message type.

## 5. Controlling the Stream (Stopping)

*   **To stop sending audio and end the STT session:**
    *   Simply **close the WebSocket connection** from the client side.
        ```typescript
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close(1000, "Client finished streaming");
        }
        ```
    *   The backend's `finally` block in the WebSocket endpoint will detect the disconnection and call the `provider.finish()` method, which tells Deepgram to finalize the stream and clean up resources.
*   **Explicit "Stop" Message (Not Currently Implemented):**
    *   The backend currently does **not** explicitly listen for a JSON message like `{"action": "stop"}` to terminate the Deepgram stream before the WebSocket itself is closed. Closing the WebSocket is the current mechanism to signal the end.

## 6. Error Handling

*   Listen for the `onerror` event on the WebSocket object for connection-level errors.
*   Process `{"type": "error", "message": "..."}` JSON messages received in `onmessage` for errors occurring within the STT service itself (e.g., Deepgram API errors).
*   Update the UI appropriately to inform the user of any issues.

## 7. Typical Lifecycle

1.  **User initiates recording** (e.g., clicks a microphone button).
2.  Frontend requests microphone access (`navigator.mediaDevices.getUserMedia`).
3.  Frontend establishes WebSocket connection to `/stt/stt-stream`.
4.  On `socket.onopen`:
    *   Frontend starts `MediaRecorder`.
    *   (Future: Send initial configuration message if implemented).
5.  On `mediaRecorder.ondataavailable`:
    *   Frontend sends the audio chunk (Blob or ArrayBuffer) via `socket.send()`.
6.  Frontend's `socket.onmessage` handler receives `interim_transcript` and `final_transcript` (or `error`) messages and updates the UI.
7.  **User stops recording** (e.g., clicks microphone button again).
8.  Frontend stops `MediaRecorder`.
9.  Frontend closes the WebSocket connection (`socket.close()`).
10. Backend detects WebSocket closure, tells Deepgram to finish processing, and cleans up. 