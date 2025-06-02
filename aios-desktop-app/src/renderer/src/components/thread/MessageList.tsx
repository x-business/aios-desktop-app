import { Message, Checkpoint } from '@langchain/langgraph-sdk';
import { AssistantMessage, AssistantMessageLoading } from './messages/ai';
import { HumanMessage } from './messages/human';
import { DO_NOT_RENDER_ID_PREFIX } from '@/lib/ensure-tool-responses';
import { MessageListSkeleton } from './messages/MessageSkeleton';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  firstTokenReceived: boolean;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
  isLoadingThread: boolean;
}

export function MessageList({
  messages,
  isLoading,
  firstTokenReceived,
  handleRegenerate,
  isLoadingThread,
}: MessageListProps) {
  if (isLoadingThread) {
    return <MessageListSkeleton />;
  }

  return (
    <>
      {messages
        .filter((m) => !m.id?.startsWith(DO_NOT_RENDER_ID_PREFIX))
        .map((message, index) =>
          message.type === 'human' ? (
            <HumanMessage
              key={message.id || `${message.type}-${index}`}
              message={message}
              isLoading={isLoading}
            />
          ) : (
            <AssistantMessage
              key={message.id || `${message.type}-${index}`}
              message={message}
              isLoading={isLoading}
              handleRegenerate={handleRegenerate}
            />
          )
        )}
      {isLoading && !firstTokenReceived && <AssistantMessageLoading />}
    </>
  );
}
