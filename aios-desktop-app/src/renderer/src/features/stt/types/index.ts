export interface SttTranscriptMessage {
  type: "interim_transcript" | "final_transcript";
  transcript: string;
}

export interface SttErrorMessage {
  type: "error";
  message: string;
}

export interface SttStatusMessage {
  type: "status";
  message?: string;
  event?: string;
}

// Union type for all possible messages from the STT backend
export type SttMessage = SttTranscriptMessage | SttErrorMessage | SttStatusMessage; 