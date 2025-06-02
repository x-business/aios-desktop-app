import { Button } from '@/components/ui/button';
import { useThreads } from '@/providers/Thread';
import { Thread } from '@langchain/langgraph-sdk';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Trash2 } from 'lucide-react';

import { getContentString } from '../utils';
import { useQueryState, parseAsBoolean } from 'nuqs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { PanelRightOpen, PanelRightClose } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

function ThreadList({
  threads,
  onThreadClick,
  onThreadDelete,
}: {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
  onThreadDelete?: (threadId: string) => void;
}) {
  const [threadId, setThreadId] = useQueryState('threadId');
  const [, setHoveredThreadId] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col w-full gap-2 items-start justify-start overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {threads.map((t) => {
        let itemText = t.thread_id;
        if (
          typeof t.values === 'object' &&
          t.values &&
          'messages' in t.values &&
          Array.isArray(t.values.messages) &&
          t.values.messages?.length > 0
        ) {
          const firstMessage = t.values.messages[0];
          itemText = getContentString(firstMessage.content);
        }
        return (
          <div
            key={t.thread_id}
            className="relative w-full px-1 group"
            onMouseEnter={() => setHoveredThreadId(t.thread_id)}
            onMouseLeave={() => setHoveredThreadId(null)}
          >
            <Button
              variant="ghost"
              className="text-left items-start justify-start font-normal w-[280px]"
              onClick={(e) => {
                e.preventDefault();
                onThreadClick?.(t.thread_id);
                if (t.thread_id === threadId) return;
                setThreadId(t.thread_id);
              }}
            >
              <p className="truncate text-ellipsis">{itemText}</p>
            </Button>
            {
              <Button
                variant="ghost"
                size="icon"
                className="absolute transition-opacity transform -translate-y-1/2 opacity-0 right-3 top-1/2 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  onThreadDelete?.(t.thread_id);
                }}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            }
          </div>
        );
      })}
    </div>
  );
}

function ThreadHistoryLoading() {
  return (
    <div className="h-full flex flex-col w-full gap-2 items-start justify-start overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {Array.from({ length: 30 }).map((_, i) => (
        <Skeleton key={`skeleton-${i}`} className="w-[280px] h-10" />
      ))}
    </div>
  );
}

export default function ThreadHistory() {
  const navigate = useNavigate();
  const isLargeScreen = useMediaQuery('(min-width: 1024px)');
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    'chatHistoryOpen',
    parseAsBoolean.withDefault(false)
  );

  const { getThreads, threads, setThreads, threadsLoading, setThreadsLoading, deleteThread } =
    useThreads();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setThreadsLoading(true);
    getThreads()
      .then(setThreads)
      .catch(console.error)
      .finally(() => setThreadsLoading(false));
  }, []);

  const handleSettingsClick = () => {
    navigate('/settings/mcp');
    if (!isLargeScreen) {
      setChatHistoryOpen(false);
    }
  };

  const handleThreadItemClick = (_threadId: string) => {
    if (!isLargeScreen) {
      setChatHistoryOpen(false);
    }
  };

  const handleThreadDelete = async (threadId: string) => {
    try {
      await deleteThread(threadId);
      setThreads(threads.filter(t => t.thread_id !== threadId));
    } catch (error) {
      console.error("Failed to delete thread:", error);
    }
  };

  return (
    <>
      <div className="hidden lg:flex flex-col border-r-[1px] border-slate-300 items-start justify-start gap-6 h-screen w-[300px] shrink-0 shadow-inner-right">
        <div className="flex items-center justify-between w-full pt-1.5 px-4">
          <Button
            className="hover:bg-muted"
            variant="ghost"
            onClick={() => setChatHistoryOpen((p) => !p)}
          >
            {chatHistoryOpen ? (
              <PanelRightOpen className="size-5" />
            ) : (
              <PanelRightClose className="size-5" />
            )}
          </Button>
          <h1 className="text-xl font-semibold tracking-tight">
            Thread History
          </h1>
        </div>
        {threadsLoading ? (
          <ThreadHistoryLoading />
        ) : (
          <div className="flex flex-col flex-1 w-full overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <ThreadList threads={threads} onThreadDelete={handleThreadDelete} />
            </div>
            <div className="flex justify-center flex-shrink-0 p-2 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={handleSettingsClick}
                className="p-2"
              >
                <Settings className="size-5" />
              </Button>
            </div>
          </div>
        )}
      </div>
      <div className="lg:hidden">
        <Sheet
          open={!!chatHistoryOpen && !isLargeScreen}
          onOpenChange={(open) => {
            if (isLargeScreen) return;
            setChatHistoryOpen(open);
          }}
        >
          <SheetContent side="left" className="flex flex-col p-0 lg:hidden">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Thread History</SheetTitle>
            </SheetHeader>
            <div className="flex-1 p-4 overflow-y-auto">
              <ThreadList
                threads={threads}
                onThreadClick={handleThreadItemClick}
                onThreadDelete={handleThreadDelete}
              />
            </div>
            <div className="flex justify-center flex-shrink-0 p-2 border-t border-gray-200">
              <Button
                variant="ghost"
                onClick={handleSettingsClick}
                className="p-2"
              >
                <Settings className="size-5" />
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
