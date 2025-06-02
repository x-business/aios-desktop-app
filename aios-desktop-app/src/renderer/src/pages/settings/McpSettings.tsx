import React from 'react';
import ExtensionManager from '@/components/ExtensionManager'; // Adjust the path if needed

const McpSettings: React.FC = () => {
  return (
    <div className="h-full">
      {/* The ExtensionManager component handles its own title/layout internally */}
      <ExtensionManager />
    </div>
  );
};

export default McpSettings; 