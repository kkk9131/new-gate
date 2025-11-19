export enum MessageType {
    HANDSHAKE = 'HANDSHAKE',
    HANDSHAKE_ACK = 'HANDSHAKE_ACK',
    API_REQUEST = 'API_REQUEST',
    API_RESPONSE = 'API_RESPONSE',
    RESIZE = 'RESIZE',
    NOTIFICATION = 'NOTIFICATION',
}

export interface BridgeMessage<T = unknown> {
    id: string;
    type: MessageType;
    payload: T;
    source: 'plugin' | 'host';
}

export interface ApiRequestPayload {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
}

export type BridgeErrorType = 'BUSINESS' | 'DATABASE' | 'NETWORK' | 'TIMEOUT';

export interface ApiResponsePayload {
    requestId: string;
    status: number;
    data?: unknown;
    error?: string;
    errorType?: BridgeErrorType;
}

export interface ResizePayload {
    width?: number;
    height?: number;
}

export interface NotificationPayload {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

const messageTypes = new Set(Object.values(MessageType));

export function isBridgeMessage(value: unknown): value is BridgeMessage {
    if (typeof value !== 'object' || value === null) return false;

    const candidate = value as Partial<BridgeMessage>;
    if (typeof candidate.id !== 'string') return false;
    if (typeof candidate.source !== 'string') return false;
    if (candidate.source !== 'plugin' && candidate.source !== 'host') return false;
    if (typeof candidate.type !== 'string') return false;
    if (!messageTypes.has(candidate.type as MessageType)) return false;

    return true;
}
