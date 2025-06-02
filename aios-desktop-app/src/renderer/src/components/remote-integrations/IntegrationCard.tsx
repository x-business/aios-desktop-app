import React from 'react';
import type { PipedreamAppMetadata, PersistedRemoteIntegrationConfig, RuntimeRemoteIntegrationDetails } from '@shared/types/remote-integration';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
// We might need an icon component later
// import { IconComponent } from '@/components/common/IconComponent'; 

// Specific busy action types for each card type
export type DiscoverableCardBusyActionType = 'add';
export type ConfiguredCardBusyActionType = 'remove' | 'toggle-enable' | 'reconnect';

interface BaseIntegrationProps {
  // Common props if any, excluding isBusyAction and userId for now
}

interface DiscoverableIntegrationCardProps extends BaseIntegrationProps {
  integration: PipedreamAppMetadata;
  type: 'discoverable';
  isBusyAction?: DiscoverableCardBusyActionType | null;
  onAdd: (app: PipedreamAppMetadata) => void;
  // Ensure other props are never for this type
  connectionStatus?: never;
  onRemove?: never;
  onToggleEnable?: never;
  onReconnect?: never;
  userId?: never; // Explicitly never if not used
}

interface ConfiguredIntegrationCardProps extends BaseIntegrationProps {
  integration: PersistedRemoteIntegrationConfig;
  type: 'configured';
  isBusyAction?: ConfiguredCardBusyActionType | null;
  connectionStatus?: { connected: boolean; error?: string; details?: RuntimeRemoteIntegrationDetails };
  onRemove: (config: PersistedRemoteIntegrationConfig) => void;
  onToggleEnable: (config: PersistedRemoteIntegrationConfig) => void;
  onReconnect: (config: PersistedRemoteIntegrationConfig) => void;
  // Ensure other props are never for this type
  onAdd?: never;
}

type IntegrationCardProps = DiscoverableIntegrationCardProps | ConfiguredIntegrationCardProps;

const IntegrationCard: React.FC<IntegrationCardProps> = (props) => {
  const { integration, type } = props;
  const { name, description, categories, img_src: iconUrl } = integration;

  // Determine isBusy status for specific actions based on props type
  const isAdding = type === 'discoverable' && props.isBusyAction === 'add';
  const isRemoving = type === 'configured' && props.isBusyAction === 'remove';
  const isTogglingEnable = type === 'configured' && props.isBusyAction === 'toggle-enable';
  const isReconnecting = type === 'configured' && props.isBusyAction === 'reconnect';
  
  const isAnyActionBusy = Boolean(
    (type === 'discoverable' && props.isBusyAction) || 
    (type === 'configured' && props.isBusyAction)
  );

  const renderStatusIndicator = () => {
    if (type !== 'configured') return null;
    // When type is 'configured', props is ConfiguredIntegrationCardProps
    const configuredProps = props as ConfiguredIntegrationCardProps;
    const { enabled } = configuredProps.integration;
    const connectionStatus = configuredProps.connectionStatus;

    let color = 'bg-gray-300';
    let title = 'Unknown';
    let icon: React.ReactNode | null = null;
    let animate = false;

    if (!enabled) {
      color = 'bg-gray-400';
      title = 'Disabled';
    } else if (isTogglingEnable && !enabled) { // When enabling
      color = 'bg-blue-500';
      animate = true;
      title = 'Enabling...';
      icon = <Loader2 className="h-3 w-3 text-white animate-spin" />;
    } else if (isTogglingEnable && enabled) { // When disabling
      color = 'bg-blue-500';
      animate = true;
      title = 'Disabling...';
      icon = <Loader2 className="h-3 w-3 text-white animate-spin" />;
    } else if (isReconnecting) { // When reconnecting
      color = 'bg-blue-500';
      animate = true;
      title = 'Reconnecting...';
      icon = <Loader2 className="h-3 w-3 text-white animate-spin" />;
    } else if (enabled && !connectionStatus) {
      color = 'bg-yellow-500';
      title = 'Connection: Checking...';
    } else if (enabled && connectionStatus) {
      if (connectionStatus.connected) {
        color = 'bg-green-500';
        title = 'Connected';
      } else {
        color = 'bg-red-500';
        title = connectionStatus.error ? `Error: ${connectionStatus.error}` : 'Disconnected';
        icon = <AlertCircle className="h-3 w-3 text-white" />;
      }
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
    <Card className="flex flex-col justify-between h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          {iconUrl && (
            <img 
              src={iconUrl} 
              alt={`${name} icon`} 
              className="w-10 h-10 rounded-sm object-contain flex-shrink-0"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          )}
          <div className="flex-grow min-w-0">
            <CardTitle className="truncate">{name}</CardTitle>
            {categories && categories.length > 0 && (
              <CardDescription className="text-xs mt-1 truncate">{categories.join(', ')}</CardDescription>
            )}
          </div>
          {type === 'configured' && renderStatusIndicator()}
        </div>
      </CardHeader>
      <CardContent className="flex-grow pt-2">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {description || 'No description available.'}
        </p>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 justify-end">
        {type === 'discoverable' && (
          <Button 
            onClick={() => props.onAdd(props.integration)} 
            disabled={isAnyActionBusy}
          >
            {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isAdding ? 'Adding...' : 'Add'}
          </Button>
        )}
        {type === 'configured' && (
          <>
            {(() => {
              if (props.type !== 'configured') return null;
              // Destructure all needed props for configured card actions
              // props is ConfiguredIntegrationCardProps here
              const { 
                integration: currentIntegration, 
                // connectionStatus, // No longer needed for button visibility
                isBusyAction: currentConfiguredBusyAction, 
                onReconnect, 
                onToggleEnable, 
                onRemove 
              } = props;

              // const showReconnectButton = currentIntegration.enabled && 
              //                            (connectionStatus?.connected === false || connectionStatus?.error);
              // Reconnect button is now always shown for configured cards

              return (
                <>
                  {/* {showReconnectButton && ( */} {/* Condition removed */}
                    <Button 
                      variant="outline"
                      size="icon"
                      title="Reconnect"
                      onClick={() => onReconnect(currentIntegration)}
                      disabled={!!(currentConfiguredBusyAction && currentConfiguredBusyAction !== 'reconnect')}
                      className="mr-2"
                    >
                      {currentConfiguredBusyAction === 'reconnect' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                  {/* )} */} {/* Condition removed */}
                  <Button 
                    variant="outline" 
                    onClick={() => onToggleEnable(currentIntegration)} 
                    disabled={isAnyActionBusy && !isTogglingEnable}
                  >
                    {isTogglingEnable ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isTogglingEnable ? 'Updating...' : (currentIntegration.enabled ? 'Disable' : 'Enable')}
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => onRemove(currentIntegration)} 
                    disabled={isAnyActionBusy && !isRemoving}
                  >
                    {isRemoving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isRemoving ? 'Removing...' : 'Remove'}
                  </Button>
                </>
              );
            })()}
          </>
        )}
      </CardFooter>
    </Card>
  );
};

export default IntegrationCard; 