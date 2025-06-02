import { BrowserWindow } from 'electron';
import WebSocketClient from './websocket-client.js';
import type {
  ConnectionStatus,
  ConnectionError
} from '@shared/types/index.js';
import { ToolService } from './tool-service.js';

interface MainConnectionManagerOptions {
  webSocketUrl: string;
  mainWindow: BrowserWindow;
  toolService: ToolService;
  debug?: boolean;
  maxRetries?: number;
  initialRetryDelay?: number;
  backoffFactor?: number;
}

export interface ConnectionState {
  status: ConnectionStatus;
  connectionId: string | null;
  error: ConnectionError | null;
  attempt?: number;
  maxAttempts?: number;
  retryDelay?: number;
}

export class MainConnectionManager {
  private webSocketClient: WebSocketClient;
  private mainWindow: BrowserWindow;
  private toolService: ToolService;
  private state: ConnectionState;
  private debug: boolean;

  constructor(options: MainConnectionManagerOptions) {
    this.mainWindow = options.mainWindow;
    this.toolService = options.toolService;
    this.debug = options.debug ?? false;

    this.webSocketClient = new WebSocketClient(
        options.webSocketUrl,
        options.maxRetries, 
        options.initialRetryDelay, 
        options.backoffFactor
    );

    this.state = {
      status: 'disconnected',
      connectionId: null,
      error: null,
    };

    this.webSocketClient.onMessage(this.handleWebSocketMessage.bind(this));
    this._setupWebSocketEventListeners();
  }

  private _setupWebSocketEventListeners(): void {
    this.webSocketClient.on('attempting', (attempt, maxAttempts) => {
        this.log(`WebSocket attempting to connect (Attempt ${attempt}/${maxAttempts})`);
        this.updateState({
            status: 'connecting',
            error: null,
            attempt,
            maxAttempts
        });
    });

    this.webSocketClient.on('retrying', (attempt, maxAttempts, delay, errorMessage) => {
        this.log(`WebSocket retrying connection (Attempt ${attempt}/${maxAttempts}) in ${delay}ms. Reason: ${errorMessage}`);
        this.updateState({
            status: 'connecting',
            error: { message: `Connection attempt ${attempt -1} failed. Retrying in ${delay}ms. Error: ${errorMessage}`, type: 'websocket' },
            attempt,
            maxAttempts,
            retryDelay: delay
        });
    });

    this.webSocketClient.on('connected', () => {
        this.log('WebSocket client reported connected. Current state status: ' + this.state.status);
        if (this.state.status !== 'registered') {
             this.updateState({
                status: 'connected',
                error: null,
                attempt: undefined,
                maxAttempts: undefined,
                retryDelay: undefined
            });
        }
    });

    this.webSocketClient.on('permanent_failure', (error) => {
        this.log(`WebSocket connection permanently failed: ${error.message}`, true);
        this.updateState({
            status: 'error',
            error: { message: `Failed to connect after ${this.state.maxAttempts || 'multiple'} attempts: ${error.message}`, type: 'websocket' },
            connectionId: null,
            attempt: undefined,
            maxAttempts: undefined,
            retryDelay: undefined
        });
    });

    this.webSocketClient.on('closed', (code, reason) => {
        this.log(`WebSocket client reported closed. Code: ${code}, Reason: ${reason}. Current state: ${this.state.status}`);
        if (this.state.status !== 'disconnected' && this.state.status !== 'error') {
            this.updateState({
                status: 'disconnected',
                error: this.webSocketClient.getIsConnected() ? null : { message: `WebSocket closed. Code: ${code}, Reason: ${reason}`, type: 'websocket' },
                connectionId: null,
                attempt: undefined,
                maxAttempts: undefined,
                retryDelay: undefined
            });
        } else if (this.state.status === 'error' && this.state.error?.type !== 'websocket') {
            this.updateState({
                status: 'disconnected',
                error: { message: `WebSocket closed while in error state. Code: ${code}, Reason: ${reason}`, type: 'websocket' },
                connectionId: null,
            });
        }
    });
  }

  private log(message: string, isError: boolean = false): void {
    if (this.debug) {
      const prefix = '[MainConnectionManager]';
      if (isError) console.error(`${prefix} ${message}`);
      else console.log(`${prefix} ${message}`);
    }
  }

  private handleWebSocketMessage(message: any): void {
    const parsedMessage = message;
    this.log(`Received WebSocket message: Type=${parsedMessage?.type}`);

    try {
      if (!parsedMessage || !parsedMessage.type) {
           this.log('Received message without type.', true);
           return;
      }

      switch (parsedMessage.type) {
        case 'connection_established':
          if (parsedMessage.connection_id) {
              this.updateState({
                  status: 'registered',
                  connectionId: parsedMessage.connection_id,
                  error: null,
                  attempt: undefined,
                  maxAttempts: undefined,
                  retryDelay: undefined
              });
              this.log(`Registered with connection ID: ${parsedMessage.connection_id}`);
          } else {
              this.log('Invalid connection_established message (missing connection_id).', true);
              this.updateState({ status: 'error', error: { message: 'Invalid connection_established payload', type: 'message_processing' } });
          }
          break;

        case 'tool_call':
           if (parsedMessage.tool_call_id && parsedMessage.data && parsedMessage.data.name && parsedMessage.data.arguments !== undefined) {
              this.handleToolCall({
                  tool_call_id: parsedMessage.tool_call_id,
                  tool_name: parsedMessage.data.name,
                  tool_params: parsedMessage.data.arguments
              });
           } else {
               this.log('Invalid tool_call message structure.', true);
              this.updateState({ status: 'error', error: { message: 'Invalid tool_call structure', type: 'message_processing' } });
           }
          break;

        default:
          this.log(`Received unknown message type: ${parsedMessage.type}`);
      }
    } catch (error) {
       this.log(`Error processing message: ${error}`, true);
       const errorMessage = error instanceof Error ? error.message : String(error);
       this.updateState({ status: 'error', error: { message: `Error processing message: ${errorMessage}`, type: 'message_processing' } });
    }
  }

