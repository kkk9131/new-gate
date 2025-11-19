import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ pluginId: string; path: string[] }> }
) {
    const { pluginId, path } = await params;
    const endpoint = path.join('/');

    const supabase = await createClient();

    // 1. Authentication Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Installation Check
    const { data: installation } = await supabase
        .from('plugin_installations')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('plugin_id', pluginId)
        .single();

    if (!installation || !installation.is_active) {
        return NextResponse.json({ error: 'Plugin not installed or inactive' }, { status: 403 });
    }

    // 3. Permission Check (Simplified for MVP)
    // In a real scenario, we would check `plugin_permissions` table against the requested endpoint.
    // For now, we'll map endpoints to required permissions manually.

    const requiredPermission = getRequiredPermission(endpoint, request.method);

    if (requiredPermission) {
        const { data: permission } = await supabase
            .from('plugin_permissions')
            .select('is_granted')
            .eq('user_id', user.id)
            .eq('plugin_id', pluginId)
            .eq('permission', requiredPermission)
            .single();

        // Note: For MVP, if permission record doesn't exist, we default to DENY.
        // In Phase 2.1, we didn't implement the UI to grant permissions yet, 
        // so this will likely fail unless we manually insert permissions.
        // To unblock development, we might allow if no permission is strictly required, 
        // or if we are in a "trusted" mode.

        // For this implementation, let's assume if the permission is NOT explicitly granted, it fails.
        if (!permission || !permission.is_granted) {
            // FALLBACK for Development: Check if it's a "read" operation and allow it for now?
            // No, let's be strict but helpful error message.
            return NextResponse.json({ error: `Permission denied: ${requiredPermission}` }, { status: 403 });
        }
    }

    // 4. Proxy Logic
    // Here we would forward the request to the actual internal API or handle it.
    // For MVP, let's handle 'projects' and 'revenues' directly by querying DB.

    try {
        if (endpoint === 'projects' && request.method === 'GET') {
            const { data, error } = await supabase.from('projects').select('*').eq('user_id', user.id);
            if (error) throw error;
            return NextResponse.json(data);
        }

        if (endpoint === 'revenues' && request.method === 'GET') {
            const { data, error } = await supabase.from('revenues').select('*').eq('user_id', user.id);
            if (error) throw error;
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: 'Endpoint not found or not supported in sandbox' }, { status: 404 });

    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}

// Helper to map endpoint+method to permission
function getRequiredPermission(endpoint: string, method: string): string | null {
    if (endpoint.startsWith('projects')) {
        return method === 'GET' ? 'projects.read' : 'projects.write';
    }
    if (endpoint.startsWith('revenues')) {
        return method === 'GET' ? 'revenues.read' : 'revenues.write';
    }
    return null;
}

// Support GET as well if needed (though bridge uses POST usually for proxying)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ pluginId: string; path: string[] }> }
) {
    // Reuse POST logic or implement specific GET handling
    // For the bridge, we might send everything as POST with a 'method' body param, 
    // but our BridgeHost implementation sends the actual method.
    // So we need to handle GET requests here too.

    // However, Next.js App Router handles methods separately.
    // Let's just call the POST handler logic (refactored) or copy-paste for now for simplicity,
    // but since our BridgeHost uses `fetch` with the actual method, we need to support GET.

    // Refactoring common logic:
    return handleRequest(request, params);
}

async function handleRequest(request: Request, params: Promise<{ pluginId: string; path: string[] }>) {
    // ... (Same logic as above)
    // Since we can't easily share code between exports without extracting to a function,
    // I'll implement the core logic here.

    const { pluginId, path } = await params;
    const endpoint = path.join('/');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: installation } = await supabase
        .from('plugin_installations')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('plugin_id', pluginId)
        .single();

    if (!installation || !installation.is_active) {
        return NextResponse.json({ error: 'Plugin not installed or inactive' }, { status: 403 });
    }

    const requiredPermission = getRequiredPermission(endpoint, request.method);

    if (requiredPermission) {
        const { data: permission } = await supabase
            .from('plugin_permissions')
            .select('is_granted')
            .eq('user_id', user.id)
            .eq('plugin_id', pluginId)
            .eq('permission', requiredPermission)
            .single();

        if (!permission || !permission.is_granted) {
            return NextResponse.json({ error: `Permission denied: ${requiredPermission}` }, { status: 403 });
        }
    }

    try {
        if (endpoint === 'projects' && request.method === 'GET') {
            const { data, error } = await supabase.from('projects').select('*').eq('user_id', user.id);
            if (error) throw error;
            return NextResponse.json(data);
        }

        if (endpoint === 'revenues' && request.method === 'GET') {
            const { data, error } = await supabase.from('revenues').select('*').eq('user_id', user.id);
            if (error) throw error;
            return NextResponse.json(data);
        }

        return NextResponse.json({ error: 'Endpoint not found or not supported in sandbox' }, { status: 404 });

    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
    }
}
