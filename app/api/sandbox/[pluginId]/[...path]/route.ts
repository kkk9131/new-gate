import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { limitSandboxRequest, buildRateLimitHeaders } from '@/lib/rate-limit';
import { env, isProduction } from '@/lib/env';
import { getRequiredPermission } from '@/lib/sandbox/permissions';

const SANDBOX_ERROR = {
    BUSINESS: 'BUSINESS',
    DATABASE: 'DATABASE',
} as const;

type SandboxErrorType = (typeof SANDBOX_ERROR)[keyof typeof SANDBOX_ERROR];

type ErrorResponseOptions = {
    message: string;
    status: number;
    errorType: SandboxErrorType;
    requestId: string;
    headers?: Record<string, string>;
};

const jsonError = ({ message, status, errorType, requestId, headers }: ErrorResponseOptions) => {
    const response = NextResponse.json({ error: message, errorType, requestId }, { status });
    response.headers.set('x-request-id', requestId);

    if (headers) {
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
    }

    return response;
};

const isDatabaseError = (error: unknown): boolean => {
    if (typeof error !== 'object' || error === null) return false;
    return 'code' in error || 'details' in error;
};

const LOCAL_DEV_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const ALLOWED_PLUGIN_ORIGINS = new Set(
    [env.NEXT_PUBLIC_APP_URL, ...LOCAL_DEV_ORIGINS].filter((origin): origin is string => Boolean(origin))
);

type SandboxRouteParams = { pluginId: string; path: string[] };
type SandboxRouteContext = { params: Promise<SandboxRouteParams> };
type InstallationRecord = {
    id: string;
    is_active: boolean;
    plugin_permissions?: { permission: string; is_granted: boolean }[] | null;
};

const createLogger = (requestId: string, pluginId: string, userId?: string) => {
    const prefix = `[SandboxAPI][${requestId}][plugin:${pluginId}][user:${userId ?? 'anonymous'}]`;
    return {
        warn: (message: string, meta?: unknown) => {
            console.warn(prefix, message, meta ?? '');
        },
        error: (message: string, meta?: unknown) => {
            console.error(prefix, message, meta ?? '');
        },
        info: (message: string, meta?: unknown) => {
            if (isProduction) return;
            console.info(prefix, message, meta ?? '');
        },
    };
};

export async function GET(request: Request, context: SandboxRouteContext) {
    return handleSandboxRequest(request, context);
}

export async function POST(request: Request, context: SandboxRouteContext) {
    return handleSandboxRequest(request, context);
}

export async function PUT(request: Request, context: SandboxRouteContext) {
    return handleSandboxRequest(request, context);
}

export async function DELETE(request: Request, context: SandboxRouteContext) {
    return handleSandboxRequest(request, context);
}

