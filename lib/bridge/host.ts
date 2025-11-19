import { BridgeMessage, MessageType, ApiRequestPayload, ApiResponsePayload, isBridgeMessage } from './types';

const HOST_UNKNOWN_ERROR = 'ホスト内部でエラーが発生しました';
const HOST_ABORTED_MESSAGE = 'ホストリクエストが中断されました';

type PendingHostRequest = {
    controller: AbortController;
};

type PluginHostOptions = {
    targetOrigin?: string;
    allowedOrigins?: string[];
    allowOpaqueOrigin?: boolean;
};

export class PluginHost {
    private readonly iframe: HTMLIFrameElement;
    private readonly pluginId: string;
    private readonly pendingRequests: Map<string, PendingHostRequest>;
    private readonly boundHandleMessage: (event: MessageEvent) => void;
    private readonly allowedOrigins: string[];
    private readonly targetOrigin: string;
    private readonly allowOpaqueOrigin: boolean;

    constructor(iframe: HTMLIFrameElement, pluginId: string, options: PluginHostOptions = {}) {
        this.iframe = iframe;
        this.pluginId = pluginId;
        this.pendingRequests = new Map();

        this.allowedOrigins = this.deriveAllowedOrigins(options.allowedOrigins);
        this.allowOpaqueOrigin = options.allowOpaqueOrigin ?? this.shouldAllowOpaqueOrigin();
        this.targetOrigin = this.resolveTargetOrigin(options.targetOrigin);
        this.boundHandleMessage = this.handleMessage.bind(this);

        if (typeof window !== 'undefined') {
            window.addEventListener('message', this.boundHandleMessage);
        }
    }

    public destroy() {
        if (typeof window !== 'undefined') {
            window.removeEventListener('message', this.boundHandleMessage);
        }

        this.pendingRequests.forEach(({ controller }) => controller.abort());
        this.pendingRequests.clear();
    }

    private async handleMessage(event: MessageEvent) {
        if (event.source !== this.iframe.contentWindow) return;
        if (!this.isAllowedOrigin(event.origin)) {
            console.warn('[PluginHost] Rejected message from unauthorized origin:', event.origin);
            return;
        }

        const message = isBridgeMessage(event.data) ? event.data : null;
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
                await this.handleApiRequest(message.id, message.payload);
                break;

            case MessageType.RESIZE:
                // Handle resize if needed (e.g., update iframe style)
                break;
        }
    }

    private async handleApiRequest(requestId: string, payload: ApiRequestPayload) {
        const controller = new AbortController();
        this.abortDuplicateRequest(requestId);
        this.pendingRequests.set(requestId, { controller });

        try {
            // Proxy request to our backend sandbox API
            // The backend will handle permission checks
            const response = await fetch(`/api/sandbox/${this.pluginId}/${payload.endpoint}`, {
                method: payload.method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: payload.body ? JSON.stringify(payload.body) : undefined,
                signal: controller.signal,
            });

            const data = await response.json();

            this.send({
                id: requestId, // Use the same ID to correlate response
                type: MessageType.API_RESPONSE,
                payload: {
                    requestId,
                    status: response.status,
                    data: response.ok ? data : undefined,
                    error: response.ok ? undefined : data.error || HOST_UNKNOWN_ERROR,
                    errorType: data.errorType,
                } as ApiResponsePayload,
                source: 'host',
            });
        } catch (error) {
            const aborted = this.isAbortError(error);
            this.send({
                id: requestId,
                type: MessageType.API_RESPONSE,
                payload: {
                    requestId,
                    status: aborted ? 499 : 500,
                    error: aborted
                        ? HOST_ABORTED_MESSAGE
                        : error instanceof Error
                          ? error.message
                          : HOST_UNKNOWN_ERROR,
                    errorType: 'NETWORK',
                } as ApiResponsePayload,
                source: 'host',
            });
        } finally {
            this.pendingRequests.delete(requestId);
            controller.abort();
        }
    }

    private send(message: BridgeMessage) {
        this.iframe.contentWindow?.postMessage(message, this.targetOrigin);
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
            return false;
        }

        const allowedSet = new Set(this.allowedOrigins);
        if (this.targetOrigin && this.targetOrigin !== '*' && this.targetOrigin !== 'null') {
            allowedSet.add(this.targetOrigin);
        }

        return allowedSet.has(origin);
    }

    private resolveTargetOrigin(explicitOrigin?: string): string {
        const sanitized = explicitOrigin?.trim();

        if (sanitized && sanitized !== '*' && sanitized !== 'null') {
            return sanitized;
        }

        if (this.allowOpaqueOrigin) {
            return 'null';
        }

        if (this.allowedOrigins.length > 0) {
            return this.allowedOrigins[0];
        }

        if (process.env.NODE_ENV !== 'production') {
            console.warn('[PluginHost] No target origin detected. Falling back to * for development only.');
            return '*';
        }

        throw new Error('[PluginHost] targetOrigin を特定できません。options.targetOrigin を指定してください。');
    }

    private abortDuplicateRequest(requestId: string) {
        const existing = this.pendingRequests.get(requestId);
        if (!existing) return;

        existing.controller.abort();
        this.pendingRequests.delete(requestId);
    }

    private isAbortError(error: unknown): boolean {
        if (!error) return false;

        if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
            return error.name === 'AbortError';
        }

        return error instanceof Error && error.name === 'AbortError';
    }
}
