import { describe, expect, it, vi, afterEach } from 'vitest';
import { PluginClient, BridgeRequestError } from './client';
import { MessageType } from './types';

type MockPostMessage = ReturnType<typeof vi.fn>;
type FakeWindow = Window & { postMessage: MockPostMessage };

const createMockWindow = (): FakeWindow => ({
    postMessage: vi.fn(),
}) as unknown as FakeWindow;

const createMessageEvent = (source: FakeWindow, origin: string, message: unknown) =>
    ({
        source,
        origin,
        data: message,
    }) as MessageEvent;

const originalEnv = process.env.NODE_ENV;
const originalAppUrl = process.env.NEXT_PUBLIC_APP_URL;

afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.NEXT_PUBLIC_APP_URL = originalAppUrl;
    vi.useRealTimers();
});

describe('PluginClient security', () => {
    it('throws in production when allowed origins cannot be resolved', () => {
        const mockWindow = createMockWindow();
        process.env.NODE_ENV = 'production';
        delete process.env.NEXT_PUBLIC_APP_URL;

        expect(() => new PluginClient(mockWindow, '*')).toThrow(/allowedOrigins/i);
    });

    it('propagates errorType values from host responses', async () => {
        const mockWindow = createMockWindow();
        const client = new PluginClient(mockWindow, 'https://trusted.app');
        mockWindow.postMessage.mockClear();

        const requestPromise = client.request('projects');
        const errorCapture = requestPromise.catch((error) => error as BridgeRequestError);
        const postMessageCalls = mockWindow.postMessage.mock.calls;
        const apiRequestCall = postMessageCalls.find(([message]) => message.type === MessageType.API_REQUEST);
        expect(apiRequestCall).toBeDefined();
        const requestId = apiRequestCall![0].id;

        const event = createMessageEvent(mockWindow, 'https://trusted.app', {
            id: requestId,
            type: MessageType.API_RESPONSE,
            payload: { requestId, status: 500, error: 'DB error', errorType: 'DATABASE' },
            source: 'host',
        });

        (client as any).handleMessage(event);

        const error = await errorCapture;
        expect(error).toBeInstanceOf(BridgeRequestError);
        expect(error).toMatchObject({ status: 500, errorType: 'DATABASE' });
    });

    it('rejects with timeout error after 30 seconds when host is silent', async () => {
        vi.useFakeTimers();
        const mockWindow = createMockWindow();
        const client = new PluginClient(mockWindow, 'https://trusted.app');
        mockWindow.postMessage.mockClear();

        const requestPromise = client.request('projects');
        const errorCapture = requestPromise.catch((error) => error as BridgeRequestError);

        await vi.advanceTimersByTimeAsync(30_000);

        const error = await errorCapture;
        expect(error).toMatchObject({
            name: 'BridgeRequestError',
            status: 408,
            errorType: 'TIMEOUT',
        });
    });
});
