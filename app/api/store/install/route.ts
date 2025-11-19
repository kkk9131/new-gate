import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { plugin_id, version } = body;

        if (!plugin_id || !version) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if plugin exists
        const { data: plugin, error: pluginError } = await supabase
            .from('store_plugins')
            .select('id')
            .eq('plugin_id', plugin_id)
            .single();

        if (pluginError || !plugin) {
            return NextResponse.json({ error: 'Plugin not found' }, { status: 404 });
        }

        // Check if already installed
        const { data: existing } = await supabase
            .from('plugin_installations')
            .select('id')
            .eq('user_id', user.id)
            .eq('plugin_id', plugin_id)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Plugin already installed' }, { status: 409 });
        }

        // Install plugin
        const { data, error } = await supabase
            .from('plugin_installations')
            .insert({
                user_id: user.id,
                plugin_id: plugin_id,
                installed_version: version,
                is_active: true,
                settings: {},
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Increment install count
        await supabase.rpc('increment_plugin_install_count', { p_plugin_id: plugin_id });

        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
