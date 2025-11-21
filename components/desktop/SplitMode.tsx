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
import { BaseWindow } from './BaseWindow';
import { appComponents } from './appRegistry';
import { AgentOverlay } from '../agent/AgentOverlay';

// レスポンシブ対応：モバイルでは最小サイズを小さく
const SPLIT_WINDOW_MIN_WIDTH = 280;  // モバイル: 280px
const SPLIT_WINDOW_MIN_HEIGHT = 250; // モバイル: 250px

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
      <div className="absolute inset-0 z-[50] bg-mist flex">
        {/* 左画面 */}
        <SplitScreen
          screenId="left"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="w-1/2 border-r border-cloud/40"
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
      <div className="absolute inset-0 z-[50] bg-mist flex">
        {/* 左画面 */}
        <SplitScreen
          screenId="left"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="w-1/2 border-r border-cloud/40"
        />

        {/* 右側2分割 */}
        <div className="w-1/2 flex flex-col">
          {/* 右上画面 */}
          <SplitScreen
            screenId="topRight"
            sensors={sensors}
            handleDragEnd={handleDragEnd}
            className="h-1/2 border-b border-cloud/40"
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
      <div className="absolute inset-0 z-[50] bg-mist grid grid-cols-2 grid-rows-2">
        {/* 左上画面 */}
        <SplitScreen
          screenId="topLeft"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="border-r border-b border-cloud/40"
        />

        {/* 右上画面 */}
        <SplitScreen
          screenId="topRight"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="border-b border-cloud/40"
        />

        {/* 左下画面 */}
        <SplitScreen
          screenId="bottomLeft"
          sensors={sensors}
          handleDragEnd={handleDragEnd}
          className="border-r border-cloud/40"
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
      screenWindows: state.splitScreenWindows[screenId] || [],
    }))
  );

  // アクション関数は別途取得（参照が保持されるため再レンダリングの原因にならない）
  const openWindow = useDesktopStore((state) => state.openWindowInScreen);
  const closeWindow = useDesktopStore((state) => state.closeWindowInScreen);
  const minimizeWindow = useDesktopStore((state) => state.minimizeWindowInScreen);
  const maximizeWindow = useDesktopStore((state) => state.maximizeWindowInScreen);
  const bringToFront = useDesktopStore((state) => state.bringToFrontInScreen);
  const updateWindowPosition = useDesktopStore((state) => state.updateWindowPositionInScreen);
  const updateWindowSize = useDesktopStore((state) => state.updateWindowSizeInScreen);

  // エージェント用: SplitModeと数値ID変換
  const splitMode = useDesktopStore(state => state.splitMode);
  const numericScreenId = useMemo(() => {
    if (splitMode === 2) return screenId === 'left' ? 1 : 2;
    if (splitMode === 3) return screenId === 'left' ? 1 : screenId === 'topRight' ? 2 : 3;
    if (splitMode === 4) {
      const map: Record<string, number> = { topLeft: 1, topRight: 2, bottomLeft: 3, bottomRight: 4 };
      return map[screenId] || 0;
    }
    return 0;
  }, [screenId, splitMode]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AgentOverlay screenId={numericScreenId} />

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
                  onOpen={() => openWindow(screenId, app.id)}
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
            screenId={screenId}
            closeWindow={closeWindow}
            minimizeWindow={minimizeWindow}
            maximizeWindow={maximizeWindow}
            bringToFront={bringToFront}
            updateWindowPosition={updateWindowPosition}
            updateWindowSize={updateWindowSize}
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
      titleBarClassName="window-drag-handle flex items-center justify-between px-2 md:px-3 py-1.5 md:py-2 bg-surface text-ink border-b border-accent-sand/60 cursor-move select-none text-xs md:text-sm"
      bodyClassName="flex-1 overflow-auto"
    />
  );
}
