import { FormEvent, useCallback, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { LangGraphLogoSVG } from "../icons/langgraph";
import { ArrowDown, LoaderCircle, Paperclip } from "lucide-react";
import { MicButton } from "@/components/common/MicButton";
import { ParsedFilePickerResult } from "@shared/types/parsedfile-tyeps";
import { AttachedFilesList } from "./AttachedFilesList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_MODELS } from "../../constants/models";
import { useStickToBottomContext } from "use-stick-to-bottom";
import { toast } from "sonner";

import { ALLOWED_FILE_EXTENSIONS } from "../../constants/extensions";

interface ThreadFooterProps {
  chatStarted: boolean;
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  isRecording: boolean;
  selectedModel: string;
  setSelectedModel: (value: string) => void;
  handleSubmit: (e: FormEvent) => void;
  handleToggleRecording: () => void;
  sttError: Error | null;
  attachedFiles: ParsedFilePickerResult;
  setAttachedFiles: React.Dispatch<
    React.SetStateAction<ParsedFilePickerResult>
  >;
  hideToolCalls: boolean;
  setHideToolCalls: (value: boolean) => void;
  firstTokenReceived: boolean;
  stream: any; // Type this properly based on your stream object
  handleFileUpload: () => void;
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button
      variant="outline"
      className={props.className}
      onClick={() => scrollToBottom()}
    >
      <ArrowDown className="w-4 h-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

export function ThreadFooter({
  chatStarted,
  input,
  setInput,
  isLoading,
  isRecording,
  selectedModel,
  setSelectedModel,
  handleSubmit,
  handleToggleRecording,
  sttError,
  attachedFiles,
  setAttachedFiles,
  hideToolCalls,
  setHideToolCalls,
  firstTokenReceived,
  stream,
}: ThreadFooterProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleRemoveFile = (index: number) => {
    if (attachedFiles.messageContent) {
      const newFiles = { ...attachedFiles };
      newFiles.messageContent = newFiles.messageContent.filter(
        (_, i) => i !== index
      );
      setAttachedFiles(newFiles);
    }
  };

  const handleClearAllFiles = () => {
    setAttachedFiles({} as ParsedFilePickerResult);
  };

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);
      const files: File[] = [];

      items.forEach((item) => {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
            if (ALLOWED_FILE_EXTENSIONS.includes(extension)) {
              files.push(file);
            }
          }
        }
      });

      if (files.length > 0) {
        e.preventDefault();
        try {
          const result = await window.api.handleFiles(files);
          if (result.success && result.messageContent?.length) {
            setAttachedFiles((prevFiles) => {
              const newFiles = {
                success: true,
                messageContent: [
                  ...(prevFiles?.messageContent || []),
                  ...result.messageContent,
                ],
                errors: [
                  ...(prevFiles?.errors || []),
                  ...(result.errors || []),
                ],
              } as ParsedFilePickerResult;
              return newFiles;
            });
            toast.success(`Added ${result.messageContent.length} file(s)`);
          }
        } catch (error: any) {
          toast.error(
            "Failed to process files: " + (error.message || "Unknown error")
          );
        }
      }
    },
    [setAttachedFiles]
  );

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove("border-primary");
    const files = Array.from(e.dataTransfer.files);

    const validFiles = files.filter((file) => {
      const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
      return ALLOWED_FILE_EXTENSIONS.includes(extension);
    });

    const invalidFiles = files.length - validFiles.length;
    if (invalidFiles > 0) {
      toast.error(
        `${invalidFiles} file(s) were skipped due to unsupported format`
      );
    }

    if (validFiles.length > 0) {
      try {
        console.log("validfiles", validFiles);
        const result = await window.api.handleFiles(validFiles);
        console.log("result", result);
        if (result.success && result.messageContent?.length) {
          setAttachedFiles((prevFiles) => {
            const newFiles = {
              success: true,
              messageContent: [
                ...(prevFiles?.messageContent || []),
                ...result.messageContent,
              ],
              errors: [...(prevFiles?.errors || []), ...(result.errors || [])],
            } as ParsedFilePickerResult;
            return newFiles;
          });
          toast.success(`Added ${result.messageContent.length} file(s)`);
        }
      } catch (error: any) {
        toast.error(
          "Failed to process files: " + (error.message || "Unknown error")
        );
      }
    }
  };

  const handleFilePickerUpload = async () => {
    try {
      const result = await window.api.openFilePicker();
      if (result.success && result.messageContent?.length) {
        setAttachedFiles((prevFiles) => {
          const newFiles = {
            success: true,
            messageContent: [
              ...(prevFiles?.messageContent || []),
              ...result.messageContent,
            ],
            errors: [...(prevFiles?.errors || []), ...(result.errors || [])],
          } as ParsedFilePickerResult;
          return newFiles;
        });
        toast.success(`Added ${result.messageContent.length} file(s)`);
      }
    } catch (error: any) {
      toast.error(
        "Failed to process files: " + (error.message || "Unknown error")
      );
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    if (textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = "auto"; // Reset height to correctly calculate scrollHeight
      ta.style.height = `${ta.scrollHeight}px`; // Set height to scrollHeight
      // The max-h-36 class will cap this height and add scroll overflow
    }
  }, [input]); // Re-run this effect when input changes

  return (
    <div className="sticky bottom-0 flex flex-col items-center gap-8 px-4">
      {!chatStarted && (
        <div className="flex items-center gap-3">
          <LangGraphLogoSVG className="flex-shrink-0 h-8" />
          <h1 className="text-2xl font-semibold tracking-tight">AIOS Chat</h1>
        </div>
      )}

      <ScrollToBottom className="absolute mb-4 -translate-x-1/2 bottom-full left-1/2 animate-in fade-in-0 zoom-in-95" />

      <div className="relative z-10 w-full max-w-3xl mx-auto mb-8 border shadow-xs bg-muted rounded-2xl">
        <div className="grid grid-rows-[1fr_auto] gap-2 max-w-3xl mx-auto">
          <div className="relative flex items-center gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              onPaste={handlePaste}
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add("border-primary");
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove("border-primary");
              }}
              onDrop={handleDrop}
              placeholder="Ask me anything..."
              className="flex w-full px-3 py-2 text-sm transition-colors border rounded-md resize-none border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 max-h-36"
              disabled={isLoading || isRecording}
            />
          </div>
          <AttachedFilesList
            attachedFiles={attachedFiles}
            onRemoveFile={handleRemoveFile}
            onClearAll={handleClearAllFiles}
          />

          <div className="flex items-center justify-between p-2 pt-4">
            <div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="render-tool-calls"
                  checked={hideToolCalls ?? false}
                  onCheckedChange={setHideToolCalls}
                />
                <Label htmlFor="render-tool-calls" className="text-sm">
                  Hide Tool Calls
                </Label>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleFilePickerUpload}
                title="Attach file"
                className="cursor-pointer"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
              <MicButton
                isRecording={isRecording}
                isDisabled={isLoading || !selectedModel}
                onClick={handleToggleRecording}
                error={sttError ? sttError.message : null}
              />
              {stream.isLoading ? (
                <Button key="stop" onClick={() => stream.stop()}>
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Cancel
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="transition-all shadow-md"
                  disabled={isLoading || !input.trim() || isRecording}
                  onClick={handleSubmit}
                >
                  {isLoading && !firstTokenReceived ? (
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send"
                  )}
                  <span className="sr-only">Send message</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
