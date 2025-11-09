'use client';

import { useDesktopStore } from '@/store/desktopStore';
import { RiCloseLine } from 'react-icons/ri';
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
import { Window } from './Window';

export function SplitMode() {
  const splitMode = useDesktopStore((state) => state.splitMode);
  const apps = useDesktopStore((state) => state.apps);
  const reorderApps = useDesktopStore((state) => state.reorderApps);
  const setSplitMode = useDesktopStore((state) => state.setSplitMode);

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
      <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900 flex">
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

        {/* 終了ボタン */}
        <button
          onClick={() => setSplitMode(1)}
          className="fixed top-4 right-4 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors z-10"
          aria-label="分割モード終了"
        >
          <RiCloseLine className="w-6 h-6" />
        </button>
      </div>
    );
  }

  // 3分割レイアウト（左50% + 右上25% + 右下25%）
  if (splitMode === 3) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900 flex">
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

        {/* 終了ボタン */}
        <button
          onClick={() => setSplitMode(1)}
          className="fixed top-4 right-4 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors z-10"
          aria-label="分割モード終了"
        >
          <RiCloseLine className="w-6 h-6" />
        </button>
      </div>
    );
  }

  // 4分割レイアウト（2x2グリッド）
  if (splitMode === 4) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900 grid grid-cols-2 grid-rows-2">
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

        {/* 終了ボタン */}
        <button
          onClick={() => setSplitMode(1)}
          className="fixed top-4 right-4 p-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors z-10"
          aria-label="分割モード終了"
        >
          <RiCloseLine className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return null;
}

// 個別スクリーンコンポーネント - 完全なデスクトップUI環境を提供
interface SplitScreenProps {
  screenId: string;
  sensors: any;
  handleDragEnd: (event: DragEndEvent) => void;
  className?: string;
}

function SplitScreen({ screenId, sensors, handleDragEnd, className = '' }: SplitScreenProps) {
  const apps = useDesktopStore((state) => state.apps);
  const screenWindows = useDesktopStore((state) => state.splitScreenWindows[screenId] || []);
  const openWindowInScreen = useDesktopStore((state) => state.openWindowInScreen);
  const closeWindowInScreen = useDesktopStore((state) => state.closeWindowInScreen);
  const minimizeWindowInScreen = useDesktopStore((state) => state.minimizeWindowInScreen);
  const maximizeWindowInScreen = useDesktopStore((state) => state.maximizeWindowInScreen);
  const bringToFrontInScreen = useDesktopStore((state) => state.bringToFrontInScreen);
  const updateWindowPositionInScreen = useDesktopStore((state) => state.updateWindowPositionInScreen);
  const updateWindowSizeInScreen = useDesktopStore((state) => state.updateWindowSizeInScreen);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* デスクトップエリア：アイコングリッド */}
      <div className="h-full overflow-auto p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={apps.map((app) => app.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-4 gap-3">
              {apps.map((app) => (
                <div
                  key={app.id}
                  onDoubleClick={() => openWindowInScreen(screenId, app.id)}
                >
                  <AppIcon
                    id={app.id}
                    name={app.name}
                    icon={app.icon}
                    color={app.color}
                  />
                </div>
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
            closeWindow={closeWindowInScreen}
            minimizeWindow={minimizeWindowInScreen}
            maximizeWindow={maximizeWindowInScreen}
            bringToFront={bringToFrontInScreen}
            updateWindowPosition={updateWindowPositionInScreen}
            updateWindowSize={updateWindowSizeInScreen}
          />
        ))}
      </div>
    </div>
  );
}

// スクリーン専用ウィンドウコンポーネント（通常のWindowと同様だが、スクリーンIDを使う）
interface ScreenWindowProps {
  window: any;
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
  const Rnd = require('react-rnd').Rnd;

  // 最小化されている場合は表示しない
  if (window.isMinimized) return null;

  // アプリコンポーネントのマッピング
  const appComponents: Record<string, React.ComponentType> = {
    dashboard: require('@/components/apps/DashboardApp').DashboardApp,
    projects: require('@/components/apps/ProjectsApp').ProjectsApp,
    settings: require('@/components/apps/SettingsApp').SettingsApp,
    revenue: require('@/components/apps/RevenueApp').RevenueApp,
    store: require('@/components/apps/StoreApp').StoreApp,
    agent: require('@/components/apps/AgentApp').AgentApp,
    analytics: require('@/components/apps/AnalyticsApp').AnalyticsApp,
    calendar: require('@/components/apps/CalendarApp').CalendarApp,
  };

  const AppComponent = appComponents[window.appId];

  return (
    <Rnd
      size={
        window.isMaximized
          ? { width: '100%', height: '100%' }
          : { width: window.size.width, height: window.size.height }
      }
      position={
        window.isMaximized
          ? { x: 0, y: 0 }
          : { x: window.position.x, y: window.position.y }
      }
      onDragStop={(e: any, d: any) => {
        if (!window.isMaximized) {
          updateWindowPosition(screenId, window.id, { x: d.x, y: d.y });
        }
      }}
      onResizeStop={(e: any, direction: any, ref: any, delta: any, position: any) => {
        if (!window.isMaximized) {
          updateWindowSize(screenId, window.id, {
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
          });
          updateWindowPosition(screenId, window.id, position);
        }
      }}
      minWidth={300}
      minHeight={200}
      bounds="parent"
      dragHandleClassName="window-drag-handle"
      style={{ zIndex: window.zIndex }}
      onMouseDown={() => bringToFront(screenId, window.id)}
      enableResizing={!window.isMaximized}
      disableDragging={window.isMaximized}
    >
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
        {/* タイトルバー */}
        <div className="window-drag-handle flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white cursor-move select-none">
          <h3 className="font-semibold text-sm">{window.title}</h3>

          {/* 制御ボタン */}
          <div className="flex items-center gap-1">
            {/* 最小化ボタン */}
            <button
              onClick={() => minimizeWindow(screenId, window.id)}
              className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded transition-colors"
              aria-label="最小化"
            >
              <span className="text-xs">_</span>
            </button>

            {/* 最大化/元に戻すボタン */}
            <button
              onClick={() => maximizeWindow(screenId, window.id)}
              className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded transition-colors"
              aria-label={window.isMaximized ? '元に戻す' : '最大化'}
            >
              <span className="text-xs">□</span>
            </button>

            {/* 閉じるボタン */}
            <button
              onClick={() => closeWindow(screenId, window.id)}
              className="w-6 h-6 flex items-center justify-center hover:bg-red-500 rounded transition-colors"
              aria-label="閉じる"
            >
              <span className="text-xs">×</span>
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-auto">
          {AppComponent ? <AppComponent /> : (
            <div className="p-4 text-center text-gray-600 dark:text-gray-400">
              アプリが見つかりません: {window.appId}
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
}
