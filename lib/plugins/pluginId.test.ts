import { describe, expect, it } from 'vitest';
import { isValidPluginId, normalizePluginId, MAX_PLUGIN_ID_LENGTH } from './pluginId';

describe('pluginId validation', () => {
    it('accepts valid identifiers', () => {
        expect(isValidPluginId('com.example.plugin')).toBe(true);
        expect(isValidPluginId('abc')).toBe(true);
    });

    it('rejects identifiers exceeding max length', () => {
        const longId = 'a'.repeat(MAX_PLUGIN_ID_LENGTH + 1);
        expect(isValidPluginId(longId)).toBe(false);
    });

    it('rejects reserved identifiers', () => {
        expect(isValidPluginId('system')).toBe(false);
        expect(isValidPluginId('sandbox')).toBe(false);
    });

    it('normalizes to lowercase and trims whitespace', () => {
        expect(normalizePluginId('  Com.Example ')).toBe('com.example');
    });
});
