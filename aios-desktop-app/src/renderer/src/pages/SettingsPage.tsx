import React from 'react';
import { NavLink, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils"; // For conditional class names
import { Button } from "@/components/ui/button"; // Import Button
import { ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon

// Import the settings components
import GeneralSettings from './settings/GeneralSettings';
// import ModelsSettings from './settings/ModelsSettings'; // Commented out Models
import McpSettings from './settings/McpSettings';
import RemoteIntegrationsSettings from './settings/RemoteIntegrationsSettings';
import UserInfoSettings from './settings/UserInfoSettings';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate(); // Hook for navigation
  console.log("Nav url on settings page: ", window.location.href)

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "block px-4 py-2 rounded-md text-sm font-medium transition-colors",
      isActive
        ? "bg-primary text-primary-foreground shadow-sm"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    );

  const settingsNav = [
    { name: 'General', href: 'general' },
    { name: 'User Info', href: 'user-info' },
    // { name: 'Models', href: 'models' }, // Commented out Models
    { name: 'MCP Extensions', href: 'mcp' },
    { name: 'Remote Integrations', href: 'remote-integrations' },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border p-4 flex flex-col flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold px-2">Settings</h1>
          {/* Back Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/')} // Navigate back one step in history
            title="Back to Chat"
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex flex-col space-y-1">
          {settingsNav.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
         {/* Maybe add a back button or other controls at the bottom? */}
         <div className="mt-auto"> 
            {/* Placeholder for future bottom controls */}
         </div>
      </aside>

      {/* Main Content Area - Now defines nested routes */}
      <main className="flex-1 p-6 overflow-y-auto">
        <Routes>
          {/* Redirect base /settings path to /settings/mcp */}
          <Route path="/" element={<Navigate to="mcp" replace />} /> 
          <Route path="general" element={<GeneralSettings />} />
          <Route path="user-info" element={<UserInfoSettings />} />
          {/* <Route path="models" element={<ModelsSettings />} /> */}
          <Route path="mcp" element={<McpSettings />} />
          <Route path="remote-integrations" element={<RemoteIntegrationsSettings />} />
          {/* Catch-all for unknown settings paths (optional) */}
          <Route path="*" element={<div>Settings Section Not Found</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default SettingsPage; 