/**
 * WebSocketProvider
 * 
 * React context provider for WebSocket connections to the LangGraph server.
 * Manages connection lifecycle and provides connection state to components.
 */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ConnectionStatus, ConnectionError, ConnectionState } from '@shared/types/index.js';


interface WebSocketContextValue {
  connectionId: string | null;
  status: ConnectionStatus;
  error: ConnectionError | null;
  // For minimal plan, connect/disconnect are not functional from renderer
  // connect: () => Promise<string>; 
  // disconnect: () => void;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextValue>({
  connectionId: null,
  status: 'disconnected', 
  error: null,
  // connect: async () => { throw new Error('Connect not implemented in minimal IPC setup'); },
  // disconnect: () => { console.warn('Disconnect not implemented in minimal IPC setup'); },
});

interface WebSocketProviderProps {
  children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  // State holds the connection info fetched from main process
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: 'initializing', // Start in initializing state
    connectionId: null,
    error: null,
  });

  // Effect to get initial state from main process via IPC
  useEffect(() => {
    let isMounted = true; // Prevent state update on unmounted component

    const fetchInitialState = async () => {
        // Try accessing directly assuming window.api is always defined by preload
        if (window?.api?.getConnectionState) { 
            console.log('[WebSocketProvider] Fetching initial connection state via IPC...');
            try {
                const initialState = await window.api?.getConnectionState();
                if (isMounted) {
                    console.log('[WebSocketProvider] Received initial state:', initialState);
                    setConnectionState(initialState);
                }
            } catch (err: any) {
                console.error('[WebSocketProvider] Failed to get initial connection state:', err);
                if (isMounted) {
                    setConnectionState(prev => ({ 
                        ...prev, 
                        status: 'error', 
                        error: { 
                            type: 'initialization', 
                            message: err.message || 'Failed to get initial state from main process' 
                        } 
                    }));
                }
            }
        } else {
            console.error('[WebSocketProvider] Preload API (window.api.getConnectionState) not available.');
             if (isMounted) {
                 setConnectionState(prev => ({ 
                     ...prev, 
                     status: 'error', 
                     error: { type: 'initialization', message: 'Preload API not available' } 
                 }));
             }
        }
    };

    fetchInitialState();

    return () => {
        isMounted = false;
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to listen for state updates from main process via IPC
  useEffect(() => {
    let removeListener: (() => void) | undefined;

    // Try accessing directly assuming window.api is always defined by preload
    if (window?.api?.onConnectionStateUpdate) { 
        console.log('[WebSocketProvider] Setting up listener for connection state updates via IPC...');
        removeListener = window.api.onConnectionStateUpdate((newState) => {
            console.log('[WebSocketProvider] Received state update via IPC:', newState);
            // Update state directly with the new state from main process
            setConnectionState(newState); 
        });
    } else {
        console.warn('[WebSocketProvider] Preload API (window.api.onConnectionStateUpdate) not available for listening to updates.');
    }
    
    // Cleanup function: remove the listener when the component unmounts
    return () => {
        if (removeListener) {
            console.log('[WebSocketProvider] Removing listener for connection state updates.');
            removeListener();
        }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Context value derived from the fetched state
  const value: WebSocketContextValue = useMemo(() => ({
    connectionId: connectionState.connectionId,
    status: connectionState.status,
    error: connectionState.error,
  }), [connectionState]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use the WebSocket context
export const useWebSocket = (): WebSocketContextValue => {
  const context = useContext(WebSocketContext);
  
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  return context;
};

export default WebSocketProvider; 