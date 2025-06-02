import { validate } from 'uuid';
import { getApiKey } from '@/lib/api-key';
import { Thread } from '@langchain/langgraph-sdk';
import {
  createContext,
  useContext,
  ReactNode,
  useCallback,
  useState,
  Dispatch,
  SetStateAction,
} from 'react';
import { createClient } from './client';
import { apiUrl, assistantId } from '@/config';

interface ThreadContextType {
  getThreads: () => Promise<Thread[]>;
  threads: Thread[];
  setThreads: Dispatch<SetStateAction<Thread[]>>;
  threadsLoading: boolean;
  setThreadsLoading: Dispatch<SetStateAction<boolean>>;
  deleteThread: (threadId: string) => Promise<boolean>;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

function getThreadSearchMetadata(
  assistantId: string
): { graph_id: string } | { assistant_id: string } {
  if (validate(assistantId)) {
    return { assistant_id: assistantId };
  } else {
    return { graph_id: assistantId };
  }
}

export function ThreadProvider({ children }: { children: ReactNode }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const getThreads = useCallback(async (): Promise<Thread[]> => {
    if (!apiUrl || !assistantId) {
      console.error(
        'ThreadProvider: Missing apiUrl or assistantId from environment variables.'
      );
      return [];
    }
    const client = createClient(apiUrl, getApiKey() ?? undefined);

    try {
      const fetchedThreads = await client.threads.search({
        metadata: {
          ...getThreadSearchMetadata(assistantId),
        },
        limit: 100,
      });
      return fetchedThreads;
    } catch (error) {
      console.error('Failed to fetch threads:', error);
      return [];
    }
  }, [apiUrl, assistantId]);

  const value = {
    getThreads,
    threads,
    setThreads,
    threadsLoading,
    setThreadsLoading,
  };

  return (
    <ThreadContext.Provider
      value={{
        ...value,
        deleteThread: async (threadId: string) => {
          if (!apiUrl || !assistantId) {
            console.error(
              'ThreadProvider: Missing apiUrl or assistantId from environment variables.'
            );
            return false;
          }
          const client = createClient(apiUrl, getApiKey() ?? undefined);

          try {
            await client.threads.delete(threadId);
            return true;
          } catch (error) {
            console.error('Failed to delete thread:', error);
            return false;
          }
        },
      }}
    >
      {children}
    </ThreadContext.Provider>
  );
}

export function useThreads() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error('useThreads must be used within a ThreadProvider');
  }
  return context;
}