  private async handleToolCall(payload: { tool_call_id: string; tool_name: string; tool_params: any }): Promise<void> {
      this.log(`Handling tool call for: ${payload.tool_name} (ID: ${payload.tool_call_id})`);
      let responsePayload: { status: 'success' | 'error', result?: any, error?: string };
      try {
          const result = await this.toolService.invokeTool(payload.tool_name, payload.tool_params);
          responsePayload = {
              status: 'success',
              result: result !== undefined ? result : null,
          };
           this.log(`Tool ${payload.tool_name} executed successfully via ToolService (ID: ${payload.tool_call_id}).`);
      } catch (error) {
          this.log(`Error executing tool ${payload.tool_name} via ToolService (ID: ${payload.tool_call_id}): ${error}`, true);
          const errorMessage = error instanceof Error ? error.message : String(error);
          responsePayload = {
              status: 'error',
              error: errorMessage,
          };
      }

      try {
          this.webSocketClient.send({
              tool_call_id: payload.tool_call_id,
              response: responsePayload,
          });
           this.log(`Sent tool_response for ID: ${payload.tool_call_id}`);
      } catch (sendError) {
           this.log(`Failed to send tool_response for ID ${payload.tool_call_id}: ${sendError}`, true);
      }
  }

  private updateState(newState: Partial<ConnectionState>): void {
    const previousStatus = this.state.status;
    const previousError = this.state.error ? this.state.error.message : null;

    const currentConnectionId = this.state.connectionId;
    this.state = { ...this.state, ...newState };
    if (newState.connectionId === undefined && currentConnectionId !== null) {
        this.state.connectionId = currentConnectionId;
    }
    
    if ((newState.status && newState.status !== 'error' && newState.status !== 'connecting') || newState.error === null) {
        if (newState.error !== undefined) {
            this.state.error = newState.error;
        }
    } else if (newState.status === 'error' && newState.error === undefined) {
        if (!this.state.error) {
            this.state.error = { message: 'An unspecified error occurred.', type: 'unknown' };
        }
    }

    if (newState.status && !['connecting', 'error'].includes(newState.status)) {
        this.state.attempt = undefined;
        this.state.maxAttempts = undefined;
        this.state.retryDelay = undefined;
    }
    
    const statusChanged = this.state.status !== previousStatus;
    const errorChanged = (this.state.error ? this.state.error.message : null) !== previousError;
    const connectionIdChanged = newState.connectionId !== undefined && newState.connectionId !== this.state.connectionId;
    const attemptChanged = newState.attempt !== undefined;

    if (statusChanged || errorChanged || connectionIdChanged || attemptChanged) {
        this.log(`State updated: Status=${this.state.status}, ConnectionID=${this.state.connectionId || 'null'}, Error=${this.state.error?.message || 'null'}, Attempt=${this.state.attempt || 'N/A'}`);
    }

    this.notifyRendererState();
  }

  private notifyRendererState(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed() && this.mainWindow.webContents) {
      this.mainWindow.webContents.send('connection-state-update', this.getState());
    } else {
        this.log("Cannot notify renderer state, main window is not available.", true);
    }
  }

  public getState(): ConnectionState {
    return { ...this.state };
  }

  public async initialize(): Promise<void> {
    if (this.state.status !== 'disconnected' && this.state.status !== 'error') {
        this.log(`Initialization called while not in an appropriate state (disconnected or error). Current status: ${this.state.status}`, true);
        return;
    }

    this.log('Initializing WebSocket Connection...');
    this.updateState({ 
        status: 'initializing', 
        connectionId: null, 
        error: null, 
        attempt: undefined, 
        maxAttempts: undefined, 
        retryDelay: undefined 
    });

    try {
      await this.webSocketClient.connect();
      this.log('WebSocketClient connect() promise resolved. Waiting for server registration (connection_established message).');
      if((this.state.status as ConnectionStatus) !== 'connected' && (this.state.status as ConnectionStatus) !== 'registered') {
        this.updateState({ status: 'connected', error: null });
      }

    } catch (error) {
        this.log(`WebSocketClient connect() promise rejected (permanent failure): ${error}`, true);
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (this.state.status !== 'error' || (this.state.error && this.state.error.type !== 'websocket')) {
             this.updateState({ 
                status: 'error', 
                error: { message: `Connection permanently failed: ${errorMessage}`, type: 'websocket' },
                connectionId: null
            });
        }
    }
  }

  public async shutdown(): Promise<void> {
      this.log('Shutting down WebSocket Connection...');
      this.webSocketClient.close(1000, 'Client shutting down');
      this.updateState({ 
          status: 'disconnected', 
          connectionId: null, 
          error: null, 
          attempt: undefined, 
          maxAttempts: undefined, 
          retryDelay: undefined 
        });
      this.log('WebSocket Shutdown complete triggered from ConnectionManager.');
  }
} 