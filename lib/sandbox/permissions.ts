export function getRequiredPermission(endpoint: string, method: string): string | null {
    if (endpoint.startsWith('projects')) {
        return method === 'GET' ? 'projects.read' : 'projects.write';
    }
    if (endpoint.startsWith('revenues')) {
        return method === 'GET' ? 'revenues.read' : 'revenues.write';
    }
    return null;
}
