'use client';

import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import { RiCloseLine, RiRobot2Line } from 'react-icons/ri';
import { useDesktopStore, CHAT_MIN_WIDTH, CHAT_MAX_WIDTH } from '@/store/desktopStore';
import { useIsMobile } from '@/hooks/useIsMobile';

const PANEL_TRANSITION_MS = 200;

export function ChatPanel() {
  const isChatOpen = useDesktopStore((state) => state.isChatOpen);
  const chatWidth = useDesktopStore((state) => state.chatWidth);
  const setChatWidth = useDesktopStore((state) => state.setChatWidth);
  const setChatOpen = useDesktopStore((state) => state.setChatOpen);
  const { isMobile } = useIsMobile();

  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  useEffect(() => {
    if (isMobile && isChatOpen) {
      setChatOpen(false);
    }
  }, [isMobile, isChatOpen, setChatOpen]);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      const delta = startXRef.current - event.clientX;
      setChatWidth(startWidthRef.current + delta);
    };

    const stopResizing = () => {
      setIsResizing(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResizing);
    window.addEventListener('pointercancel', stopResizing);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResizing);
      window.removeEventListener('pointercancel', stopResizing);
    };
  }, [isResizing, setChatWidth]);

  const handleResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    startXRef.current = event.clientX;
    startWidthRef.current = chatWidth;
    setIsResizing(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  if (isMobile) {
    return null;
  }

  return (
    <aside
      aria-hidden={!isChatOpen}
      style={{ width: isChatOpen ? chatWidth : 0, transitionDuration: `${PANEL_TRANSITION_MS}ms` }}
      className="relative h-full flex-shrink-0 overflow-visible transition-[width] duration-200 ease-out"
    >
      <div
        style={{ transitionDuration: `${PANEL_TRANSITION_MS}ms` }}
        className={`absolute inset-0 h-full border-l border-white/30 bg-surface/95 dark:bg-gray-900/95 shadow-panel flex flex-col transition-[transform,opacity] ease-out ${
          isChatOpen ? 'translate-x-0 opacity-100 pointer-events-auto' : 'translate-x-full opacity-0 pointer-events-none'
        }`}
      >
      <div
        className={`absolute left-0 top-0 h-full w-2 cursor-col-resize group ${
          isResizing ? 'bg-accent-sand/40' : 'bg-transparent'
        }`}
        onPointerDown={handleResizeStart}
        aria-label="チャット幅を調整"
        role="separator"
      >
        <div className="absolute right-[-1px] top-1/2 h-14 w-1 -translate-y-1/2 rounded-full bg-white/40 group-hover:bg-white/70" />
      </div>

      <header className="px-4 py-3 border-b border-white/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
            <RiRobot2Line className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-cloud/70">Multi Agent</p>
            <p className="text-sm font-semibold text-ink">ワークスペースチャット</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setChatOpen(false)}
          className="inline-flex items-center gap-1 rounded-full border border-white/40 px-3 py-1 text-xs font-semibold text-ink hover:bg-cloud/20"
        >
          <RiCloseLine className="h-4 w-4" />
          Close
        </button>
      </header>

      <div className="px-4 py-2 text-xs text-cloud/70">
        <p>ドラッグで幅調整（{CHAT_MIN_WIDTH}px - {CHAT_MAX_WIDTH}px）</p>
      </div>

      <div className="flex-1 px-4 pb-6 pt-2 text-sm text-cloud flex flex-col gap-4">
        <div className="rounded-2xl border border-white/30 bg-white/5 p-4">
          <p className="text-xs font-semibold text-cloud/70">ステータス</p>
          <p className="text-base font-semibold text-ink">準備中</p>
          <p className="mt-1 text-xs text-cloud/70">ChatKit実装前のプレースホルダーです。</p>
        </div>
        <div className="flex-1 rounded-2xl border border-dashed border-white/30 bg-white/5 p-4 text-center text-cloud/60">
          チャットUI PoC（MA-001）
        </div>
      </div>
      </div>
    </aside>
  );
}
