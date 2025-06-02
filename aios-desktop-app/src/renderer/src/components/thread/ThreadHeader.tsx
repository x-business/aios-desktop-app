import { Button } from "../ui/button";
import { motion } from "framer-motion";
import { PanelRightOpen, PanelRightClose, SquarePen } from "lucide-react";
import { LangGraphLogoSVG } from "../icons/langgraph";
import { TooltipIconButton } from "./tooltip-icon-button";

interface ThreadHeaderProps {
  chatStarted: boolean;
  chatHistoryOpen: boolean;
  setChatHistoryOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  isLargeScreen: boolean;
  setThreadId: (value: string | null) => void;
}

export function ThreadHeader({
  chatStarted,
  chatHistoryOpen,
  setChatHistoryOpen,
  isLargeScreen,
  setThreadId,
}: ThreadHeaderProps) {
  if (!chatStarted) {
    return (
      <div className="absolute top-0 left-0 z-10 flex items-center justify-between w-full gap-3 p-2 pl-4">
        {(!chatHistoryOpen || !isLargeScreen) && (
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
        )}
      </div>
    );
  }

  return (
    <div className="relative z-10 flex items-center justify-between gap-3 p-2 pl-4">
      <div className="relative flex items-center justify-start gap-2">
        <div className="absolute left-0 z-10">
          {(!chatHistoryOpen || !isLargeScreen) && (
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
          )}
        </div>
        <motion.button
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => setThreadId(null)}
          animate={{
            marginLeft: !chatHistoryOpen ? 48 : 0,
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          <LangGraphLogoSVG width={32} height={32} />
          <span className="text-xl font-semibold tracking-tight">
            AIOS Chat
          </span>
        </motion.button>
      </div>

      <TooltipIconButton
        size="lg"
        className="p-4"
        tooltip="New thread"
        variant="ghost"
        onClick={() => setThreadId(null)}
      >
        <SquarePen className="size-5" />
      </TooltipIconButton>

      <div className="absolute inset-x-0 h-5 top-full bg-gradient-to-b from-background to-background/0" />
    </div>
  );
}
