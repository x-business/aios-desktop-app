import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { Badge } from "@/components/ui/badge";
import type { MCPExtensionInfo, SimpleToolInfo, ManagedExtensionStatus as SharedManagedStatus } from '@shared/types/index.js';
import { Settings, Trash2, PlugZap, RefreshCw, Loader2, AlertCircle } from 'lucide-react'; // Icons

export type ExtensionStatus =
    | 'available'     // Discoverable online only
    | 'installed'     // Managed, potentially enabled, but not connected (might need config/reconnect)
    | 'connected'     // Managed, enabled, and connected
    | 'disabled'      // Managed, explicitly disabled
    | 'configurationRequired' // Managed, cannot enable/connect without config
    | 'connecting'    // Action in progress
    | 'disconnecting' // Action in progress (implicitly via disable)
    | 'installing'    // Action in progress
    | 'uninstalling'  // Action in progress
    | 'error';        // Managed, but encountered an error during connection/operation

interface ExtensionCardProps {
    extension: Partial<MCPExtensionInfo> & { id: string; name: string; description?: string; iconPath?: string; manifest?: Partial<MCPExtensionInfo['manifest']> };
    status: ExtensionStatus;
    tools: SimpleToolInfo[];
    isLoading: boolean;
    isManaged: boolean;
    isEnabled: boolean;
    isConnected: boolean;
    managedStatus: SharedManagedStatus | null;
    onInstall: (id: string) => void;
    onUninstall: (id: string) => void;
    onConfigure: (id: string) => void;
    onReconnect: (id: string) => void;
    onToggleEnable: (id: string, enable: boolean) => void;
}

