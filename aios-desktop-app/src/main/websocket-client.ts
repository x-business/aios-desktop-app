import WebSocket from 'ws';
import { EventEmitter } from 'events';

const DEFAULT_MAX_RETRIES = 5;
const DEFAULT_INITIAL_RETRY_DELAY = 1000; // 1 second
const DEFAULT_BACKOFF_FACTOR = 2;

class WebSocketClient extends EventEmitter {
    private wsUrl: string;
    private ws: WebSocket | null;
    private isConnected: boolean;
    private messageHandlers: ((message: any) => void)[];
    
    private connectionPromise: Promise<void> | null = null;
    private connectionResolve: (() => void) | null = null;
    private connectionReject: ((reason?: any) => void) | null = null;

    private maxRetries: number;
    private initialRetryDelay: number;
    private backoffFactor: number;
    private currentRetries: number;
    private retryTimeoutId: NodeJS.Timeout | null;
    private isPermanentlyFailed: boolean;
    private intentionallyClosed: boolean;

    constructor(url: string, maxRetries: number = DEFAULT_MAX_RETRIES, initialRetryDelay: number = DEFAULT_INITIAL_RETRY_DELAY, backoffFactor: number = DEFAULT_BACKOFF_FACTOR) {
        super();
        this.wsUrl = url;
        this.ws = null;
        this.isConnected = false;
        this.messageHandlers = [];

        this.maxRetries = maxRetries;
        this.initialRetryDelay = initialRetryDelay;
        this.backoffFactor = backoffFactor;
        this.currentRetries = 0;
        this.retryTimeoutId = null;
        this.isPermanentlyFailed = false;
        this.intentionallyClosed = false;
    }

    connect(): Promise<void> {
        if (this.isConnected) {
            return Promise.resolve();
        }
        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.intentionallyClosed = false;
        this.isPermanentlyFailed = false;
        this.currentRetries = 0;

        this.connectionPromise = new Promise((resolve, reject) => {
            this.connectionResolve = resolve;
            this.connectionReject = reject;
            this._attemptConnection();
        });
        return this.connectionPromise;
    }

    private _attemptConnection(): void {
        if (this.intentionallyClosed || this.isPermanentlyFailed) {
            return;
        }

        this.emit('attempting', this.currentRetries + 1, this.maxRetries);
        console.log(`Attempting to connect to WebSocket server at ${this.wsUrl} (Attempt ${this.currentRetries + 1}/${this.maxRetries})`);
        
        // Clean up previous WebSocket instance if any
        if (this.ws) {
            this.ws.removeAllListeners();
            this.ws.terminate(); // Force close if it was stuck
        }
        this.ws = new WebSocket(this.wsUrl);

        this.ws.on('open', () => {
            console.log(`Connected to WebSocket server at ${this.wsUrl}`);
            this.isConnected = true;
            this.currentRetries = 0; // Reset retries on successful connection
            if (this.retryTimeoutId) {
                clearTimeout(this.retryTimeoutId);
                this.retryTimeoutId = null;
            }
            this.emit('connected');
            if (this.connectionResolve) {
                this.connectionResolve();
            }
        });

        this.ws.on('message', (data: WebSocket.RawData) => {
            this.handleMessage(data);
        });

        this.ws.on('error', (error: Error) => {
            // 'error' is often followed by 'close'. We'll handle retry logic in 'close'.
            console.error('WebSocket error:', error.message);
            // We don't call _handleConnectionFailure here directly, 
            // as 'close' event will usually follow and handle it.
            // If 'close' doesn't follow, it's a more complex scenario,
            // but typically 'close' is guaranteed after 'error' for connection issues.
        });

        this.ws.on('close', (code, reason) => {
            const reasonStr = reason ? reason.toString() : 'No reason provided';
            console.log(`WebSocket connection closed. Code: ${code}, Reason: ${reasonStr}`);
            this.isConnected = false;
            
            if (this.intentionallyClosed) {
                this.emit('closed', code, reasonStr);
                this._rejectConnectionPromise(new Error(`WebSocket closed intentionally. Code: ${code}, Reason: ${reasonStr}`));
                this.resetConnectionPromiseFields(); // Ensure promise fields are cleared after intentional close.
            } else if (!this.isPermanentlyFailed) {
                this._handleConnectionFailure(new Error(`WebSocket closed unexpectedly. Code: ${code}, Reason: ${reasonStr}`));
            }
        });
    }

