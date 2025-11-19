import { BridgeMessage, MessageType, ApiRequestPayload, ApiResponsePayload } from './types';

type PluginHostOptions = {
    targetOrigin?: string;
    allowedOrigins?: string[];
    allowOpaqueOrigin?: boolean;
};

export class PluginHost {
    private readonly iframe: HTMLIFrameElement;
    private readonly pluginId: string;
    private readonly pendingRequests: Map<string, (response: unknown) => void>;
    private readonly boundHandleMessage: (event: MessageEvent) => void;
    private readonly allowedOrigins: string[];
    private readonly targetOrigin: string;
    private readonly allowOpaqueOrigin: boolean;

    constructor(iframe: HTMLIFrameElement, pluginId: string, options: PluginHostOptions = {}) {
        this.iframe = iframe;
        this.pluginId = pluginId;
        this.pendingRequests = new Map();

        this.allowedOrigins = this.deriveAllowedOrigins(options.allowedOrigins);
        this.targetOrigin = options.targetOrigin ?? this.allowedOrigins[0] ?? '*';
        this.allowOpaqueOrigin = options.allowOpaqueOrigin ?? this.shouldAllowOpaqueOrigin();
        this.boundHandleMessage = this.handleMessage.bind(this);

        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.boundHandleMessage);
        }
    }

    public destroy() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('message', this.boundHandleMessage);
        }
    }

    private async handleMessage(event: MessageEvent) {
        if (event.source !== this.iframe.contentWindow) return;
        if (!this.isAllowedOrigin(event.origin)) {
            console.warn('[PluginHost] Rejected message from unauthorized origin:', event.origin);
            return;
        }

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
        const targetOrigin = this.resolveTargetOrigin();
        this.iframe.contentWindow?.postMessage(message, targetOrigin);
    }

    private deriveAllowedOrigins(overrides?: string[]): string[] {
        if (overrides && overrides.length > 0) {
            return overrides;
        }

        const src = this.iframe.getAttribute('src');
        if (!src || typeof window === 'undefined') return [];

        try {
            const url = new URL(src, window.location.origin);
            if (url.origin && url.origin !== 'null') {
                return [url.origin];
            }
        } catch (error) {
            console.warn('[PluginHost] Failed to parse iframe src for origin allowlist', error);
        }

        return [];
    }

    private shouldAllowOpaqueOrigin(): boolean {
        const sandbox = this.iframe.getAttribute('sandbox') || '';
        if (!sandbox.trim()) return false;

        // When sandbox is present without allow-same-origin, the iframe becomes an opaque origin ("null")
        return sandbox
            .split(/\s+/)
            .filter(Boolean)
            .every((token) => token !== 'allow-same-origin');
    }

    private isAllowedOrigin(origin: string): boolean {
        if (origin === 'null') {
            return this.allowOpaqueOrigin;
        }

        if (this.allowedOrigins.length === 0) {
            return this.targetOrigin === '*';
        }

        return this.allowedOrigins.includes(origin);
    }

    private resolveTargetOrigin(): string {
        if (this.allowOpaqueOrigin) return '*';
        if (!this.targetOrigin || this.targetOrigin === 'null' || this.targetOrigin === '*') {
            return '*';
        }

        return this.targetOrigin;
    }
}
