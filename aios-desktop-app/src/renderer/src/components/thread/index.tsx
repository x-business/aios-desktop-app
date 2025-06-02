// External dependencies
import { v4 as uuidv4 } from "uuid";
import { ReactNode, useEffect, useRef, useState, FormEvent } from "react";
import { motion } from "framer-motion";
import { useQueryState, parseAsBoolean } from "nuqs";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { toast } from "sonner";
import { Checkpoint, Message } from "@langchain/langgraph-sdk";

// Internal utilities and hooks
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useLangGraphWithTools } from "../../hooks/useLangGraphWithTools";
import { useModelStore } from "@/stores/modelStore";
import { ensureToolCallsHaveResponses } from "@/lib/ensure-tool-responses";

import ThreadHistory from "./history";

// Constants
// Add STT imports
import { useStreamingStt } from "@/features/stt/hooks/useStreamingStt";

import { ParsedFilePickerResult } from "@shared/types/parsedfile-tyeps";

// Components
import { ThreadHeader } from "./ThreadHeader";
import { MessageList } from "./MessageList";
import { ThreadFooter } from "./ThreadFooter";

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();
  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={props.className}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

export function Thread() {
<<<<<<< HEAD
  const [threadId, setThreadId] = useQueryState("threadId");
=======
  const [threadId, setThreadId] = useQueryState('threadId');
  console.log("[Thread] threadId", threadId)
  console.log("[Thread] window.location.href", window.location.href)
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417
  const [chatHistoryOpen, setChatHistoryOpen] = useQueryState(
    "chatHistoryOpen",
    parseAsBoolean.withDefault(false)
  );
  const [hideToolCalls, setHideToolCalls] = useQueryState(
    "hideToolCalls",
    parseAsBoolean.withDefault(false)
  );
  const { selectedModel, setSelectedModel } = useModelStore();
  const [input, setInput] = useState("");
  const [firstTokenReceived, setFirstTokenReceived] = useState(false);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const isLargeScreen = useMediaQuery("(min-width: 1024px)");

  const stream = useLangGraphWithTools();
  const messages = stream.messages;
  const isLoading = stream.isLoading;

  // Add STT Hook
  const {
    isRecording,
    interimTranscript,
    finalTranscript,
    handleToggleRecording,
  } = useStreamingStt();

  const lastError = useRef<string | undefined>(undefined);

  // Track when thread ID changes to show loading state
  useEffect(() => {
    if (threadId) {
      setIsLoadingThread(true);
      // Set a timeout to simulate loading if it takes too long
      const timeout = setTimeout(() => {
        setIsLoadingThread(false);
      }, 2000);

      return () => clearTimeout(timeout);
    } else {
      setIsLoadingThread(false);
    }
    return () => {};
  }, [threadId]);

  // When messages load, clear the loading state
  useEffect(() => {
    if (messages.length > 0) {
      setIsLoadingThread(false);
    }
  }, [messages]);

  useEffect(() => {
    if (!stream.error) {
      lastError.current = undefined;
      return;
    }
    try {
      const message = (stream.error as any).message;
      if (!message || lastError.current === message) {
        // Message has already been logged. do not modify ref, return early.
        return;
      }

      // Message is defined, and it has not been logged yet. Save it, and send the error
      lastError.current = message;
      toast.error("An error occurred. Please try again.", {
        description: (
          <p>
            <strong>Error:</strong> <code>{message}</code>
          </p>
        ),
        richColors: true,
        closeButton: true,
      });
    } catch {
      // no-op
    }
  }, [stream.error]);

  // TODO: this should be part of the useStream hook
  const prevMessageLength = useRef(0);
  useEffect(() => {
    if (
      messages.length !== prevMessageLength.current &&
      messages?.length &&
      messages[messages.length - 1].type === "ai"
    ) {
      setFirstTokenReceived(true);
    }

    prevMessageLength.current = messages.length;
  }, [messages]);

  // Add useEffect for STT input
  useEffect(() => {
    // Update input state based on STT results when recording is active
    // Strategy: Show final + interim. Clear input if recording stops.
    if (isRecording || interimTranscript || finalTranscript) {
      setInput(finalTranscript + interimTranscript);
    }
    // If recording stops and there was text, keep it? Or clear?
    // Let's clear it for now when toggling off, assuming user wants to start fresh or send.
    // User can manually clear if needed.
    
    // Return empty cleanup function to satisfy TypeScript
    return () => {};
  }, [finalTranscript, interimTranscript, isRecording]);

  const [attachedFiles, setAttachedFiles] = useState<ParsedFilePickerResult>(
    {} as ParsedFilePickerResult
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFiles.messageContent?.length) || isLoading)
      return;
    setFirstTokenReceived(false);

    let newMessage: Message;

    if (attachedFiles.messageContent && !attachedFiles.messageContent.length) {
      newMessage = {
        id: uuidv4(),
        type: "human",
        content: input.trim(),
      };
    } else {
      let messageContent: any[] = [
        { type: "text", text: input.trim(), display: true },
      ];
      attachedFiles.messageContent?.forEach((file) => {
        if (file.type === "text") {
          messageContent.push({
            type: "text",
            text: `\n[<file name=${file.fileName}>Text file attached: ${file.text}]<file>`,
            display: false,
            fileName: file.fileName,
          });
        } else if (file.type === "image") {
          messageContent.push({
            type: "image_url",
            image_url: {
              url: file.image_url?.url,
              detail: file.image_url?.detail,
              display: true,
              fileName: file.fileName,
            },
          });
        } else if (file.type === "pdf") {
          messageContent.push({
            type: "text",
            text: `\n[<file name=${file.fileName}>PDF file attached: ${file.text}]<file>`,
            display: false,
            fileName: file.fileName,
          });
        } else if (file.type === "document") {
          messageContent.push({
            type: "text",
            text: `\n[<file name=${file.fileName}>Document<File>document file attached: ${file.text}]<file>`,
            display: false,
            fileName: file.fileName,
          });
        }
      });
      newMessage = {
        id: uuidv4(),
        type: "human",
        content: messageContent,
      };
    }
    console.log("stream.messages", stream);
    const toolMessages = ensureToolCallsHaveResponses(stream.messages);
