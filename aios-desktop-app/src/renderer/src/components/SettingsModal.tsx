import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TooltipIconButton } from "./thread/tooltip-icon-button";
import { Settings } from "lucide-react";
import ExtensionManager from "./ExtensionManager";

function SettingsModal(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
         <TooltipIconButton tooltip="Manage Extensions">
            <Settings className="size-5" />
         </TooltipIconButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[80vw] md:max-w-[70vw] lg:max-w-[60vw] xl:max-w-[50vw] max-h-[80vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent">
         <DialogHeader>
            <DialogTitle>Extension Manager</DialogTitle>
         </DialogHeader>
         {/* Render ExtensionManager only when dialog is open to potentially save resources */}
         {isOpen && <ExtensionManager />}
      </DialogContent>
    </Dialog>
  );
}

export default SettingsModal; 