import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from "react";
import { useStream } from "@langchain/langgraph-sdk/react";
import { type Message } from "@langchain/langgraph-sdk";
import {
  uiMessageReducer,
  type UIMessage,
  type RemoveUIMessage,
} from "@langchain/langgraph-sdk/react-ui";
import { useQueryState } from "nuqs";
import { getApiKey } from "@/lib/api-key";
import { useThreads } from "./Thread";
import { toast } from "sonner";
import { apiUrl, assistantId } from "@/config";

export type StateType = { messages: Message[]; ui?: UIMessage[] };
const useTypedStream:any = useStream<
  StateType,
  {
    UpdateType: {
      messages?: Message[] | Message | string;
      ui?: (UIMessage | RemoveUIMessage)[] | UIMessage | RemoveUIMessage;
    };
    CustomEventType: UIMessage | RemoveUIMessage;
  }
>;

type StreamContextType = ReturnType<typeof useTypedStream>;
const StreamContext = createContext<StreamContextType | undefined>(undefined);

async function sleep(ms = 4000) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkGraphStatus(
  apiUrl: string,
  apiKey: string | null,
): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl}/info`, {
      ...(apiKey && {
        headers: {
          "X-Api-Key": apiKey,
        },
      }),
    });

    return res.ok;
  } catch (e) {
    console.error("Failed to check graph status:", e);
    return false;
  }
}

const StreamSession = ({
  children,
  apiKey,
  apiUrl,
  assistantId,
}: {
  children: ReactNode;
  apiKey: string | null;
  apiUrl: string;
  assistantId: string;
}) => {
  const [threadId, setThreadId] = useQueryState("threadId");
  // console.log(`[StreamSession] nuqs threadId: ${threadId}`); // Removed for less noise

  const { getThreads, setThreads } = useThreads();
  const streamValue = useTypedStream({
    apiUrl,
    apiKey: apiKey ?? undefined,
    assistantId,
    threadId: threadId ?? null,
    onCustomEvent: (event, options) => {
      options.mutate((prev) => {
        const ui = uiMessageReducer(prev.ui ?? [], event);
        return { ...prev, ui };
      });
    },
    onThreadId: (id) => {
      console.log(`[StreamSession] onThreadId callback from useTypedStream, new id: ${id}`); // Keep: Important SDK event
      setThreadId(id);
      sleep().then(() => getThreads().then(setThreads).catch(console.error));
    },
  });

  const streamHookActualThreadId = streamValue?.threadId;

  useEffect(() => {
    const nuqsThreadId = threadId;

    if (nuqsThreadId && nuqsThreadId !== streamHookActualThreadId) {
      console.log(`[StreamSession] Mismatch detected! nuqsThreadId: ${nuqsThreadId}, streamHook's actual threadId: ${streamHookActualThreadId || 'null/undefined'}. Calling setThreadId from nuqs.`); // Keep: Core of the fix
      setThreadId(nuqsThreadId);
    } 
    // Removed other conditional logs for Synced/No active nuqsThreadId to reduce noise
  }, [threadId, streamHookActualThreadId, setThreadId]);

  useEffect(() => {
    checkGraphStatus(apiUrl, apiKey).then((ok) => {
      if (!ok) {
        toast.error("Failed to connect to LangGraph server", {
          description: () => (
            <p>
              Please ensure your graph is running at <code>{apiUrl}</code> and
              your API key is correctly set (if connecting to a deployed graph).
            </p>
          ),
          duration: 10000,
          richColors: true,
          closeButton: true,
        });
      }
    });
  }, [apiKey, apiUrl]);

  return (
    <StreamContext.Provider value={streamValue}>
      {children}
    </StreamContext.Provider>
  );
};

export const StreamProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [apiKey] = useState(() => {
    return getApiKey();
  });

  if (!apiUrl || !assistantId) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full p-4 text-red-600">
        Error: Required environment variables VITE_PUBLIC_LANGGRAPH_API_URL (
        <code>{apiUrl ?? "Not Set"}</code>) or VITE_PUBLIC_LANGGRAPH_ASSISTANT_ID (
        <code>{assistantId ?? "Not Set"}</code>) are not configured.
        Please check your <code>.env</code> file in the project root.
      </div>
    );
  }

  return (
    <StreamSession apiKey={apiKey} apiUrl={apiUrl} assistantId={assistantId}>
      {children}
    </StreamSession>
  );
};

export const useStreamContext = (): StreamContextType => {
  const context = useContext(StreamContext);
  if (context === undefined) {
    throw new Error("useStreamContext must be used within a StreamProvider");
  }
  return context;
};

export default StreamContext;
