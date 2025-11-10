'use client';

import { useCallback, useMemo } from 'react';
import { Rnd, type RndDragCallback, type RndResizeCallback } from 'react-rnd';
import type { WindowState } from '@/store/desktopStore';
import {
  RiCloseLine,
  RiSubtractLine,
  RiCheckboxBlankLine,
  RiCheckboxMultipleLine,
} from 'react-icons/ri';

export const WINDOW_MIN_WIDTH = 400;
export const WINDOW_MIN_HEIGHT = 300;

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
  titleBarClassName = 'window-drag-handle flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white cursor-move select-none',
  bodyClassName = 'flex-1 overflow-hidden',
}: BaseWindowProps) {
  const size = useMemo(
    () =>
      window.isMaximized
        ? maximizedSize
        : { width: window.size.width, height: window.size.height },
    [window.isMaximized, window.size.height, window.size.width, maximizedSize]
  );

  const position = useMemo(
    () => (window.isMaximized ? maximizedPosition : window.position),
    [window.isMaximized, window.position, maximizedPosition]
  );

  const handleDragStop = useCallback<RndDragCallback>((_, data) => {
    if (window.isMaximized) return;
    onPositionChange({ x: data.x, y: data.y });
  }, [onPositionChange, window.isMaximized]);

  const handleResizeStop = useCallback<RndResizeCallback>((_, __, ref, ___, positionData) => {
    if (window.isMaximized) return;
    const width = parseInt(ref.style.width, 10) || window.size.width;
    const height = parseInt(ref.style.height, 10) || window.size.height;
    onResize({ width, height }, positionData);
  }, [onResize, window.isMaximized, window.size.height, window.size.width]);

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
      enableResizing={!window.isMaximized}
      disableDragging={window.isMaximized}
    >
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* タイトルバー */}
        <div className={titleBarClassName}>
          <h3 className="font-semibold truncate">{window.title}</h3>

          {/* 制御ボタン */}
          <div className="flex items-center gap-2">
            <button
              onClick={onMinimize}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
              aria-label="最小化"
            >
              <RiSubtractLine className="w-5 h-5" />
            </button>

            <button
              onClick={onMaximize}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
              aria-label={window.isMaximized ? '元に戻す' : '最大化'}
            >
              {window.isMaximized ? (
                <RiCheckboxMultipleLine className="w-5 h-5" />
              ) : (
                <RiCheckboxBlankLine className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-red-500 rounded-lg transition-colors"
              aria-label="閉じる"
            >
              <RiCloseLine className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className={bodyClassName}>
          {AppComponent ? (
            <AppComponent />
          ) : (
            <div className="p-6 text-center text-gray-600 dark:text-gray-400">
              アプリが見つかりません: {window.appId}
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
}
