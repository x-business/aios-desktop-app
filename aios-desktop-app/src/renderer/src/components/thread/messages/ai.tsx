import { parsePartialJson } from "@langchain/core/output_parsers";
import { useStreamContext } from "@/providers/Stream";
import { AIMessage, Checkpoint, Message } from "@langchain/langgraph-sdk";
import { getContentString } from "../utils";
import { BranchSwitcher, CommandBar } from "./shared";
import { MarkdownText } from "../markdown-text";
import { LoadExternalComponent } from "@langchain/langgraph-sdk/react-ui";
import { cn } from "@/lib/utils";
import { CollapsibleToolsView } from "./CollapsibleToolsView";
import { MessageContentComplex } from "@langchain/core/messages";
import { Fragment } from "react/jsx-runtime";
import { isAgentInboxInterruptSchema } from "@/lib/agent-inbox-interrupt";
import { ThreadView } from "../agent-inbox";
import { useQueryState, parseAsBoolean } from "nuqs";

function CustomComponent({
  message,
  thread,
}: {
  message: Message;
  thread: ReturnType<typeof useStreamContext>;
}) {
  const { values } = useStreamContext();
  const customComponents = values.ui?.filter(
    (ui) => ui.metadata?.message_id === message.id,
  );

  if (!customComponents?.length) return null;
  return (
    <Fragment key={message.id}>
      {customComponents.map((customComponent) => (
        <LoadExternalComponent
          key={customComponent.id}
          stream={thread}
          message={customComponent}
          meta={{ ui: customComponent }}
        />
      ))}
    </Fragment>
  );
}

function parseAnthropicStreamedToolCalls(
  content: MessageContentComplex[],
): AIMessage["tool_calls"] {
  const toolCallContents = content.filter((c) => c.type === "tool_use" && c.id);

  return toolCallContents.map((tc) => {
    const toolCall = tc as Record<string, any>;
    let json: Record<string, any> = {};
    if (toolCall?.input) {
      try {
        json = parsePartialJson(toolCall.input) ?? {};
      } catch {
        // Pass
      }
    }
    return {
      name: toolCall.name ?? "",
      id: toolCall.id ?? "",
      args: json,
      type: "tool_call",
    };
  });
}

export function AssistantMessage({
  message,
  isLoading,
  handleRegenerate,
}: {
  message: Message;
  isLoading: boolean;
  handleRegenerate: (parentCheckpoint: Checkpoint | null | undefined) => void;
}) {
  const contentString = getContentString(message.content);
  const [hideToolCallsSetting] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false),
  );

  const thread = useStreamContext();
  const isLastMessage =
    thread.messages.length > 0 &&
    thread.messages[thread.messages.length - 1].id === message.id;
  const meta = thread.getMessagesMetadata(message);
  const interrupt = thread.interrupt;
  const parentCheckpoint = meta?.firstSeenState?.parent_checkpoint;

  if (message.type === "tool") {
    return null;
  }

  if (message.type !== "ai") {
    return null; 
  }

  let actualToolCalls: AIMessage["tool_calls"] | undefined = undefined;
  let sourceIsAnthropic = false;
  if ("tool_calls" in message && message.tool_calls && message.tool_calls.length > 0) {
    actualToolCalls = message.tool_calls;
  } else if (Array.isArray(message.content)) {
    const anthropicStreamedToolCalls = parseAnthropicStreamedToolCalls(message.content);
    if (anthropicStreamedToolCalls && anthropicStreamedToolCalls.length > 0) {
      actualToolCalls = anthropicStreamedToolCalls;
      sourceIsAnthropic = true;
    }
  }
  
  const hasRelevantToolCalls =
    actualToolCalls && actualToolCalls.length > 0 && !hideToolCallsSetting;

  const isPendingLayout = !("tool_calls" in message && message.tool_calls && message.tool_calls.length > 0) && 
                           (actualToolCalls && actualToolCalls.length > 0);

  // Condition for showing BranchSwitcher and CommandBar
  const showControls = contentString.trim().length > 0 || !hasRelevantToolCalls;

  return (
    <div className="flex items-start mr-auto gap-2 group">
      <div className="flex flex-col w-full gap-2">
        {contentString.length > 0 && (
          <div className="py-1">
            <MarkdownText>{contentString}</MarkdownText>
          </div>
        )}

        {hasRelevantToolCalls && actualToolCalls && (
          <CollapsibleToolsView
            toolCalls={actualToolCalls}
            messages={thread.messages}
          />
        )}
        
        <CustomComponent message={message} thread={thread} />
        {isAgentInboxInterruptSchema(interrupt?.value) && isLastMessage && (
          <ThreadView interrupt={interrupt.value} />
        )}
        {showControls && (
          <div
            className={cn(
              "flex gap-2 items-center mr-auto transition-opacity mt-2",
              "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
            )}
          >
            <BranchSwitcher
              branch={meta?.branch}
              branchOptions={meta?.branchOptions}
              onSelect={(branch) => thread.setBranch(branch)}
              isLoading={isLoading}
            />
            <CommandBar
              content={contentString}
              isLoading={isLoading}
              isAiMessage={true}
              handleRegenerate={() => handleRegenerate(parentCheckpoint)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function AssistantMessageLoading() {
  return (
    <div className="flex items-start mr-auto gap-2">
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-2 h-8">
        <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_0.5s_infinite]"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-foreground/50 animate-[pulse_1.5s_ease-in-out_1s_infinite]"></div>
      </div>
    </div>
  );
}
