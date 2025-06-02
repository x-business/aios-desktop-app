import React from "react";
import { useWebSocket } from "@/providers/WebSocketProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Terminal } from "lucide-react";
import type { ConnectionStatus } from "@shared/types/index";

// Helper function to map status to progress value (moved from App.tsx)
const getProgressValue = (status: ConnectionStatus): number => {
  switch (status) {
    case 'initializing':
      return 10;
    case 'connecting':
      return 30;
    case 'connected': 
      return 60;
    case 'registering': 
      return 80;
    case 'registered': 
      return 100;
    case 'disconnected':
    case 'error':
    default:
      return 0;
  }
};

interface ConnectionGuardProps {
  children: React.ReactNode;
}

export const ConnectionGuard: React.FC<ConnectionGuardProps> = ({ children }) => {
  const { status, error } = useWebSocket();

  if (status === 'error') {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-lg">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Failed to establish or maintain connection with the server.
            Details: {error?.message || 'Unknown error'}
            (Type: {error?.type || 'unknown'})
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (status !== 'registered') {
    const progressValue = getProgressValue(status);
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Progress value={progressValue} className="w-[60%] max-w-sm" />
        <p className="text-sm text-muted-foreground">Status: {status}</p>
      </div>
    );
  }

  // If status is 'registered', render children
  return <>{children}</>; 
}; 