export enum MessageType {
    HANDSHAKE = 'HANDSHAKE',
    HANDSHAKE_ACK = 'HANDSHAKE_ACK',
    API_REQUEST = 'API_REQUEST',
    API_RESPONSE = 'API_RESPONSE',
    RESIZE = 'RESIZE',
    NOTIFICATION = 'NOTIFICATION',
}

type MessageSource = 'plugin' | 'host';

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

type BaseMessage<TType extends MessageType, TPayload> = {
    id: string;
    type: TType;
    payload: TPayload;
    source: MessageSource;
};

export type PluginMessages =
    | BaseMessage<MessageType.HANDSHAKE, Record<string, never>>
    | BaseMessage<MessageType.API_REQUEST, ApiRequestPayload>
    | BaseMessage<MessageType.RESIZE, ResizePayload>;

export type HostMessages =
    | BaseMessage<MessageType.HANDSHAKE_ACK, Record<string, never>>
    | BaseMessage<MessageType.API_RESPONSE, ApiResponsePayload>
    | BaseMessage<MessageType.RESIZE, ResizePayload>
    | BaseMessage<MessageType.NOTIFICATION, NotificationPayload>;

export type BridgeMessage = PluginMessages | HostMessages;

const methodSet = new Set<ApiRequestPayload['method']>(['GET', 'POST', 'PUT', 'DELETE']);

const validators: Record<MessageType, (payload: unknown) => boolean> = {
    [MessageType.HANDSHAKE]: isRecord,
    [MessageType.HANDSHAKE_ACK]: isRecord,
    [MessageType.API_REQUEST]: isApiRequestPayload,
    [MessageType.API_RESPONSE]: isApiResponsePayload,
    [MessageType.RESIZE]: isResizePayload,
    [MessageType.NOTIFICATION]: isNotificationPayload,
};

export function isBridgeMessage(value: unknown): value is BridgeMessage {
    if (typeof value !== 'object' || value === null) return false;

    const candidate = value as Partial<BridgeMessage> & { source?: unknown };
    if (typeof candidate.id !== 'string') return false;
    if (candidate.source !== 'plugin' && candidate.source !== 'host') return false;
    if (typeof candidate.type !== 'string') return false;

    const type = candidate.type as MessageType;
    const validator = validators[type];
    if (!validator) return false;

    return validator(candidate.payload);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isApiRequestPayload(payload: unknown): payload is ApiRequestPayload {
    if (!isRecord(payload)) return false;
    return typeof payload.endpoint === 'string' && methodSet.has(payload.method as ApiRequestPayload['method']);
}

function isApiResponsePayload(payload: unknown): payload is ApiResponsePayload {
    if (!isRecord(payload)) return false;
    return typeof payload.requestId === 'string' && typeof payload.status === 'number';
}

function isResizePayload(payload: unknown): payload is ResizePayload {
    if (!isRecord(payload)) return false;
    const { width, height } = payload as Record<string, unknown>;
    return (
        (typeof width === 'number' || typeof width === 'undefined') &&
        (typeof height === 'number' || typeof height === 'undefined')
    );
}

function isNotificationPayload(payload: unknown): payload is NotificationPayload {
    if (!isRecord(payload)) return false;
    return typeof payload.title === 'string' && typeof payload.message === 'string' && typeof payload.type === 'string';
}
