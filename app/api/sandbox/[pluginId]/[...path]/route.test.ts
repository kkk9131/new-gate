import { describe, it, expect } from 'vitest';
import { getRequiredPermission } from '../../../../../lib/sandbox/permissions';

describe('getRequiredPermission', () => {
    it('returns read permission for GET projects', () => {
        expect(getRequiredPermission('projects', 'GET')).toBe('projects.read');
    });

    it('returns write permission for POST projects', () => {
        expect(getRequiredPermission('projects', 'POST')).toBe('projects.write');
    });

    it('returns null for unsupported endpoints', () => {
        expect(getRequiredPermission('unknown', 'GET')).toBeNull();
    });
});
