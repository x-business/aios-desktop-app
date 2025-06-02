import React from 'react';
import { useModelStore } from '@/stores/modelStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ModelsSettings: React.FC = () => {
  const { selectedModel, setSelectedModel } = useModelStore();

  const models = [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-4 text-2xl font-bold">Models Settings</h1>
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 text-lg font-medium">Select Default Model</h2>
            <Select
              value={selectedModel}
              onValueChange={(value) => setSelectedModel(value)}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {models.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelsSettings; 