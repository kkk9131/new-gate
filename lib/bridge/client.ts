import { BridgeMessage, MessageType, ApiRequestPayload, ApiResponsePayload } from './types';

export class PluginClient {
    private targetWindow: Window;
    private origin: string;
    private pendingRequests: Map<string, { resolve: (data: unknown) => void; reject: (error: Error) => void }>;

    constructor(targetWindow: Window = window.parent, origin: string = '*') {
        this.targetWindow = targetWindow;
        this.origin = origin;
        this.pendingRequests = new Map();

        window.addEventListener('message', this.handleMessage.bind(this));

        // Initiate handshake
        this.send({
            id: this.generateId(),
            type: MessageType.HANDSHAKE,
            payload: {},
            source: 'plugin',
        });
    }

    public destroy() {
        window.removeEventListener('message', this.handleMessage.bind(this));
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
        // In production, verify origin
        // if (this.origin !== '*' && event.origin !== this.origin) return;

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
        this.targetWindow.postMessage(message, this.origin);
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2, 15);
    }
}
