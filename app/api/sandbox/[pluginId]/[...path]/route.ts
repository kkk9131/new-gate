import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

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
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        return NextResponse.json({ error: 'Plugin not installed or inactive' }, { status: 403 });
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
            return NextResponse.json({ error: 'Permission lookup failed' }, { status: 500 });
        }

        if (!permission || !permission.is_granted) {
            if (process.env.NODE_ENV === 'development') {
                console.warn(
                    `[SandboxAPI][DEV] Permission ${requiredPermission} not granted for plugin ${pluginId}. Allowing temporarily.`
                );
            } else {
                return NextResponse.json({ error: `Permission denied: ${requiredPermission}` }, { status: 403 });
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

        return NextResponse.json({ error: 'Endpoint not found or not supported in sandbox' }, { status: 404 });
    } catch (error) {
        console.error('[SandboxAPI] Internal proxy error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
