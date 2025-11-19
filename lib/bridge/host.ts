import { BridgeMessage, MessageType, ApiRequestPayload, ApiResponsePayload } from './types';

export class PluginHost {
    private iframe: HTMLIFrameElement;
    private pluginId: string;
    private origin: string;
    private pendingRequests: Map<string, (response: unknown) => void>;

    constructor(iframe: HTMLIFrameElement, pluginId: string, origin: string = '*') {
        this.iframe = iframe;
        this.pluginId = pluginId;
        this.origin = origin;
        this.pendingRequests = new Map();

        window.addEventListener('message', this.handleMessage.bind(this));
    }

    public destroy() {
        window.removeEventListener('message', this.handleMessage.bind(this));
    }

    private async handleMessage(event: MessageEvent) {
        // Security check: verify origin
        // For development, we might allow '*', but in production this should be strict
        if (this.origin !== '*' && event.origin !== this.origin) return;

        const message = event.data as BridgeMessage;
        if (!message || message.source !== 'plugin') return;

        switch (message.type) {
            case MessageType.HANDSHAKE:
                this.send({
                    id: message.id,
                    type: MessageType.HANDSHAKE_ACK,
                    payload: { version: '1.0.0' },
                    source: 'host',
                });
                break;

            case MessageType.API_REQUEST:
                await this.handleApiRequest(message.id, message.payload as ApiRequestPayload);
                break;

            case MessageType.RESIZE:
                // Handle resize if needed (e.g., update iframe style)
                break;
        }
    }

    private async handleApiRequest(requestId: string, payload: ApiRequestPayload) {
        try {
            // Proxy request to our backend sandbox API
            // The backend will handle permission checks
            const response = await fetch(`/api/sandbox/${this.pluginId}/${payload.endpoint}`, {
                method: payload.method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: payload.body ? JSON.stringify(payload.body) : undefined,
            });

            const data = await response.json();

            this.send({
                id: requestId, // Use the same ID to correlate response
                type: MessageType.API_RESPONSE,
                payload: {
                    requestId,
                    status: response.status,
                    data: response.ok ? data : undefined,
                    error: response.ok ? undefined : data.error || 'Unknown error',
                } as ApiResponsePayload,
                source: 'host',
            });
        } catch (error) {
            this.send({
                id: requestId,
                type: MessageType.API_RESPONSE,
                payload: {
                    requestId,
                    status: 500,
                    error: error instanceof Error ? error.message : 'Internal Host Error',
                } as ApiResponsePayload,
                source: 'host',
            });
        }
    }

    private send(message: BridgeMessage) {
        if (this.iframe.contentWindow) {
            this.iframe.contentWindow.postMessage(message, this.origin);
        }
    }
}
