import { describe, expect, it, vi, afterEach } from 'vitest';
import { PluginHost } from './host';
import { type ApiRequestPayload } from './types';

type FakeContentWindow = Pick<Window, 'postMessage'>;

type FakeIframe = HTMLIFrameElement & {
    contentWindow: FakeContentWindow;
    getAttribute: (name: string) => string | null;
};

const createIframe = (overrides?: { sandbox?: string; src?: string }) => {
    const contentWindow = {
        postMessage: vi.fn(),
    } as unknown as FakeContentWindow;

    const iframe = {
        contentWindow,
        getAttribute: (attr: string) => {
            if (attr === 'src') return overrides?.src ?? 'https://plugin.test/frame';
            if (attr === 'sandbox') return overrides?.sandbox ?? 'allow-scripts allow-forms';
            return null;
        },
    } as unknown as FakeIframe;

    return iframe;
};

const originalEnv = process.env.NODE_ENV;

afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.unstubAllGlobals();
});

describe('PluginHost security', () => {
    it('forces explicit origin configuration in production', () => {
        process.env.NODE_ENV = 'production';
        const iframe = createIframe({ src: '' });

        expect(
            () =>
                new PluginHost(iframe, 'demo', {
                    allowedOrigins: [],
                    allowOpaqueOrigin: false,
                })
        ).toThrow(/targetOrigin/);
    });

    it('aborts in-flight API requests when destroyed', async () => {
        const iframe = createIframe();
        const host = new PluginHost(iframe, 'demo', {
            allowedOrigins: ['https://plugin.test'],
            targetOrigin: 'https://plugin.test',
            allowOpaqueOrigin: false,
        });

        const fetchMock = vi.fn((_, init?: RequestInit) => {
            return new Promise((_, reject) => {
                const signal = init?.signal as AbortSignal | undefined;
                if (!signal) return;
                const abortHandler = () => {
                    const abortError = new Error('Aborted');
                    abortError.name = 'AbortError';
                    reject(abortError);
                };
                signal.addEventListener('abort', abortHandler, { once: true });
            });
        });
        vi.stubGlobal('fetch', fetchMock);

        const payload: ApiRequestPayload = { endpoint: 'projects', method: 'GET' };
        const pending = (host as any).handleApiRequest('req-1', payload);

        host.destroy();
        await pending;

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(iframe.contentWindow.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                payload: expect.objectContaining({ status: 499, errorType: 'NETWORK' }),
            }),
            'https://plugin.test'
        );
    });
});
