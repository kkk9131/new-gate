const PLUGIN_ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export const MAX_PLUGIN_ID_LENGTH = 64;
export const RESERVED_PLUGIN_IDS = new Set(['system', 'admin', 'host', 'sandbox', 'newgate', 'core']);

export function normalizePluginId(value: string): string {
    return value.trim().toLowerCase();
}

export function isValidPluginId(pluginId: string): boolean {
    if (!pluginId || pluginId.length > MAX_PLUGIN_ID_LENGTH) {
        return false;
    }

    if (RESERVED_PLUGIN_IDS.has(pluginId)) {
        return false;
    }

    return PLUGIN_ID_PATTERN.test(pluginId);
}
