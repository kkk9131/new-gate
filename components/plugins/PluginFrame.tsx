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
            // Initialize host bridge
            hostRef.current = new PluginHost(iframeRef.current, pluginId);

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
    }, [pluginId, onReady]);

    return (
        <iframe
            ref={iframeRef}
            src={src}
            className={`w-full h-full border-none ${className || ''}`}
            sandbox="allow-scripts allow-same-origin allow-forms"
            title={`Plugin: ${pluginId}`}
        />
    );
}
