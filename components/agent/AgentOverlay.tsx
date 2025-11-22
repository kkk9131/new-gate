import { useDesktopStore } from '@/store/desktopStore';
import { RiRobot2Line, RiLoader4Line, RiCheckLine, RiErrorWarningLine } from 'react-icons/ri';

interface AgentOverlayProps {
    screenId: number;
}

export function AgentOverlay({ screenId }: AgentOverlayProps) {
    const screenState = useDesktopStore(state => state.screens[screenId]);

    if (!screenState) return null;

    const isActive = screenState.status !== 'idle';

    return (
        <div className="absolute inset-0 z-[100] pointer-events-none flex flex-col items-center justify-center transition-all duration-300">
            {isActive && (
                <div className="absolute inset-1 rounded-xl ring-2 ring-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-[pulse_1.6s_ease-in-out_infinite]" />
            )}
            {screenState.status !== 'idle' && (
            <div className="bg-surface-strong/95 border border-white/20 rounded-xl p-4 shadow-xl flex flex-col items-center gap-3 max-w-[200px] animate-in fade-in zoom-in duration-200 backdrop-blur-[1px]">
                {/* Status Icon */}
                <div className="relative">
                    {screenState.status === 'initializing' && (
                        <RiLoader4Line className="w-8 h-8 text-accent-sand animate-spin" />
                    )}
                    {screenState.status === 'thinking' && (
                        <RiLoader4Line className="w-8 h-8 text-accent-sand animate-spin" />
                    )}
                    {screenState.status === 'executing' && (
                        <RiRobot2Line className="w-8 h-8 text-blue-400 animate-pulse" />
                    )}
                    {screenState.status === 'completed' && (
                        <RiCheckLine className="w-8 h-8 text-green-400" />
                    )}
                    {screenState.status === 'error' && (
                        <RiErrorWarningLine className="w-8 h-8 text-red-400" />
                    )}
                </div>

                {/* Status Text */}
                <div className="text-center">
                    <p className="font-medium text-ink capitalize text-sm">{screenState.status}</p>
                    {screenState.appId && (
                        <p className="text-xs text-ink/60 mt-1">App: {screenState.appId}</p>
                    )}
                </div>

                {/* Progress Bar */}
                {screenState.progress !== undefined && (
                    <div className="w-full h-1 bg-cloud/30 rounded-full overflow-hidden mt-1">
                        <div
                            className="h-full bg-accent-sand transition-all duration-500 ease-out"
                            style={{ width: `${screenState.progress}%` }}
                        />
                    </div>
                )}
            </div>
            )}
        </div>
    );
}
