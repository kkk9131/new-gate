'use client';

import { useEffect } from 'react';
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDesktopStore } from '@/store/desktopStore';
import { AppIcon } from './AppIcon';
import { Dock } from './Dock';
import { WindowManager } from './WindowManager';
import { RiMoonLine, RiSunLine, RiSubtractLine } from 'react-icons/ri';

export function DesktopLayout() {
  const apps = useDesktopStore((state) => state.apps);
  const windows = useDesktopStore((state) => state.windows);
  const reorderApps = useDesktopStore((state) => state.reorderApps);
  const isDarkMode = useDesktopStore((state) => state.isDarkMode);
  const toggleDarkMode = useDesktopStore((state) => state.toggleDarkMode);
  const minimizeWindow = useDesktopStore((state) => state.minimizeWindow);
  const bringToFront = useDesktopStore((state) => state.bringToFront);

  // ドラッグ&ドロップのセンサー設定
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動したらドラッグ開始
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

  // ダークモード初期化（localStorageから復元）
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* ヘッダー */}
      <header className="h-16 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 flex items-center justify-between px-6 shadow-sm">
        {/* 左側：ロゴ + 開いているウィンドウタブ */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* ロゴ */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">N</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-white">
              New Gate
            </h1>
          </div>

          {/* ウィンドウタブ */}
          <div className="flex items-center gap-2 overflow-x-auto flex-1">
            {windows.filter(w => !w.isMinimized).map((window) => (
              <div
                key={window.id}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors group flex-shrink-0 cursor-pointer"
                onClick={() => bringToFront(window.id)}
              >
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {window.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    minimizeWindow(window.id);
                  }}
                  className="w-5 h-5 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 rounded transition-colors"
                  aria-label="最小化"
                >
                  <RiSubtractLine className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 右側：ダークモード切り替えボタン */}
        <button
          onClick={toggleDarkMode}
          className="
            p-2 rounded-xl
            bg-gray-100 dark:bg-gray-700
            hover:bg-gray-200 dark:hover:bg-gray-600
            transition-colors duration-200
            shadow-sm hover:shadow-md
            flex-shrink-0
          "
          aria-label="ダークモード切り替え"
        >
          {isDarkMode ? (
            <RiSunLine className="w-6 h-6 text-yellow-400" />
          ) : (
            <RiMoonLine className="w-6 h-6 text-gray-600" />
          )}
        </button>
      </header>

      {/* デスクトップエリア */}
      <main className="h-[calc(100vh-4rem)] overflow-auto p-8 relative">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={apps.map((app) => app.id)} strategy={rectSortingStrategy}>
            {/* アプリアイコングリッド */}
            <div className="grid grid-cols-8 gap-4 max-w-7xl mx-auto">
              {apps.map((app) => (
                <AppIcon
                  key={app.id}
                  id={app.id}
                  name={app.name}
                  icon={app.icon}
                  color={app.color}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* ウィンドウ管理エリア */}
        <WindowManager />
      </main>

      {/* Dock（下部） */}
      <Dock />
    </div>
  );
}
