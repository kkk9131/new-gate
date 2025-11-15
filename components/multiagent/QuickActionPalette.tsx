'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RiPulseLine } from 'react-icons/ri';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useDesktopStore } from '@/store/desktopStore';

const SAMPLE_PHRASES = [
  'Screen1でSalesforceの商談ボードを開いて直近7件の進捗をまとめて',
  'Screen2で経費レポートを生成して今日締めに必要な差分だけ抽出して',
  'Screen3でNotionのAIロードマップを読み上げて3行に要約して',
  'Screen4でAtlasデザインを確認してコメントにステータスを追記して',
];

const STREAM_INTERVAL_MS = 90;

const useKeyHold = (start: () => void, stop: () => void, isMobile: boolean) => {
  useEffect(() => {
    if (isMobile) return;

    const isEditableTarget = (element: EventTarget | null) => {
      if (!(element instanceof HTMLElement)) return false;
      return element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat) return;
      if (event.metaKey || event.ctrlKey || event.altKey || isEditableTarget(event.target)) return;
      event.preventDefault();
      start();
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code !== 'Space') return;
      event.preventDefault();
      stop();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMobile, start, stop]);
};

export function QuickActionPalette() {
  const { isMobile } = useIsMobile();
  const activeScreen = useDesktopStore((state) => state.activeQuadScreen);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [elapsedMs, setElapsedMs] = useState(0);

  const sampleRef = useRef('');
  const streamIndexRef = useRef(0);
  const streamIntervalRef = useRef<number>();
  const elapsedIntervalRef = useRef<number>();

  const cleanupTimers = useCallback(() => {
    if (streamIntervalRef.current) {
      window.clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = undefined;
    }
    if (elapsedIntervalRef.current) {
      window.clearInterval(elapsedIntervalRef.current);
      elapsedIntervalRef.current = undefined;
    }
  }, []);

  const startListening = useCallback(() => {
    if (isListening) return;
    sampleRef.current = SAMPLE_PHRASES[Math.floor(Math.random() * SAMPLE_PHRASES.length)];
    streamIndexRef.current = 0;
    setTranscript('');
    setElapsedMs(0);
    setIsListening(true);

    cleanupTimers();
    streamIntervalRef.current = window.setInterval(() => {
      const increment = Math.max(1, Math.floor(Math.random() * 3) + 1);
      streamIndexRef.current = Math.min(sampleRef.current.length, streamIndexRef.current + increment);
      setTranscript(sampleRef.current.slice(0, streamIndexRef.current));
      if (streamIndexRef.current >= sampleRef.current.length) {
        if (streamIntervalRef.current) {
          window.clearInterval(streamIntervalRef.current);
          streamIntervalRef.current = undefined;
        }
      }
    }, STREAM_INTERVAL_MS);

    elapsedIntervalRef.current = window.setInterval(() => {
      setElapsedMs((prev) => prev + 100);
    }, 100);
  }, [cleanupTimers, isListening]);

  const stopListening = useCallback(() => {
    if (!isListening) return;
    cleanupTimers();
    setIsListening(false);
    setElapsedMs(0);

    const finalText = transcript.trim();
    setTranscript('');
    if (finalText.length === 0) return;
    console.debug('[QuickAction] submit', { screen: activeScreen, text: finalText });
  }, [activeScreen, cleanupTimers, isListening, transcript]);

  useKeyHold(startListening, stopListening, isMobile);

  useEffect(() => () => cleanupTimers(), [cleanupTimers]);

  const elapsedSeconds = useMemo(() => (elapsedMs / 1000).toFixed(1), [elapsedMs]);

  if (isMobile) {
    return null;
  }

  return (
    <>
      {isListening && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-[330] flex flex-col items-end gap-1">
          <div className="relative h-14 w-14">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/15" />
            <span className="absolute inset-1 animate-pulse rounded-full bg-emerald-300/20" />
            <span className="absolute inset-2 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 opacity-90 shadow-panel" />
            <RiPulseLine className="absolute inset-0 m-auto h-4 w-4 text-white/80" />
          </div>
          <div className="max-w-[280px] rounded-3xl border border-white/10 bg-gray-950/30 px-4 py-2 text-sm font-medium text-white/70 backdrop-blur">
            {transcript || <span className="tracking-[0.3em] text-white/30">···</span>}
          </div>
          <div className="text-[10px] text-white/35">{elapsedSeconds}s</div>
        </div>
      )}
    </>
  );
}
