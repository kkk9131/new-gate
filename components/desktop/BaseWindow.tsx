'use client';

import { useCallback, useMemo } from 'react';
import { Rnd, type RndDragCallback, type RndResizeCallback } from 'react-rnd';
import type { WindowState } from '@/store/desktopStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
  RiCloseLine,
  RiSubtractLine,
  RiCheckboxBlankLine,
  RiCheckboxMultipleLine,
} from 'react-icons/ri';

// レスポンシブ対応：モバイルでは最小サイズを小さく
export const WINDOW_MIN_WIDTH = 320;  // モバイル: 320px
export const WINDOW_MIN_HEIGHT = 400; // モバイル: 400px（縦長）

interface BaseWindowProps {
  window: WindowState;
  AppComponent?: React.ComponentType;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  onPositionChange: (position: { x: number; y: number }) => void;
  onResize: (size: { width: number; height: number }, position: { x: number; y: number }) => void;
  minWidth?: number;
  minHeight?: number;
  bounds?: string;
  maximizedSize?: { width: number | string; height: number | string };
  maximizedPosition?: { x: number; y: number };
  titleBarClassName?: string;
  bodyClassName?: string;
}

export function BaseWindow({
  window,
  AppComponent,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onPositionChange,
  onResize,
  minWidth = WINDOW_MIN_WIDTH,
  minHeight = WINDOW_MIN_HEIGHT,
  bounds = 'parent',
  maximizedSize = { width: '100%', height: '100%' },
  maximizedPosition = { x: 0, y: 0 },
  titleBarClassName = 'window-drag-handle flex items-center justify-between px-2 md:px-4 py-2 md:py-3 bg-surface text-ink border-b border-accent-sand/60 cursor-move select-none',
  bodyClassName = 'flex-1 overflow-hidden',
}: BaseWindowProps) {
  // モバイル判定（カスタムフック使用）
  const { isMobile } = useIsMobile();

  // モバイル時は常に全画面、デスクトップ時は通常のロジック
  const size = useMemo(
    () => {
      if (isMobile) {
        return { width: '100%', height: '100%' };
      }
      return window.isMaximized
        ? maximizedSize
        : { width: window.size.width, height: window.size.height };
    },
    [isMobile, window.isMaximized, window.size.height, window.size.width, maximizedSize]
  );

  const position = useMemo(
    () => {
      if (isMobile) {
        return { x: 0, y: 0 };
      }
      return window.isMaximized ? maximizedPosition : window.position;
    },
    [isMobile, window.isMaximized, window.position, maximizedPosition]
  );

  const handleDragStop = useCallback<RndDragCallback>((_, data) => {
    if (window.isMaximized || isMobile) return;
    onPositionChange({ x: data.x, y: data.y });
  }, [onPositionChange, window.isMaximized, isMobile]);

  const handleResizeStop = useCallback<RndResizeCallback>((_, __, ref, ___, positionData) => {
    if (window.isMaximized || isMobile) return;
    const width = parseInt(ref.style.width, 10) || window.size.width;
    const height = parseInt(ref.style.height, 10) || window.size.height;
    onResize({ width, height }, positionData);
  }, [onResize, window.isMaximized, window.size.height, window.size.width, isMobile]);

  const handleFocus = useCallback(() => {
    onFocus();
  }, [onFocus]);

  return (
    <Rnd
      size={size}
      position={position}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      minWidth={minWidth}
      minHeight={minHeight}
      bounds={bounds}
      dragHandleClassName="window-drag-handle"
      style={{ zIndex: window.zIndex }}
      onMouseDown={handleFocus}
      enableResizing={!window.isMaximized && !isMobile}
      disableDragging={window.isMaximized || isMobile}
    >
      <div className="h-full flex flex-col bg-surface text-ink rounded-2xl shadow-floating border border-white/40 overflow-hidden">
        {/* タイトルバー */}
        <div className={titleBarClassName}>
          <h3 className="text-sm md:text-base font-semibold truncate">{window.title}</h3>

          {/* 制御ボタン */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              onClick={onMinimize}
              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-cloud/30 rounded-lg transition-colors"
              aria-label="最小化"
            >
              <RiSubtractLine className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <button
              onClick={onMaximize}
              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-cloud/30 rounded-lg transition-colors"
              aria-label={window.isMaximized ? '元に戻す' : '最大化'}
            >
              {window.isMaximized ? (
                <RiCheckboxMultipleLine className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <RiCheckboxBlankLine className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>

            <button
              onClick={onClose}
              className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center hover:bg-cloud/40 rounded-lg transition-colors"
              aria-label="閉じる"
            >
              <RiCloseLine className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className={bodyClassName}>
          {AppComponent ? (
            <AppComponent />
          ) : (
            <div className="p-4 md:p-6 text-center text-cloud">
              アプリが見つかりません: {window.appId}
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
}
