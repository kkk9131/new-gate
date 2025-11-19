import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const SANDBOX_ERROR = {
    BUSINESS: 'BUSINESS',
    DATABASE: 'DATABASE',
} as const;

type SandboxErrorType = (typeof SANDBOX_ERROR)[keyof typeof SANDBOX_ERROR];

const jsonError = (message: string, status: number, errorType: SandboxErrorType) =>
    NextResponse.json({ error: message, errorType }, { status });

const isDatabaseError = (error: unknown): boolean => {
    if (typeof error !== 'object' || error === null) return false;
    return 'code' in error || 'details' in error;
};

type SandboxRouteParams = { pluginId: string; path: string[] };
type SandboxRouteContext = { params: Promise<SandboxRouteParams> };

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
    const endpoint = path.join('/');
    const supabase = await createClient();

    // 1. Auth check
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();
    if (authError) {
        console.error('[SandboxAPI] Auth lookup failed:', authError.message);
    }
    if (!user) {
        return jsonError('Unauthorized', 401, SANDBOX_ERROR.BUSINESS);
    }

    // 2. Installation check
    const { data: installation, error: installationError } = await supabase
        .from('plugin_installations')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('plugin_id', pluginId)
        .single();

    if (installationError) {
        console.error('[SandboxAPI] Installation lookup failed:', installationError.message);
    }

    if (!installation || !installation.is_active) {
        return jsonError('Plugin not installed or inactive', 403, SANDBOX_ERROR.BUSINESS);
    }

    // 3. Permission check (with dev fallback)
    const requiredPermission = getRequiredPermission(endpoint, request.method);
    if (requiredPermission) {
        const { data: permission, error: permissionError } = await supabase
            .from('plugin_permissions')
            .select('is_granted')
            .eq('user_id', user.id)
            .eq('plugin_id', pluginId)
            .eq('permission', requiredPermission)
            .single();

        if (permissionError && permissionError.code !== 'PGRST116') {
            console.error('[SandboxAPI] Permission lookup error:', permissionError.message);
            return jsonError('Permission lookup failed', 500, SANDBOX_ERROR.DATABASE);
        }

        if (!permission || !permission.is_granted) {
            if (process.env.NODE_ENV === 'development') {
                console.warn(
                    `[SandboxAPI][DEV] Permission ${requiredPermission} not granted for plugin ${pluginId}. Allowing temporarily.`
                );
            } else {
                return jsonError(`Permission denied: ${requiredPermission}`, 403, SANDBOX_ERROR.BUSINESS);
            }
        }
    }

    return proxyInternalEndpoint({ supabase, endpoint, method: request.method, userId: user.id });
}

function getRequiredPermission(endpoint: string, method: string): string | null {
    if (endpoint.startsWith('projects')) {
        return method === 'GET' ? 'projects.read' : 'projects.write';
    }
    if (endpoint.startsWith('revenues')) {
        return method === 'GET' ? 'revenues.read' : 'revenues.write';
    }
    return null;
}

async function proxyInternalEndpoint({
    supabase,
    endpoint,
    method,
    userId,
}: {
    supabase: Awaited<ReturnType<typeof createClient>>;
    endpoint: string;
    method: string;
    userId: string;
}) {
    try {
        if (endpoint === 'projects' && method === 'GET') {
            const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId);
            if (error) throw error;
            return NextResponse.json(data);
        }

        if (endpoint === 'revenues' && method === 'GET') {
            const { data, error } = await supabase.from('revenues').select('*').eq('user_id', userId);
            if (error) throw error;
            return NextResponse.json(data);
        }

        return jsonError('Endpoint not found or not supported in sandbox', 404, SANDBOX_ERROR.BUSINESS);
    } catch (error) {
        console.error('[SandboxAPI] Internal proxy error:', error);
        const message = error instanceof Error ? error.message : 'Internal Server Error';
        const errorType = isDatabaseError(error) ? SANDBOX_ERROR.DATABASE : SANDBOX_ERROR.BUSINESS;
        return jsonError(message, 500, errorType);
    }
}
