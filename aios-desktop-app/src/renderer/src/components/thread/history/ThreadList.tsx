import { Button } from "@/components/ui/button";
import { Thread } from "@langchain/langgraph-sdk";
import { getContentString } from "../utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ThreadListProps {
  threads: Thread[];
  onThreadClick?: (threadId: string) => void;
  threadId?: string | null;
  setThreadId: (threadId: string) => void;
  isLoading: boolean;
}

export function ThreadList({
  threads,
  onThreadClick,
  threadId,
  setThreadId,
  isLoading,
}: ThreadListProps) {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col w-full gap-2 items-start justify-start overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={`skeleton-${i}`} className="w-[280px] h-10" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col w-full gap-2 items-start justify-start overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
      {threads.map((t) => {
        let itemText = t.thread_id;
        if (
          typeof t.values === "object" &&
          t.values &&
          "messages" in t.values &&
          Array.isArray(t.values.messages) &&
          t.values.messages?.length > 0
        ) {
          const firstMessage = t.values.messages[0];
          itemText = getContentString(firstMessage.content);
        }
        return (
          <div key={t.thread_id} className="w-full px-1">
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
          </div>
        );
      })}
    </div>
  );
} 