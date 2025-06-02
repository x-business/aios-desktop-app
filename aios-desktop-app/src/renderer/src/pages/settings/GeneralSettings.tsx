import React from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePipedreamSettingsStore } from '@/stores/settingsStore';
import { useSystemPromptStore } from '@/stores/settingsStore';
import { Button } from '@/components/ui/button';

const GeneralSettings: React.FC = () => {
  const { pipedreamUserId, setPipedreamUserId } = usePipedreamSettingsStore();
  const { systemPrompt, setSystemPrompt } = useSystemPromptStore();

  const handlePipedreamIdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPipedreamUserId(event.target.value || null);
  };

  const handleSystemPromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemPrompt(event.target.value);
  };

  const clearSystemPrompt = () => {
    setSystemPrompt('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General Application Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure general application preferences.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <h4 className="font-medium">Appearance</h4>
            <p className="text-sm text-muted-foreground">
              Toggle between light and dark mode.
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="p-4 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              value={systemPrompt}
              onChange={handleSystemPromptChange}
              placeholder="Example: You are an AI assistant designed to be helpful, harmless, and honest. Respond in a friendly tone and always prioritize user safety."
              className="min-h-32"
            />
            {systemPrompt && (
              <div className="flex justify-end mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearSystemPrompt}
                >
                  Clear Prompt
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              The system prompt defines the AI's personality and behavior. Customize it to change how the AI responds to your queries. Leave empty to use the default behavior.
            </p>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="pipedreamUserId">Pipedream User ID (Optional)</Label>
            <Input
              id="pipedreamUserId"
              name="pipedreamUserId"
              value={pipedreamUserId || ''}
              onChange={handlePipedreamIdChange}
              placeholder="e.g., user_xxxxxxxxxxxx (leave blank if not using Pipedream)"
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Your Pipedream User ID, required to enable Pipedream apps.
              This is a temporary placeholder and will be replaced by authentication later.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
