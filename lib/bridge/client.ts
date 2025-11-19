import { BridgeMessage, MessageType, ApiRequestPayload, ApiResponsePayload, isBridgeMessage } from './types';

const REQUEST_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MESSAGE = 'リクエストがタイムアウトしました (30秒)';

const buildFailureMessage = (status: number) => `ステータス${status}でリクエストが失敗しました`;

export class BridgeRequestError extends Error {
    public readonly status: number;
    public readonly errorType?: ApiResponsePayload['errorType'];

    constructor(message: string, status: number, errorType?: ApiResponsePayload['errorType']) {
        super(message);
        this.name = 'BridgeRequestError';
        this.status = status;
        this.errorType = errorType;
    }
}

type PendingRequest = {
    resolve: (data: unknown) => void;
    reject: (error: Error) => void;
    timeoutId: ReturnType<typeof setTimeout>;
};

export class PluginClient {
    private readonly targetWindow: Window;
    private readonly allowedOrigins: string[];
    private readonly targetOrigin: string;
    private readonly pendingRequests: Map<string, PendingRequest>;
    private readonly boundHandleMessage: (event: MessageEvent) => void;

    constructor(targetWindow: Window = window.parent, origin: string = '*') {
        this.targetWindow = targetWindow;
        this.allowedOrigins = this.resolveAllowedOrigins(origin);
        this.targetOrigin = this.resolveTargetOrigin();
        this.pendingRequests = new Map();
        this.boundHandleMessage = this.handleMessage.bind(this);

        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.boundHandleMessage);
        }

        // Initiate handshake
        this.send({
            id: this.generateId(),
            type: MessageType.HANDSHAKE,
            payload: {},
            source: 'plugin',
        });
    }

    public destroy() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('message', this.boundHandleMessage);
        }
    }

    // --- Core API Methods ---

    public async request(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: unknown): Promise<unknown> {
        return new Promise((resolve, reject) => {
            const requestId = this.generateId();
            const timeoutId = this.startRequestTimeout(requestId, reject);
            this.pendingRequests.set(requestId, { resolve, reject, timeoutId });

            this.send({
                id: requestId,
                type: MessageType.API_REQUEST,
                payload: { endpoint, method, body } as ApiRequestPayload,
                source: 'plugin',
            });
        });
    }

    // --- Convenience Wrappers ---

    public readonly projects = {
        list: () => this.request('projects', 'GET'),
        // create: (data: any) => this.request('projects', 'POST', data),
    };

    public readonly revenues = {
        list: () => this.request('revenues', 'GET'),
    };

    // --- Internal Methods ---

    private handleMessage(event: MessageEvent) {
        if (event.source !== this.targetWindow) return;
        if (!this.isAllowedOrigin(event.origin)) {
            console.warn('[PluginClient] Rejected message from unauthorized origin:', event.origin);
            return;
        }

        const message = isBridgeMessage(event.data) ? event.data : null;
        if (!message || message.source !== 'host') return;

        switch (message.type) {
            case MessageType.HANDSHAKE_ACK:
                if (process.env.NODE_ENV !== 'production') {
                    console.log('Plugin connected to host:', message.payload);
                }
                break;

            case MessageType.API_RESPONSE:
                this.handleApiResponse(message.payload);
                break;
        }
    }

    private handleApiResponse(payload: ApiResponsePayload) {
        const { requestId, status, data, error, errorType } = payload;
        const pending = this.pendingRequests.get(requestId);

        if (pending) {
            clearTimeout(pending.timeoutId);
            if (status >= 200 && status < 300) {
                pending.resolve(data);
            } else {
                pending.reject(new BridgeRequestError(error || buildFailureMessage(status), status, errorType));
            }
            this.pendingRequests.delete(requestId);
        }
    }

    private send(message: BridgeMessage) {
        this.targetWindow.postMessage(message, this.targetOrigin);
    }

    private startRequestTimeout(requestId: string, reject: (error: Error) => void) {
        return setTimeout(() => {
            if (!this.pendingRequests.has(requestId)) return;

            this.pendingRequests.delete(requestId);
            reject(new BridgeRequestError(REQUEST_TIMEOUT_MESSAGE, 408, 'TIMEOUT'));
        }, REQUEST_TIMEOUT_MS);
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2, 15);
    }

    private resolveAllowedOrigins(origin: string): string[] {
        if (origin && origin !== '*') {
            return [origin];
        }

        const origins = new Set<string>();

        // NEXT_PUBLIC_APP_URL is preferred in production
        if (process.env.NEXT_PUBLIC_APP_URL) {
            origins.add(process.env.NEXT_PUBLIC_APP_URL);
        }

        if (process.env.NODE_ENV !== 'production') {
            origins.add('http://localhost:3000');
            origins.add('http://127.0.0.1:3000');
        }

        if (typeof document !== 'undefined' && document.referrer) {
            try {
                origins.add(new URL(document.referrer).origin);
            } catch (error) {
                console.warn('[PluginClient] Failed to parse document.referrer', error);
            }
        }

        return Array.from(origins).filter(Boolean);
    }

    private resolveTargetOrigin(): string {
        if (this.allowedOrigins.length > 0) {
            return this.allowedOrigins[0];
        }

        if (process.env.NODE_ENV !== 'production') {
            console.warn('[PluginClient] No allowed origins resolved. Falling back to * for development only.');
            return '*';
        }

        throw new Error('[PluginClient] allowedOrigins is empty. Set NEXT_PUBLIC_APP_URL or pass an explicit origin.');
    }

    private isAllowedOrigin(origin: string): boolean {
        if (this.allowedOrigins.length === 0) return false;
        return this.allowedOrigins.includes(origin);
    }

}
