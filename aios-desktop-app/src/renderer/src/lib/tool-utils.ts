import { Message, ToolMessage, AIMessage } from "@langchain/langgraph-sdk";

// Helper to parse a string that might be JSON or a Python-like dict string
export function parseToolOutputString(str: string): object | null {
  try {
    return JSON.parse(str);
  } catch (e1) {
    // Heuristic check if it might be a Python-like dict string needing quote replacement
    if ((str.startsWith("{") && str.endsWith("}")) && (str.includes("'") || str.includes("\""))) {
      try {
        const jsonStr = str.replace(/'/g, '"');
        return JSON.parse(jsonStr);
      } catch (e2) {
        return null; // Failed even after quote replacement
      }
    }
    return null; // Not JSON and doesn't look like a parsable dict string
  }
}

// Simplified function to detect Pipedream connection URL
export function getPipedreamConnectInfo(rawContent: any): { url: string; appName?: string } | null {
  let parsedObject: any = null;

  if (typeof rawContent === 'string') {
    parsedObject = parseToolOutputString(rawContent);
  } else if (typeof rawContent === 'object' && rawContent !== null) {
    parsedObject = rawContent;
  }

  if (!parsedObject) return null;

  const text = parsedObject.status === 'success' &&
               parsedObject.result?.content?.[0]?.type === 'text' &&
               typeof parsedObject.result.content[0].text === 'string'
               ? parsedObject.result.content[0].text as string
               : null;

  if (!text) return null;

  const pipedreamPrefix = "Go to: ";
  if (text.startsWith(pipedreamPrefix)) {
    const urlPart = text.substring(pipedreamPrefix.length);
    const spaceIndex = urlPart.indexOf(' ');
    const extractedUrl = spaceIndex === -1 ? urlPart : urlPart.substring(0, spaceIndex);

    if (extractedUrl.startsWith("https://pipedream.com")) {
      let appName: string | undefined = undefined;
      try {
        const urlObj = new URL(extractedUrl);
        appName = urlObj.searchParams.get("app") || undefined;
      } catch (e) { /* Silently ignore */ }
      return { url: extractedUrl, appName };
    }
  }
  return null;
}

// Helper to format tool display names
export function parseToolName(rawName: string): {
  displayName: string;
  type: string | null;
  mcpName: string | null;
  command: string;
  originalName: string;
} {
  const parts = rawName.split("__");
  let type: string | null = null;
  let mcpName: string | null = null;
  let command = rawName;
  if (parts.length >= 3 && (parts[0] === "ext" || parts[0] === "int")) {
    type = parts[0];
    mcpName = parts[1];
    command = parts.slice(2).join("__");
  }
  const displayName = command
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return { displayName, type, mcpName, command, originalName: rawName };
}

// Helper to determine if a value is complex for display purposes
export function isComplexValue(value: any): boolean {
  return Array.isArray(value) || (typeof value === "object" && value !== null);
}

// Helper to find a result for a given tool call ID
export const findResultForToolCall = (
  toolCallId: string,
  messages: Message[],
): ToolMessage | undefined => {
  return messages.find(
    (msg): msg is ToolMessage =>
      msg.type === "tool" && msg.tool_call_id === toolCallId,
  );
};

// Helper to get the first argument display value
export function getFirstArgumentDisplayValue(args: Record<string, any> | undefined, maxLength = 50): string | null {
  if (!args || Object.keys(args).length === 0) return null;
  const firstArgKey = Object.keys(args)[0];
  const value = args[firstArgKey];
  if (typeof value === 'string') return value.length > maxLength ? value.substring(0, maxLength - 3) + "..." : value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return "[...] (" + value.length + " items)";
  if (typeof value === 'object' && value !== null) return "{...} (" + Object.keys(value).length + " keys)";
  return null;
}

// Helper to find an icon URL for a tool based on its name
export function getToolIconUrl(
    toolNameInfo: ReturnType<typeof parseToolName>, 
    configuredIntegrations: any[] // Parameterized
): string | null {
  if (toolNameInfo.type === "int" && toolNameInfo.mcpName) {
    const integration = configuredIntegrations.find(int => int.name_slug === toolNameInfo.mcpName);
    if (integration?.img_src) return integration.img_src;
  }
  return null;
} 