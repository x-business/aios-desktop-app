import { cn } from "@/lib/utils";

export function MessageSkeleton({ isAI = false }: { isAI?: boolean }) {
  return (
    <div className={cn("flex items-start gap-2", isAI ? "mr-auto" : "ml-auto")}>
      <div 
        className={cn(
          "h-10 rounded-3xl animate-pulse",
          isAI ? "w-64 bg-muted" : "w-48 bg-primary/10"
        )}
      />
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="flex flex-col w-full gap-6">
      <MessageSkeleton isAI={true} />
      <MessageSkeleton isAI={false} />
      <MessageSkeleton isAI={true} />
      <MessageSkeleton isAI={false} />
      <MessageSkeleton isAI={true} />
    </div>
  );
} 