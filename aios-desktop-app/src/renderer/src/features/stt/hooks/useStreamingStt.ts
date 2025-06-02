import { useState, useRef, useCallback, useEffect } from 'react';
import type { SttMessage } from '../types'; // Import the types
import { sttWebSocketUrl } from '@/config'; // Import the configured URL

export const useStreamingStt = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [sttError, setSttError] = useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [finalTranscript, setFinalTranscript] = useState<string>('');

  const webSocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);

  // Define stopRecording *before* startRecording because startRecording uses it
  const stopRecording = useCallback(() => {
    console.log('Stopping recording...');

    // Stop MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Close WebSocket
    if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
      console.log('Closing WebSocket connection...');
      webSocketRef.current.close(1000, "Client stopped recording");
    }

    // Stop audio stream tracks
    audioStreamRef.current?.getTracks().forEach(track => track.stop());

    // Clear refs
    webSocketRef.current = null;
    mediaRecorderRef.current = null;
    audioStreamRef.current = null;

    // Update state
    setIsRecording(false);
    // Optionally clear transcripts here or keep them until next recording starts
    // setInterimTranscript('');
    // setFinalTranscript('');
    // Don't clear sttError here, let it persist until next attempt
  }, []);

  const startRecording = useCallback(async () => {
    // Clear previous state
    setIsRecording(false); // Start as false, set true on successful setup
    setSttError(null);
    setInterimTranscript('');
    setFinalTranscript('');

    // 1. Get Microphone Access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      let errorMessage = 'Could not access microphone.';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Microphone permission denied. Please allow access in your browser/system settings.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No microphone found. Please ensure one is connected and enabled.';
        } else {
           errorMessage = `Microphone access error: ${err.message}`;
        }
      }
      setSttError(errorMessage);
      return; // Stop execution if microphone access fails
    }

    if (!audioStreamRef.current) {
        setSttError("Failed to get audio stream.");
        return;
    }

    // 2. Setup MediaRecorder
    try {
      const options = { mimeType: 'audio/wav' }; // Try WAV first, closer to PCM
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.warn(`mimeType ${options.mimeType} not supported, trying default.`);
        // Fallback to default or another supported type if necessary
        mediaRecorderRef.current = new MediaRecorder(audioStreamRef.current);
      } else {
          console.log(`Using mimeType: ${options.mimeType}`);
          mediaRecorderRef.current = new MediaRecorder(audioStreamRef.current, options);
      }

      // --- MediaRecorder Event Handlers ---
      mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0 && webSocketRef.current?.readyState === WebSocket.OPEN) {
          console.log(`Sending audio chunk size: ${event.data.size}`);
          webSocketRef.current.send(event.data);
        } else if (event.data.size > 0) {
          console.warn('Audio data available, but WebSocket is not open. Skipping send.');
        }
      };

      mediaRecorderRef.current.onerror = (event: Event) => {
        console.error('MediaRecorder error:', event);
        // The exact error type/message might vary, provide a generic one for now.
        // Consider inspecting 'event.error' in browsers that support it.
        setSttError('An error occurred with the audio recording.');
        stopRecording(); // Stop recording process on recorder error
      };

      mediaRecorderRef.current.onstart = () => {
          console.log('MediaRecorder started.');
          // Now we are truly ready and recording
          setIsRecording(true);
      }

      mediaRecorderRef.current.onstop = () => {
          console.log('MediaRecorder stopped.');
          // Cleanup related to MediaRecorder stopping can happen here if needed
      };


      // WebSocket connection and starting recorder will be in the next steps
      // For now, we've set up the recorder instance.
      console.log('MediaRecorder instance created.');

      // --- WebSocket Connection Setup ---


      try {
        webSocketRef.current = new WebSocket(sttWebSocketUrl); // Use configured URL
        console.log(`Attempting to connect WebSocket to ${sttWebSocketUrl}`);

        webSocketRef.current.onopen = () => {
          console.log('WebSocket connection established.');
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
            // Start recorder *after* WebSocket is open, sending chunks periodically
            const timeslice = 250; // ms - Determines frequency of ondataavailable event
            mediaRecorderRef.current.start(timeslice);
            console.log(`MediaRecorder started with timeslice: ${timeslice}ms`);
          } else {
            console.warn('WebSocket opened, but MediaRecorder not ready or already recording.');
            // Handle this state? Maybe call stopRecording?
            setSttError("Couldn't start audio recording after connection.");
            stopRecording();
          }
        };

        webSocketRef.current.onmessage = (event: MessageEvent) => {
          if (typeof event.data === 'string') {
            try {
              const message = JSON.parse(event.data) as SttMessage;
              console.debug('Received STT message:', message);

              switch (message.type) {
                case 'interim_transcript':
                  // Replace interim transcript completely for simplicity
                  setInterimTranscript(message.transcript);
                  break;
                case 'final_transcript':
                  // Append final transcript and clear interim
                  setFinalTranscript((prev) => prev + message.transcript + ' '); // Add space after final segment
                  setInterimTranscript('');
                  break;
                case 'error':
                  console.error('Backend STT Error:', message.message);
                  setSttError(`STT Error: ${message.message}`);
                  // Automatically stop the recording process on backend error
                  stopRecording();
                  break;
                case 'status':
                  // Optional: Handle status messages if needed
                  console.log('Backend STT Status:', message.message || message.event);
                  break;
                default:
                    // Exhaustiveness check for TypeScript
                    const _exhaustiveCheck: never = message;
                    console.warn('Received unknown message type from STT backend:', _exhaustiveCheck);
              }
            } catch (e) {
              console.error('Failed to parse JSON message from STT backend:', event.data, e);
              setSttError('Received invalid message format from backend.');
            }
          } else {
            console.warn('Received non-string message from STT backend:', event.data);
            // Potentially handle binary status messages if the protocol defines them
          }
        };

        webSocketRef.current.onerror = (event: Event) => {
          console.error('WebSocket error:', event);
          setSttError('WebSocket connection error. Please ensure the backend STT service is running and accessible.');
          stopRecording(); // Clean up on error
        };

        webSocketRef.current.onclose = (event: CloseEvent) => {
          console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
          // Only call stopRecording if it wasn't intentionally closed by the user clicking stop
          // We might need more sophisticated state management later if stop is initiated by backend
          if (isRecording) {
             // If we are still marked as recording, it was an unexpected closure
             setSttError('WebSocket connection closed unexpectedly.');
             stopRecording();
          }
        };

      } catch (err) {
         console.error('Error initializing WebSocket:', err);
         setSttError('Failed to initialize WebSocket connection.');
         stopRecording(); // Clean up if WebSocket setup fails
      }

    } catch (err) {
      console.error('Error creating MediaRecorder:', err);
      setSttError('Failed to create audio recorder.');
      stopRecording(); // Clean up stream if recorder fails
    }


    // Placeholder for starting recorder (will move to WebSocket onopen later)
    // mediaRecorderRef.current?.start();

  }, [stopRecording]); // stopRecording is now defined

  const handleToggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // --- Cleanup Effect ---
  useEffect(() => {
    // Return a cleanup function that will be called when the component unmounts
    return () => {
      // Ensure recording is stopped and resources are released if active
      if (isRecording) {
        console.log('Component unmounting, stopping recording...');
        stopRecording();
      }
    };
  }, [isRecording, stopRecording]); // Depend on isRecording and stopRecording

  return {
    isRecording,
    sttError,
    interimTranscript,
    finalTranscript,
    handleToggleRecording,
  };
}; 