import React from 'react';
import { Mic, MicOff } from 'lucide-react'; // Import icons
import { Button } from '../ui/button'; // Use the existing Button component for consistency
import { cn } from '@/lib/utils'; // Use utility for conditional classes

interface MicButtonProps {
  isRecording: boolean;
  isDisabled: boolean;
  onClick: () => void;
  error: string | null;
  className?: string; // Allow passing custom classes
}

export const MicButton: React.FC<MicButtonProps> = ({
  isRecording,
  isDisabled,
  onClick,
  error,
  className,
}) => {
  return (
    <div className="flex flex-col items-center">
      <Button
        type="button" // Prevent form submission if used inside a form
        variant={isRecording ? 'destructive' : 'outline'} // Use variants for visual feedback
        size="icon" // Make it a square icon button
        onClick={onClick}
        // Disable based *only* on the prop passed from the parent
        disabled={isDisabled}
        className={cn(
          'relative rounded-full w-10 h-10', // Ensure it's circular and sized
          isRecording && 'animate-pulse', // Optional pulse animation when recording
          className
        )}
        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
      >
        {isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>
      {error && (
        <p
          className="text-xs text-red-500 dark:text-red-400 mt-1 text-center max-w-[150px]"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};
