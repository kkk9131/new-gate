'use client';

import { useCallback, useMemo } from 'react';
import { useDesktopStore, WindowState } from '@/store/desktopStore';
import { shallow } from 'zustand/shallow';
import type { SensorDescriptor, SensorOptions } from '@dnd-kit/core';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { AppIcon } from './AppIcon';
import { BaseWindow } from './BaseWindow';
import { appComponents } from './appRegistry';

const SPLIT_WINDOW_MIN_WIDTH = 300;
const SPLIT_WINDOW_MIN_HEIGHT = 200;

export function SplitMode() {
  const splitMode = useDesktopStore((state) => state.splitMode);
  const apps = useDesktopStore((state) => state.apps);
  const reorderApps = useDesktopStore((state) => state.reorderApps);

  // ドラッグ&ドロップのセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ドラッグ終了時の処理
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = apps.findIndex((app) => app.id === active.id);
      const newIndex = apps.findIndex((app) => app.id === over.id);
      reorderApps(oldIndex, newIndex);
    }
  };

  // 通常モードなら表示しない
  if (splitMode === 1) return null;

  // 2分割レイアウト
  if (splitMode === 2) {
    return (
      <div className="fixed top-16 left-0 right-0 bottom-0 z-[50] bg-gray-50 dark:bg-gray-900 flex">
        {/* 左画面 */}
        <SplitScreen
          screenId="left"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="w-1/2 border-r border-gray-300 dark:border-gray-700"
        />

        {/* 右画面 */}
        <SplitScreen
          screenId="right"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="w-1/2"
        />
      </div>
    );
  }

  // 3分割レイアウト（左50% + 右上25% + 右下25%）
  if (splitMode === 3) {
    return (
      <div className="fixed top-16 left-0 right-0 bottom-0 z-[50] bg-gray-50 dark:bg-gray-900 flex">
        {/* 左画面 */}
        <SplitScreen
          screenId="left"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="w-1/2 border-r border-gray-300 dark:border-gray-700"
        />

        {/* 右側2分割 */}
        <div className="w-1/2 flex flex-col">
          {/* 右上画面 */}
          <SplitScreen
            screenId="topRight"
            sensors={sensors}
            handleDragEnd={handleDragEnd}
            className="h-1/2 border-b border-gray-300 dark:border-gray-700"
          />

          {/* 右下画面 */}
          <SplitScreen
            screenId="bottomRight"
            sensors={sensors}
            handleDragEnd={handleDragEnd}
            className="h-1/2"
          />
        </div>
      </div>
    );
  }

  // 4分割レイアウト（2x2グリッド）
  if (splitMode === 4) {
    return (
      <div className="fixed top-16 left-0 right-0 bottom-0 z-[50] bg-gray-50 dark:bg-gray-900 grid grid-cols-2 grid-rows-2">
        {/* 左上画面 */}
        <SplitScreen
          screenId="topLeft"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="border-r border-b border-gray-300 dark:border-gray-700"
        />

        {/* 右上画面 */}
        <SplitScreen
          screenId="topRight"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="border-b border-gray-300 dark:border-gray-700"
        />

        {/* 左下画面 */}
        <SplitScreen
          screenId="bottomLeft"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="border-r border-gray-300 dark:border-gray-700"
        />

        {/* 右下画面 */}
        <SplitScreen
          screenId="bottomRight"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className=""
        />
      </div>
    );
  }

  return null;
}

// 個別スクリーンコンポーネント - 完全なデスクトップUI環境を提供
interface SplitScreenProps {
  screenId: string;
  sensors: SensorDescriptor<SensorOptions>[];
  handleDragEnd: (event: DragEndEvent) => void;
  className?: string;
}

