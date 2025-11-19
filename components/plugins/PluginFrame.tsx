'use client';

import { useEffect, useRef } from 'react';
import { PluginHost } from '@/lib/bridge/host';

interface PluginFrameProps {
    pluginId: string;
    src: string;
    className?: string;
    onReady?: () => void;
}

export function PluginFrame({ pluginId, src, className, onReady }: PluginFrameProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const hostRef = useRef<PluginHost | null>(null);

    useEffect(() => {
        if (iframeRef.current) {
            const hostOptions = resolveHostOptions(src);
            // Initialize host bridge
            hostRef.current = new PluginHost(iframeRef.current, pluginId, hostOptions);

            if (onReady) {
                onReady();
            }
        }

        return () => {
            if (hostRef.current) {
                hostRef.current.destroy();
                hostRef.current = null;
            }
        };
    }, [pluginId, onReady, src]);

    return (
        <iframe
            ref={iframeRef}
            src={src}
            className={`w-full h-full border-none ${className || ''}`}
            sandbox="allow-scripts allow-forms allow-popups allow-modals"
            title={`Plugin: ${pluginId}`}
        />
    );
}

function resolveHostOptions(src: string) {
    if (typeof window === 'undefined') return {};

    try {
        const url = new URL(src, window.location.origin);
        return {
            allowedOrigins: url.origin ? [url.origin] : undefined,
            targetOrigin: url.origin,
            allowOpaqueOrigin: true,
        };
    } catch (error) {
        console.warn('[PluginFrame] Failed to derive origin from src', error);
        return { allowOpaqueOrigin: true };
    }
}