    private _handleConnectionFailure(error: Error): void {
        if (this.intentionallyClosed || this.isPermanentlyFailed) {
            return;
        }

        this.currentRetries++;
        if (this.currentRetries <= this.maxRetries) {
            const delay = this.initialRetryDelay * Math.pow(this.backoffFactor, this.currentRetries - 1);
            console.log(`Connection failed. Retrying in ${delay}ms (Attempt ${this.currentRetries}/${this.maxRetries}). Error: ${error.message}`);
            this.emit('retrying', this.currentRetries, this.maxRetries, delay, error.message);
            
            if (this.retryTimeoutId) clearTimeout(this.retryTimeoutId); // Clear any existing timeout
            this.retryTimeoutId = setTimeout(() => {
                this.retryTimeoutId = null; // Clear the ID once the timeout has fired
                this._attemptConnection();
            }, delay);
        } else {
            console.error(`Max retries (${this.maxRetries}) reached. WebSocket connection permanently failed. Last error: ${error.message}`);
            this.isPermanentlyFailed = true;
            this.emit('permanent_failure', error);
            this._rejectConnectionPromise(error);
            this.resetConnectionPromiseFields();
        }
    }
    
    private _rejectConnectionPromise(error: any) {
        if (this.connectionReject) {
            this.connectionReject(error);
        }
    }

    private resetConnectionPromiseFields() { // Renamed from resetConnectionPromise to be more specific
        this.connectionPromise = null;
        this.connectionResolve = null;
        this.connectionReject = null;
    }

    private handleMessage(rawData: WebSocket.RawData): void {
        try {
            const message = JSON.parse(rawData.toString());
            this.messageHandlers.forEach(handler => handler(message));
        } catch (error) {
            console.error('Failed to parse incoming WebSocket message:', rawData.toString(), error);
        }
    }

    onMessage(handler: (message: any) => void): void {
        this.messageHandlers.push(handler);
    }

    send(data: any): void {
        if (!this.isConnected || !this.ws) {
            console.error('WebSocket send error: Not connected.');
            throw new Error('WebSocket is not connected');
        }
        try {
            this.ws.send(JSON.stringify(data));
        } catch (error) {
            console.error('WebSocket send error:', error);
            throw error;
        }
    }

    close(code?: number, reason?: string): void {
        console.log(`Intentionally closing WebSocket connection... Code: ${code}, Reason: ${reason || 'N/A'}`);
        this.intentionallyClosed = true;
        if (this.retryTimeoutId) {
            clearTimeout(this.retryTimeoutId);
            this.retryTimeoutId = null;
        }
        if (this.ws) {
            // Remove listeners before closing to prevent 'close' handler from attempting retries
            this.ws.removeAllListeners('error');
            this.ws.removeAllListeners('close');
            this.ws.on('close', (closeCode, closeReason) => { // Add a simple logger for the actual close
                console.log(`Underlying WebSocket instance closed. Code: ${closeCode}, Reason: ${closeReason?.toString()}`);
                this.emit('closed', closeCode, closeReason?.toString());
            });
            this.ws.close(code, reason);
        }
        // If there's an ongoing connection attempt, reject its promise.
        if (this.connectionPromise && !this.isConnected && !this.isPermanentlyFailed) {
            this._rejectConnectionPromise(new Error('WebSocket connection attempt cancelled by explicit close.'));
        }
        this.resetConnectionPromiseFields();
        this.isConnected = false; // Ensure isConnected is false
    }

    getIsConnected(): boolean {
        return this.isConnected;
    }
}

export default WebSocketClient; 