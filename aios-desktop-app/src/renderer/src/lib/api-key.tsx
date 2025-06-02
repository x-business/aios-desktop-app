import { langsmithApiKey } from "../config";
export function getApiKey(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const apiKey = langsmithApiKey;
    console.log("apiKey", apiKey);
    if (apiKey) {
      return apiKey;
    }
    return null;
  } catch {
    // no-op
  }

  return null;
}
