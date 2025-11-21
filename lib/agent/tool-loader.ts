import { createClient } from '@/lib/supabase/server';
import { ToolDefinition } from '../llm/types';
import { getToolsForApp as getCoreTools } from './tools';

type LoadToolsParams = {
    appId: string;
    userId?: string;
    includeSamples?: boolean;
};

export async function loadTools(params: LoadToolsParams): Promise<ToolDefinition[]> {
    const { appId, userId } = params;
    const tools: ToolDefinition[] = [];

    // 1. Load Core Tools
    const coreTools = getCoreTools(appId);
    tools.push(...coreTools);

    // 2. Load Plugin Tools (if userId is provided)
    if (userId) {
        try {
            const supabase = await createClient();

            // Find installation for this specific appId (assuming appId is the plugin_id)
            // OR find all plugins and see if they provide tools for this app (if apps are extensible)
            // For Phase 5, we assume the plugin IS the app.

            // 1. Check if installed and active
            const { data: installation } = await supabase
                .from('plugin_installations')
                .select('plugin_id')
                .eq('user_id', userId)
                .eq('plugin_id', appId)
                .eq('is_active', true)
                .single();

            if (installation) {
                // 2. Fetch tool definition from store_plugins
                const { data: plugin } = await supabase
                    .from('store_plugins')
                    .select('tools_definition')
                    .eq('plugin_id', installation.plugin_id)
                    .single();

                if (plugin && plugin.tools_definition) {
                    const pluginTools = plugin.tools_definition as ToolDefinition[];
                    // Ensure meta.appId matches
                    const validatedTools = pluginTools.map(t => ({
                        ...t,
                        meta: {
                            ...t.meta,
                            appId: appId // Enforce appId
                        }
                    }));
                    tools.push(...validatedTools);
                }
            }
        } catch (error) {
            console.error('Failed to load plugin tools:', error);
        }
    }

    return tools;
}