async function handleSandboxRequest(request: Request, context: SandboxRouteContext) {
    const { pluginId, path } = await context.params;
    const requestId = randomUUID();
    const logger = createLogger(requestId, pluginId);
    const endpoint = path.join('/');
    const supabase = await createClient();

    const origin = request.headers.get('origin');
    if (!origin || !ALLOWED_PLUGIN_ORIGINS.has(origin)) {
        logger.warn('Blocked request due to invalid origin', origin ?? 'unknown');
        return jsonError({
            message: '許可されていないオリジンからのリクエストです',
            status: 403,
            errorType: SANDBOX_ERROR.BUSINESS,
            requestId,
        });
    }

    // 1. Auth check
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
        logger.error('Auth lookup failed', authError.message);
    }
    if (!user) {
        return jsonError({
            message: '認証されていません',
            status: 401,
            errorType: SANDBOX_ERROR.BUSINESS,
            requestId,
        });
    }
    const scopedLogger = createLogger(requestId, pluginId, user.id);

    // 2. Installation check
    const requiredPermission = getRequiredPermission(endpoint, request.method);
    const selectColumns = requiredPermission
        ? 'id, is_active, plugin_permissions:plugin_permissions(permission,is_granted)'
        : 'id, is_active';

    let installationQuery = supabase
        .from('plugin_installations')
        .select(selectColumns)
        .eq('user_id', user.id)
        .eq('plugin_id', pluginId)
        .maybeSingle<InstallationRecord>();

    if (requiredPermission) {
        installationQuery = installationQuery.eq('plugin_permissions.permission', requiredPermission);
    }

    const { data: installation, error: installationError } = await installationQuery;

    if (installationError) {
        scopedLogger.error('Installation lookup failed', installationError.message);
    }

    if (!installation || !installation.is_active) {
        return jsonError({
            message: 'プラグインがインストールされていないか無効です',
            status: 403,
            errorType: SANDBOX_ERROR.BUSINESS,
            requestId,
        });
    }

    // 3. Permission check (with dev fallback)
    if (requiredPermission) {
        const hasPermission = installation.plugin_permissions?.some(
            (permission) => permission.permission === requiredPermission && permission.is_granted
        );

        if (!hasPermission) {
            if (env.NODE_ENV === 'development') {
                scopedLogger.warn(
                    `Permission ${requiredPermission} not granted. Allowing temporarily in development mode.`
                );
            } else {
                return jsonError({
                    message: `必要な権限がありません: ${requiredPermission}`,
                    status: 403,
                    errorType: SANDBOX_ERROR.BUSINESS,
                    requestId,
                });
            }
        }
    }

    const rateIdentifier = `${user.id}:${pluginId}`;
    const rateResult = await limitSandboxRequest(rateIdentifier);
    const rateHeaders = buildRateLimitHeaders(rateResult);

    if (rateResult && !rateResult.success) {
        scopedLogger.warn('Rate limit exceeded', { rateIdentifier });
        return jsonError({
            message: 'リクエスト回数の上限に達しました',
            status: 429,
            errorType: SANDBOX_ERROR.BUSINESS,
            requestId,
            headers: rateHeaders,
        });
    }

    return proxyInternalEndpoint({
        supabase,
        endpoint,
        method: request.method,
        userId: user.id,
        requestId,
        headers: rateHeaders,
        logger: scopedLogger,
    });
}

type EndpointHandlerArgs = {
    supabase: Awaited<ReturnType<typeof createClient>>;
    userId: string;
    segments: string[];
};

type EndpointHandler = (args: EndpointHandlerArgs) => Promise<unknown>;

const endpointHandlers: Record<string, Partial<Record<string, EndpointHandler>>> = {
    projects: {
        GET: async ({ supabase, userId }) => {
            const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId);
            if (error) throw error;
            return data;
        },
    },
    revenues: {
        GET: async ({ supabase, userId }) => {
            const { data, error } = await supabase.from('revenues').select('*').eq('user_id', userId);
            if (error) throw error;
            return data;
        },
    },
};

type ProxyOptions = {
    supabase: Awaited<ReturnType<typeof createClient>>;
    endpoint: string;
    method: string;
    userId: string;
    requestId: string;
    headers?: Record<string, string>;
    logger: ReturnType<typeof createLogger>;
};

async function proxyInternalEndpoint({ supabase, endpoint, method, userId, requestId, headers, logger }: ProxyOptions) {
    const [resource, ...segments] = endpoint.split('/');
    const handler = endpointHandlers[resource]?.[method];

    if (!handler) {
        return jsonError({
            message: '指定されたエンドポイントはサンドボックスでサポートされていません',
            status: 404,
            errorType: SANDBOX_ERROR.BUSINESS,
            requestId,
            headers,
        });
    }

    try {
        const payload = await handler({ supabase, userId, segments });
        return attachHeaders(NextResponse.json(payload), requestId, headers);
    } catch (error) {
        const safeMessage = error instanceof Error ? error.message : '不明なエラー';
        logger.error('Internal proxy error', safeMessage);
        const errorType = isDatabaseError(error) ? SANDBOX_ERROR.DATABASE : SANDBOX_ERROR.BUSINESS;
        return jsonError({
            message: '内部処理でエラーが発生しました',
            status: 500,
            errorType,
            requestId,
            headers,
        });
    }
}

function attachHeaders(response: NextResponse, requestId: string, headers?: Record<string, string>) {
    response.headers.set('x-request-id', requestId);
    if (headers) {
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
    }
    return response;
}
