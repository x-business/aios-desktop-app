// src/renderer/src/constants/models.ts

// --- Base Model Names (without prefixes) ---

// OpenAI
const OPENAI_BASE_MODELS = ["gpt-4o", "gpt-4.1", "o4-mini", "o3"];

// Google
const GOOGLE_BASE_MODELS = [
  "gemini-2.5-pro-preview-05-06",
  "gemini-2.5-flash-preview-04-17",
];

// Anthropic
const ANTHROPIC_BASE_MODELS = [
  "claude-3.5-sonnet",
  "claude-3.7-sonnet",
  "claude-sonnet-4",
  // "claude-3-opus-latest", // Example
];

const XAI_BASE_MODELS = ["grok-3"];


// --- Helper Function to Add Prefixes ---
const addPrefix = (prefix: string) => (model: string) => `${prefix}${model}`;

// --- Generate Full Model Names ---

export const OPENAI_MODELS = OPENAI_BASE_MODELS.map(addPrefix("openai/"));
export const GOOGLE_MODELS = GOOGLE_BASE_MODELS.map(addPrefix("google_genai/"));
export const ANTHROPIC_MODELS = ANTHROPIC_BASE_MODELS.map(
  addPrefix("anthropic/")
);
export const XAI_MODELS = XAI_BASE_MODELS.map(addPrefix("xai/"));

// --- Combined List for UI ---
export const AVAILABLE_MODELS = [
  ...OPENAI_MODELS,
  ...GOOGLE_MODELS,
  ...ANTHROPIC_MODELS,
  ...XAI_MODELS,
];

// --- Default Model ---
// Ensure the default model exists in the generated lists
export const DEFAULT_MODEL = OPENAI_MODELS[0] ?? ""; // Use the first generated OpenAI model as default
