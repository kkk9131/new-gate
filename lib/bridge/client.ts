import { BridgeMessage, MessageType, ApiRequestPayload, ApiResponsePayload } from './types';

type PendingRequest = { resolve: (data: unknown) => void; reject: (error: Error) => void };

export class PluginClient {
    private readonly targetWindow: Window;
    private readonly allowedOrigins: string[];
    private readonly targetOrigin: string;
    private readonly pendingRequests: Map<string, PendingRequest>;
    private readonly boundHandleMessage: (event: MessageEvent) => void;

    constructor(targetWindow: Window = window.parent, origin: string = '*') {
        this.targetWindow = targetWindow;
        this.allowedOrigins = this.resolveAllowedOrigins(origin);
        this.targetOrigin = this.allowedOrigins[0] ?? '*';
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
            this.pendingRequests.set(requestId, { resolve, reject });

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

        const message = event.data as BridgeMessage;
        if (!message || message.source !== 'host') return;

        switch (message.type) {
            case MessageType.HANDSHAKE_ACK:
                console.log('Plugin connected to host:', message.payload);
                break;

            case MessageType.API_RESPONSE:
                this.handleApiResponse(message.payload as ApiResponsePayload);
                break;
        }
    }

    private handleApiResponse(payload: ApiResponsePayload) {
        const { requestId, status, data, error } = payload;
        const pending = this.pendingRequests.get(requestId);

        if (pending) {
            if (status >= 200 && status < 300) {
                pending.resolve(data);
            } else {
                pending.reject(new Error(error || `Request failed with status ${status}`));
            }
            this.pendingRequests.delete(requestId);
        }
    }

    private send(message: BridgeMessage) {
        const origin = this.targetOrigin || '*';
        this.targetWindow.postMessage(message, origin);
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

        // If we still do not have any origin, fall back to wildcard
        return Array.from(origins).filter(Boolean);
    }

    private isAllowedOrigin(origin: string): boolean {
        if (this.allowedOrigins.length === 0) return true;
        return this.allowedOrigins.includes(origin);
    }
}
