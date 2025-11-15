'use client';

import { useCallback, useMemo } from 'react';
import { useDesktopStore, WindowState, type App } from '@/store/desktopStore';
import { useShallow } from 'zustand/react/shallow';
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
import { BaseWindow, WINDOW_MIN_HEIGHT, WINDOW_MIN_WIDTH } from './BaseWindow';
import { appComponents } from './appRegistry';

// レスポンシブ対応：モバイルでは最小サイズを小さく
const SPLIT_WINDOW_MIN_WIDTH = 280;  // モバイル: 280px
const SPLIT_WINDOW_MIN_HEIGHT = 250; // モバイル: 250px
export function useAppGridDnD() {
  const apps = useDesktopStore((state) => state.apps);
  const reorderApps = useDesktopStore((state) => state.reorderApps);

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

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = apps.findIndex((app) => app.id === active.id);
        const newIndex = apps.findIndex((app) => app.id === over.id);
        reorderApps(oldIndex, newIndex);
      }
    },
    [apps, reorderApps]
  );

  return { sensors, handleDragEnd };
}

interface SplitModeProps {
  className?: string;
  scale?: number;
}

export function SplitMode({ className = 'h-full w-full', scale = 1 }: SplitModeProps = {}) {
  const splitMode = useDesktopStore((state) => state.splitMode);
  const { sensors, handleDragEnd } = useAppGridDnD();

  if (splitMode === 1) {
    return (
      <SplitScreen
        screenId="primary"
        sensors={sensors}
        handleDragEnd={handleDragEnd}
        className={className}
        useGlobalWindows
        scale={scale}
        windowMinWidth={WINDOW_MIN_WIDTH}
        windowMinHeight={WINDOW_MIN_HEIGHT}
      />
    );
  }

  // 2分割レイアウト
  if (splitMode === 2) {
    return (
      <div className={`flex gap-4 ${className}`}>
        {/* 左画面 */}
        <SplitScreen
          screenId="left"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="w-1/2 h-full border-r border-cloud/40"
          scale={scale}
        />

        {/* 右画面 */}
        <SplitScreen
          screenId="right"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="w-1/2 h-full"
          scale={scale}
        />
      </div>
    );
  }

  // 3分割レイアウト（左50% + 右上25% + 右下25%）
  if (splitMode === 3) {
    return (
      <div className={`flex gap-4 ${className}`}>
        {/* 左画面 */}
        <SplitScreen
          screenId="left"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="w-1/2 h-full border-r border-cloud/40"
          scale={scale}
        />

        {/* 右側2分割 */}
        <div className="w-1/2 h-full flex flex-col">
          {/* 右上画面 */}
          <SplitScreen
            screenId="topRight"
            sensors={sensors}
            handleDragEnd={handleDragEnd}
            className="h-1/2 border-b border-cloud/40"
            scale={scale}
          />

          {/* 右下画面 */}
          <SplitScreen
            screenId="bottomRight"
            sensors={sensors}
            handleDragEnd={handleDragEnd}
            className="h-1/2"
            scale={scale}
          />
        </div>
      </div>
    );
  }

  // 4分割レイアウト（2x2グリッド）
  if (splitMode === 4) {
    return (
      <div className={`grid grid-cols-2 grid-rows-2 gap-4 ${className}`}>
        {/* 左上画面 */}
        <SplitScreen
          screenId="topLeft"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="border-r border-b border-cloud/40 h-full"
          scale={scale}
        />

        {/* 右上画面 */}
        <SplitScreen
          screenId="topRight"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="border-b border-cloud/40 h-full"
          scale={scale}
        />

        {/* 左下画面 */}
        <SplitScreen
          screenId="bottomLeft"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="border-r border-cloud/40 h-full"
          scale={scale}
        />

        {/* 右下画面 */}
        <SplitScreen
          screenId="bottomRight"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="h-full"
          scale={scale}
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
  useGlobalWindows?: boolean;
  scale?: number;
  windowMinWidth?: number;
  windowMinHeight?: number;
}

export function SplitScreen({
  screenId,
  sensors,
  handleDragEnd,
  className = '',
  useGlobalWindows = false,
  scale = 1,
  windowMinWidth = SPLIT_WINDOW_MIN_WIDTH,
  windowMinHeight = SPLIT_WINDOW_MIN_HEIGHT,
}: SplitScreenProps) {
  /**
   * パフォーマンス最適化: データとアクションを分離
   *
   * 【問題点】
   * 以前の実装では、actionsオブジェクトをselector内で毎回生成していました。
   * shallow比較は第一階層のみを比較するため、actionsオブジェクト自体が
   * 新しいオブジェクト参照として判定され、データが変わっていなくても
   * 毎回再レンダリングが発生していました。
   *
   * 【解決策】
   * 1. データ（apps, screenWindows）のみをshallow比較対象のselectorで取得
   * 2. アクション関数は別途取得（Zustandの関数は参照が保持される）
   * 3. これによりデータが変わったときだけ再レンダリングされる
   */

  // データ部分のみを取得（shallow比較対象）
  const { apps, screenWindows } = useDesktopStore(
    useShallow((state) => ({
      apps: state.apps,
      screenWindows: useGlobalWindows ? state.windows : state.splitScreenWindows[screenId] || [],
    }))
  );

  const openWindowDefault = useDesktopStore((state) => state.openWindow);
  const closeWindowDefault = useDesktopStore((state) => state.closeWindow);
  const minimizeWindowDefault = useDesktopStore((state) => state.minimizeWindow);
  const maximizeWindowDefault = useDesktopStore((state) => state.maximizeWindow);
  const bringToFrontDefault = useDesktopStore((state) => state.bringToFront);
  const updateWindowPositionDefault = useDesktopStore((state) => state.updateWindowPosition);
  const updateWindowSizeDefault = useDesktopStore((state) => state.updateWindowSize);

  const openWindowSplit = useDesktopStore((state) => state.openWindowInScreen);
  const closeWindowSplit = useDesktopStore((state) => state.closeWindowInScreen);
  const minimizeWindowSplit = useDesktopStore((state) => state.minimizeWindowInScreen);
  const maximizeWindowSplit = useDesktopStore((state) => state.maximizeWindowInScreen);
  const bringToFrontSplit = useDesktopStore((state) => state.bringToFrontInScreen);
  const updateWindowPositionSplit = useDesktopStore((state) => state.updateWindowPositionInScreen);
  const updateWindowSizeSplit = useDesktopStore((state) => state.updateWindowSizeInScreen);

  const handleOpen = useCallback(
    (appId: App['id']) => {
      if (useGlobalWindows) {
        openWindowDefault(appId);
      } else {
        openWindowSplit(screenId, appId);
      }
    },
    [openWindowDefault, openWindowSplit, screenId, useGlobalWindows]
  );

  const handleClose = useCallback(
    (windowId: string) => {
      if (useGlobalWindows) {
        closeWindowDefault(windowId);
      } else {
        closeWindowSplit(screenId, windowId);
      }
    },
    [closeWindowDefault, closeWindowSplit, screenId, useGlobalWindows]
  );

  const handleMinimize = useCallback(
    (windowId: string) => {
      if (useGlobalWindows) {
        minimizeWindowDefault(windowId);
      } else {
        minimizeWindowSplit(screenId, windowId);
      }
    },
    [minimizeWindowDefault, minimizeWindowSplit, screenId, useGlobalWindows]
  );

  const handleMaximize = useCallback(
    (windowId: string) => {
      if (useGlobalWindows) {
        maximizeWindowDefault(windowId);
      } else {
        maximizeWindowSplit(screenId, windowId);
      }
    },
    [maximizeWindowDefault, maximizeWindowSplit, screenId, useGlobalWindows]
  );

  const handleFocus = useCallback(
    (windowId: string) => {
      if (useGlobalWindows) {
        bringToFrontDefault(windowId);
      } else {
        bringToFrontSplit(screenId, windowId);
      }
    },
    [bringToFrontDefault, bringToFrontSplit, screenId, useGlobalWindows]
  );

  const handlePositionChange = useCallback(
    (windowId: string, position: { x: number; y: number }) => {
      if (useGlobalWindows) {
        updateWindowPositionDefault(windowId, position);
      } else {
        updateWindowPositionSplit(screenId, windowId, position);
      }
    },
    [screenId, updateWindowPositionDefault, updateWindowPositionSplit, useGlobalWindows]
  );

  const handleResize = useCallback(
    (windowId: string, size: { width: number; height: number }, position: { x: number; y: number }) => {
      if (useGlobalWindows) {
        updateWindowSizeDefault(windowId, size);
        updateWindowPositionDefault(windowId, position);
      } else {
        updateWindowSizeSplit(screenId, windowId, size);
        updateWindowPositionSplit(screenId, windowId, position);
      }
    },
    [screenId, updateWindowPositionDefault, updateWindowPositionSplit, updateWindowSizeDefault, updateWindowSizeSplit, useGlobalWindows]
  );

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* デスクトップエリア：アイコングリッド */}
      <div className="h-full overflow-auto p-2 md:p-4">
        <DndContext
          id={`split-screen-${screenId}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={apps.map((app: App) => app.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
              {apps.map((app: App) => (
                <AppIcon
                  key={app.id}
                  id={app.id}
                  name={app.name}
                  icon={app.icon}
                  color={app.color}
                  onOpen={() => handleOpen(app.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* ウィンドウマネージャー：このスクリーン専用のウィンドウを表示 */}
        {screenWindows.map((window: WindowState) => (
          <ScreenWindow
            key={window.id}
            window={window}
            onClose={handleClose}
            onMinimize={handleMinimize}
            onMaximize={handleMaximize}
            onFocus={handleFocus}
            onPositionChange={handlePositionChange}
            onResize={handleResize}
            minWidth={windowMinWidth}
            minHeight={windowMinHeight}
            scale={scale}
          />
        ))}
      </div>
    </div>
  );
}

// スクリーン専用ウィンドウコンポーネント（通常のWindowと同様だが、スクリーンIDを使う）
interface ScreenWindowProps {
  window: WindowState;
  onClose: (windowId: string) => void;
  onMinimize: (windowId: string) => void;
  onMaximize: (windowId: string) => void;
  onFocus: (windowId: string) => void;
  onPositionChange: (windowId: string, position: { x: number; y: number }) => void;
  onResize: (windowId: string, size: { width: number; height: number }, position: { x: number; y: number }) => void;
  minWidth?: number;
  minHeight?: number;
  scale?: number;
}

function ScreenWindow({
  window,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onPositionChange,
  onResize,
  minWidth = SPLIT_WINDOW_MIN_WIDTH,
  minHeight = SPLIT_WINDOW_MIN_HEIGHT,
  scale = 1,
}: ScreenWindowProps) {
  const AppComponent = useMemo(() => appComponents[window.appId], [window.appId]);

  const handleClose = useCallback(() => onClose(window.id), [onClose, window.id]);
  const handleMinimize = useCallback(() => onMinimize(window.id), [onMinimize, window.id]);
  const handleMaximize = useCallback(() => onMaximize(window.id), [onMaximize, window.id]);
  const handleFocus = useCallback(() => onFocus(window.id), [onFocus, window.id]);
  const handlePositionChange = useCallback((position: { x: number; y: number }) => {
    onPositionChange(window.id, position);
  }, [onPositionChange, window.id]);
  const handleResize = useCallback((size: { width: number; height: number }, position: { x: number; y: number }) => {
    onResize(window.id, size, position);
  }, [onResize, window.id]);

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
      minWidth={minWidth}
      minHeight={minHeight}
      scale={scale}
      titleBarClassName="window-drag-handle flex items-center justify-between px-2 md:px-3 py-1.5 md:py-2 bg-surface text-ink border-b border-accent-sand/60 cursor-move select-none text-xs md:text-sm"
      bodyClassName="flex-1 overflow-auto"
    />
  );
}
