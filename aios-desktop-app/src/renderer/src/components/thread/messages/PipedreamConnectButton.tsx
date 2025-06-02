import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";

interface PipedreamConnectButtonProps {
  url: string;
  appName?: string; // e.g., "Supabase"
}

export function PipedreamConnectButton({ url, appName }: PipedreamConnectButtonProps) {
  const handleConnect = () => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const buttonText = appName
    ? `Connect your ${appName} account`
    : "Connect your account";

  return (
    <Button 
      onClick={handleConnect} 
      // Simplified classes for testing icon visibility, variant is default (solid)
    >
      <LogIn 
        size={16} 
        // Explicitly setting a color for testing. Blue is often distinct.
        // If you have a theme color like text-primary or similar, that could be used too.
        style={{ color: "green" }} 
        className="mr-1"
      /> 
      {buttonText}
    </Button>
  );
} 