function ExtensionCard({ 
    extension, 
    status, 
    tools, 
    isLoading,
    isManaged,
    isEnabled,
    isConnected,
    onInstall, 
    onUninstall, 
    onConfigure, 
    onReconnect, 
    onToggleEnable
}: ExtensionCardProps): React.JSX.Element {

    const isDisabled = isLoading;
    
    const showReconnect = isManaged && isEnabled && !isConnected && status !== 'connecting' && status !== 'configurationRequired';

    const renderTools = () => {
        if (!isManaged) {
            return <p className="text-sm text-gray-500 italic mt-2">Install to see tools and full details.</p>;
        }
        if (!isConnected) {
            return <p className="text-sm text-gray-500 italic mt-2">Enable/Connect to see tools.</p>;
        }
        if (tools.length === 0) {
            return <p className="text-sm text-gray-500 italic mt-2">No tools provided.</p>;
        }
        return (
             <div className="mt-3 border-t border-gray-200 pt-3">
                 <h4 className="text-xs font-medium text-muted-foreground mb-2">Tools:</h4>
                 <div className="flex flex-wrap gap-1">
                    {tools.map(tool => (
                        <Badge key={tool.name} variant="secondary" title={tool.description} className="cursor-default">
                            {tool.name.startsWith(`mcp-${extension.id}-`) ? tool.name.substring(`mcp-${extension.id}-`.length) : tool.name}
                        </Badge>
                    ))}
                 </div>
             </div>
        );
    };

    const renderActionButtons = () => {
        if (status === 'installing') return <Button size="sm" disabled={true}><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Installing...</Button>;
        if (status === 'connecting' || status === 'disconnecting') return <Button size="sm" disabled={true}><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {status === 'connecting' ? 'Enabling...' : 'Disabling...'}</Button>;
        if (status === 'uninstalling') return <Button size="sm" variant="outline" disabled={true}><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uninstalling...</Button>;

        const buttons: React.ReactNode[] = [];

        if (!isManaged) {
            buttons.push(
                <Button key="install" size="sm" onClick={() => onInstall(extension.id)} disabled={isDisabled}>
                    Install
                </Button>
            );
        } else {
            if (status === 'configurationRequired') {
                buttons.push(
                     <Button key="configure" size="sm" variant="destructive" onClick={() => onConfigure(extension.id)} disabled={isDisabled} title="Configuration Required">
                         <Settings className="mr-2 h-4 w-4" />
                         Configure
                     </Button>
                );
            } else {
                 buttons.push(
                     <Button 
                         key="toggle-enable" 
                         size="sm" 
                         variant={isEnabled ? "secondary" : "default"}
                         onClick={() => onToggleEnable(extension.id, !isEnabled)}
                         disabled={isDisabled} 
                         title={isEnabled ? "Disable (will disconnect)" : "Enable (will connect)"}
                     >
                         <PlugZap className={`h-4 w-4 ${isEnabled ? 'text-red-600' : 'text-green-600'}`}/> 
                         <span className="ml-1">{isEnabled ? "Disable" : "Enable"}</span>
                     </Button>
                 );

                 if (showReconnect) {
                      buttons.push(
                          <Button key="reconnect" size="sm" variant="outline" onClick={() => onReconnect(extension.id)} disabled={isDisabled} title="Attempt Reconnect">
                               <RefreshCw className="h-4 w-4" />
                          </Button>
                      );
                 }
                 
                 buttons.push(
                     <Button key="configure-normal" size="sm" variant="outline" onClick={() => onConfigure(extension.id)} disabled={isDisabled} title="Configure">
                         <Settings className="h-4 w-4" />
                     </Button>
                 );
            }
             buttons.push(
                 <Button key="uninstall" size="sm" variant="outline" onClick={() => onUninstall(extension.id)} disabled={isDisabled} title="Uninstall">
                     <Trash2 className="h-4 w-4" />
                 </Button>
             );
        }

        return (
             <div className="flex gap-1.5 flex-shrink-0 ml-4 items-center"> 
                 {buttons}
             </div>
        );
    };

    const getStatusIndicator = () => {
         let color = 'bg-gray-300';
         let title = status.charAt(0).toUpperCase() + status.slice(1);
         let icon: React.ReactNode | null = null;
         let animate = false;

         switch (status) {
             case 'connected': color = 'bg-green-500'; title = 'Connected'; break;
             case 'disabled': color = 'bg-gray-500'; title = isEnabled ? 'Enabled (Needs Reconnect)' : 'Disabled'; break;
             case 'installed': color = 'bg-yellow-500'; title = 'Enabled (Not Connected)'; break;
             case 'connecting': color = 'bg-blue-500'; animate = true; title = 'Enabling...'; break;
             case 'disconnecting': color = 'bg-blue-500'; animate = true; title = 'Disabling...'; break;
             case 'installing': color = 'bg-blue-500'; animate = true; title = 'Installing'; break;
             case 'uninstalling': color = 'bg-blue-500'; animate = true; title = 'Uninstalling'; break;
             case 'error': color = 'bg-red-500'; icon = <AlertCircle className="h-3 w-3 text-white" />; title = 'Error'; break;
             case 'configurationRequired': color = 'bg-orange-500'; icon = <Settings className="h-3 w-3 text-white" />; title = 'Configuration Required'; break;
             case 'available': color = 'bg-gray-300'; title = 'Available'; break;
             default: title = 'Unknown'; break;
         }
         return (
             <span 
                 title={title} 
                 className={`block h-3 w-3 flex-shrink-0 rounded-full transition-colors ${color} ${animate ? 'animate-pulse' : ''} flex items-center justify-center`}
             >
                 {icon}
             </span>
         );
     };

    return (
        <Card className="w-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3 min-w-0 mr-4">
                     {getStatusIndicator()}
                     <div className="min-w-0">
                        <CardTitle className="text-base font-semibold truncate">{extension.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">ID: {extension.id}</p>
                    </div>
                 </div>
                 {renderActionButtons()}
            </CardHeader>
            <CardContent className="pt-0">
                 <CardDescription className="text-sm mt-1 line-clamp-3">{extension.description || 'No description available.'}</CardDescription>
                {renderTools()}
            </CardContent>
        </Card>
    );
}

export default ExtensionCard; 