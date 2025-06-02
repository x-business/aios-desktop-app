/**
 * WebSocketStatus component
 * 
 * Displays the current status of the WebSocket connection.
 */
import React from 'react';
import { useWebSocket } from '../../providers/WebSocketProvider';

interface WebSocketStatusProps {
  showConnectionId?: boolean;
  className?: string;
}

export const WebSocketStatus: React.FC<WebSocketStatusProps> = ({
  showConnectionId = false,
  className = '',
}) => {
  const { status, connectionId, error } = useWebSocket();
  
  const getStatusColor = () => {
    switch (status) {
      case 'registered':
        return 'text-green-500';
      case 'connected':
        return 'text-blue-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };
  
  const getStatusText = () => {
    switch (status) {
      case 'registered':
        return 'Connected & Ready';
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor()}`} />
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      
      {showConnectionId && connectionId && (
        <div className="text-xs text-gray-500 ml-2">
          ID: {connectionId.substring(0, 8)}...
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-500 ml-2" title={error.message}>
          {error.message.substring(0, 30)}{error.message.length > 30 ? '...' : ''}
        </div>
      )}
    </div>
  );
};

export default WebSocketStatus; 