<<<<<<< HEAD
    console.log("toolmessages", toolMessages);
=======

    const messagesForApi = [...toolMessages, newMessage];
>>>>>>> 06be5ac67a6916c6de8ec7be32a127d1bdb4e417
    stream.submit(
      { messages: messagesForApi },
      {
        streamMode: ["values"],
        config: { configurable: { model: selectedModel } },
        optimisticValues: (prev) => ({
          ...prev,
          messages: [...(prev.messages ?? []), ...messagesForApi],
        }),
      }
    );

    setInput("");
    setAttachedFiles({} as ParsedFilePickerResult); // Clear attached files after submission
  };

  const handleRegenerate = (
    parentCheckpoint: Checkpoint | null | undefined
  ) => {
    // Don't regenerate if recording
    if (isRecording) return;
    // Do this so the loading state is correct
    prevMessageLength.current = prevMessageLength.current - 1;
    setFirstTokenReceived(false);
    stream.submit(undefined, {
      checkpoint: parentCheckpoint,
      streamMode: ["values"],
      config: {
        configurable: {
          model: selectedModel,
        },
      },
    });
  };

  const handleFileUpload = async () => {
    try {
      const result = await window.api.openFilePicker();
      if (result.success && result.messageContent?.length) {
        // Store the file content for later submission
        setAttachedFiles(result);

        // Show success message with file names
        if (result.messageContent?.length) {
          toast.success(`Added ${result.messageContent.length} file(s)`);
        }
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch (error: any) {
      console.error("Error processing files:", error);
      toast.error(
        "Failed to process files: " + (error.message || "Unknown error")
      );
    }
  };

  const chatStarted = !!threadId || !!messages.length;

  return (
    <div className="flex w-full h-screen overflow-hidden">
      <div className="relative hidden lg:flex">
        <motion.div
          className="absolute z-20 h-full overflow-hidden border-r"
          style={{ width: 300 }}
          animate={
            isLargeScreen
              ? { x: chatHistoryOpen ? 0 : -300 }
              : { x: chatHistoryOpen ? 0 : -300 }
          }
          initial={{ x: -300 }}
          transition={
            isLargeScreen
              ? { type: "spring", stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        >
          <div className="relative h-full" style={{ width: 300 }}>
            <ThreadHistory />
          </div>
        </motion.div>
      </div>
      <motion.div
        className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden relative",
          !chatStarted && "grid-rows-[1fr]"
        )}
        layout={isLargeScreen}
        animate={{
          marginLeft: chatHistoryOpen ? (isLargeScreen ? 300 : 0) : 0,
          width: chatHistoryOpen
            ? isLargeScreen
              ? "calc(100% - 300px)"
              : "100%"
            : "100%",
        }}
        transition={
          isLargeScreen
            ? { type: "spring", stiffness: 300, damping: 30 }
            : { duration: 0 }
        }
      >
        <ThreadHeader
          chatStarted={chatStarted}
          chatHistoryOpen={chatHistoryOpen}
          setChatHistoryOpen={setChatHistoryOpen}
          isLargeScreen={isLargeScreen}
          setThreadId={setThreadId}
        />

        <StickToBottom className="relative flex-1 overflow-hidden">
          <StickyToBottomContent
            className={cn(
              "absolute inset-0 overflow-y-scroll [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent",
              !chatStarted && "flex flex-col items-stretch mt-[25vh]",
              chatStarted && "grid grid-rows-[1fr_auto]"
            )}
            contentClassName="pt-8 pb-16 max-w-3xl mx-auto flex flex-col gap-4 w-full"
            content={
              <MessageList
                messages={messages}
                isLoading={isLoading}
                firstTokenReceived={firstTokenReceived}
                handleRegenerate={handleRegenerate}
                isLoadingThread={isLoadingThread}
              />
            }
            footer={
              <ThreadFooter
                chatStarted={chatStarted}
                input={input}
                setInput={setInput}
                isLoading={isLoading}
                isRecording={isRecording}
                selectedModel={selectedModel}
                setSelectedModel={setSelectedModel}
                handleSubmit={handleSubmit}
                handleToggleRecording={handleToggleRecording}
                sttError={null}
                attachedFiles={attachedFiles}
                setAttachedFiles={setAttachedFiles}
                hideToolCalls={hideToolCalls}
                setHideToolCalls={setHideToolCalls}
                firstTokenReceived={firstTokenReceived}
                stream={stream}
                handleFileUpload={handleFileUpload}
              />
            }
          />
        </StickToBottom>
      </motion.div>
    </div>
  );
}
