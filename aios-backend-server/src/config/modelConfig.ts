import { ApiProvider } from "../models/ApiKey";

export interface ModelConfig {
  id: string;
  name: string;
  provider: ApiProvider;
  family: string;
  costPerThousandTokens: number;
  tokenizerType: "gpt" | "claude" | "character";
  description?: string;
}

export const AI_MODELS: ModelConfig[] = [
  {
    id: "openai/gpt-4",
    name: "GPT-4",
    provider: ApiProvider.OPENAI,
    family: "gpt-4",
    costPerThousandTokens: 30,
    tokenizerType: "gpt",
    description: "Most capable GPT-4 model"
  },
  {
    id: "openai/o4-mini",
    name: "GPT-4 Mini",
    provider: ApiProvider.OPENAI,
    family: "gpt-4",
    costPerThousandTokens: 15,
    tokenizerType: "gpt",
    description: "Smaller, faster GPT-4 variant"
  },
  {
    id: "openai/o3",
    name: "GPT-3.5",
    provider: ApiProvider.OPENAI,
    family: "gpt-3.5",
    costPerThousandTokens: 2,
    tokenizerType: "gpt",
    description: "Fast and efficient GPT-3.5 model"
  },
  {
    id: "google_genai/gemini-2.5-pro-preview",
    name: "Gemini Pro Preview",
    provider: ApiProvider.GOOGLE,
    family: "gemini",
    costPerThousandTokens: 25,
    tokenizerType: "character",
    description: "Advanced Gemini model with enhanced capabilities"
  },
  {
    id: "google_genai/gemini-2.5-flash-preview",
    name: "Gemini Flash Preview",
    provider: ApiProvider.GOOGLE,
    family: "gemini",
    costPerThousandTokens: 10,
    tokenizerType: "character",
    description: "Fast and efficient Gemini model"
  },
  {
    id: "anthropic/claude-3-5-sonnet-latest",
    name: "Claude 3.5 Sonnet",
    provider: ApiProvider.ANTHROPIC,
    family: "claude",
    costPerThousandTokens: 15,
    tokenizerType: "claude",
    description: "Efficient Claude 3.5 model"
  },
  {
    id: "anthropic/claude-3-7-sonnet-latest",
    name: "Claude 3.7 Sonnet",
    provider: ApiProvider.ANTHROPIC,
    family: "claude",
    costPerThousandTokens: 45,
    tokenizerType: "claude",
    description: "Most advanced Claude model"
  }
];

export const getModelConfig = (modelId: string): ModelConfig | undefined => {
  return AI_MODELS.find(model => model.id === modelId);
};

export const getModelIds = (): string[] => {
  return AI_MODELS.map(model => model.id);
};

export const getModelsByProvider = (provider: ApiProvider): ModelConfig[] => {
  return AI_MODELS.filter(model => model.provider === provider);
}; 