function SplitScreen({ screenId, sensors, handleDragEnd, className = '' }: SplitScreenProps) {
  // パフォーマンス最適化: セレクターを1つにまとめてshallow比較
  // これにより不要な再レンダリングを防止
  const { apps, screenWindows, actions } = useDesktopStore(
    (state) => ({
      apps: state.apps,
      screenWindows: state.splitScreenWindows[screenId] || [],
      actions: {
        openWindow: state.openWindowInScreen,
        closeWindow: state.closeWindowInScreen,
        minimizeWindow: state.minimizeWindowInScreen,
        maximizeWindow: state.maximizeWindowInScreen,
        bringToFront: state.bringToFrontInScreen,
        updateWindowPosition: state.updateWindowPositionInScreen,
        updateWindowSize: state.updateWindowSizeInScreen,
      },
    }),
    shallow
  );

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* デスクトップエリア：アイコングリッド */}
      <div className="h-full overflow-auto p-4">
        <DndContext
          id={`split-screen-${screenId}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={apps.map((app) => app.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-4 gap-3">
              {apps.map((app) => (
                <AppIcon
                  key={app.id}
                  id={app.id}
                  name={app.name}
                  icon={app.icon}
                  color={app.color}
                  onOpen={() => actions.openWindow(screenId, app.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* ウィンドウマネージャー：このスクリーン専用のウィンドウを表示 */}
        {screenWindows.map((window) => (
          <ScreenWindow
            key={window.id}
            window={window}
            screenId={screenId}
            closeWindow={actions.closeWindow}
            minimizeWindow={actions.minimizeWindow}
            maximizeWindow={actions.maximizeWindow}
            bringToFront={actions.bringToFront}
            updateWindowPosition={actions.updateWindowPosition}
            updateWindowSize={actions.updateWindowSize}
          />
        ))}
      </div>
    </div>
  );
}

// スクリーン専用ウィンドウコンポーネント（通常のWindowと同様だが、スクリーンIDを使う）
interface ScreenWindowProps {
  window: WindowState;
  screenId: string;
  closeWindow: (screenId: string, windowId: string) => void;
  minimizeWindow: (screenId: string, windowId: string) => void;
  maximizeWindow: (screenId: string, windowId: string) => void;
  bringToFront: (screenId: string, windowId: string) => void;
  updateWindowPosition: (screenId: string, windowId: string, position: { x: number; y: number }) => void;
  updateWindowSize: (screenId: string, windowId: string, size: { width: number; height: number }) => void;
}

function ScreenWindow({
  window,
  screenId,
  closeWindow,
  minimizeWindow,
  maximizeWindow,
  bringToFront,
  updateWindowPosition,
  updateWindowSize,
}: ScreenWindowProps) {
  const AppComponent = useMemo(() => appComponents[window.appId], [window.appId]);

  const handleClose = useCallback(() => closeWindow(screenId, window.id), [closeWindow, screenId, window.id]);
  const handleMinimize = useCallback(() => minimizeWindow(screenId, window.id), [minimizeWindow, screenId, window.id]);
  const handleMaximize = useCallback(() => maximizeWindow(screenId, window.id), [maximizeWindow, screenId, window.id]);
  const handleFocus = useCallback(() => bringToFront(screenId, window.id), [bringToFront, screenId, window.id]);
  const handlePositionChange = useCallback((position: { x: number; y: number }) => {
    updateWindowPosition(screenId, window.id, position);
  }, [screenId, updateWindowPosition, window.id]);
  const handleResize = useCallback((size: { width: number; height: number }, position: { x: number; y: number }) => {
    updateWindowSize(screenId, window.id, size);
    updateWindowPosition(screenId, window.id, position);
  }, [screenId, updateWindowPosition, updateWindowSize, window.id]);

  if (window.isMinimized) return null;

  return (
    <BaseWindow
      window={window}
      AppComponent={AppComponent}
      onClose={handleClose}
      onMinimize={handleMinimize}
      onMaximize={handleMaximize}
      onFocus={handleFocus}
      onPositionChange={handlePositionChange}
      onResize={handleResize}
      minWidth={SPLIT_WINDOW_MIN_WIDTH}
      minHeight={SPLIT_WINDOW_MIN_HEIGHT}
      titleBarClassName="window-drag-handle flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white cursor-move select-none text-sm"
      bodyClassName="flex-1 overflow-auto"
    />
  );
}
