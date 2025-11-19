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

export interface ApiResponsePayload {
    requestId: string;
    status: number;
    data?: unknown;
    error?: string;
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
