'use client';

import { Rnd } from 'react-rnd';
import { useDesktopStore, WindowState } from '@/store/desktopStore';
import { RiCloseLine, RiSubtractLine, RiCheckboxBlankLine, RiCheckboxMultipleLine } from 'react-icons/ri';

// アプリコンポーネントのマッピング
import { DashboardApp } from '@/components/apps/DashboardApp';
import { ProjectsApp } from '@/components/apps/ProjectsApp';
import { SettingsApp } from '@/components/apps/SettingsApp';
import { RevenueApp } from '@/components/apps/RevenueApp';
import { StoreApp } from '@/components/apps/StoreApp';
import { AgentApp } from '@/components/apps/AgentApp';
import { AnalyticsApp } from '@/components/apps/AnalyticsApp';
import { CalendarApp } from '@/components/apps/CalendarApp';

const appComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardApp,
  projects: ProjectsApp,
  settings: SettingsApp,
  revenue: RevenueApp,
  store: StoreApp,
  agent: AgentApp,
  analytics: AnalyticsApp,
  calendar: CalendarApp,
};

interface WindowProps {
  window: WindowState;
}

export function Window({ window }: WindowProps) {
  const closeWindow = useDesktopStore((state) => state.closeWindow);
  const minimizeWindow = useDesktopStore((state) => state.minimizeWindow);
  const maximizeWindow = useDesktopStore((state) => state.maximizeWindow);
  const bringToFront = useDesktopStore((state) => state.bringToFront);
  const updateWindowPosition = useDesktopStore((state) => state.updateWindowPosition);
  const updateWindowSize = useDesktopStore((state) => state.updateWindowSize);

  // 最小化されている場合は表示しない
  if (window.isMinimized) return null;

  // アプリコンポーネントを取得
  const AppComponent = appComponents[window.appId];

  // 最大化時は親要素全体を覆う
  const maximizedSize = { width: '100%', height: '100%' } as const;

  return (
    <Rnd
      size={
        window.isMaximized
          ? maximizedSize
          : { width: window.size.width, height: window.size.height }
      }
      position={
        window.isMaximized
          ? { x: 0, y: 0 }
          : { x: window.position.x, y: window.position.y }
      }
      onDragStop={(e, d) => {
        if (!window.isMaximized) {
          updateWindowPosition(window.id, { x: d.x, y: d.y });
        }
      }}
      onResizeStop={(e, direction, ref, delta, position) => {
        if (!window.isMaximized) {
          updateWindowSize(window.id, {
            width: parseInt(ref.style.width),
            height: parseInt(ref.style.height),
          });
          updateWindowPosition(window.id, position);
        }
      }}
      minWidth={400}
      minHeight={300}
      bounds="parent"
      dragHandleClassName="window-drag-handle"
      style={{ zIndex: window.zIndex }}
      onMouseDown={() => bringToFront(window.id)}
      enableResizing={!window.isMaximized}
      disableDragging={window.isMaximized}
    >
      <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {/* タイトルバー */}
        <div className="window-drag-handle flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white cursor-move select-none">
          <h3 className="font-semibold">{window.title}</h3>

          {/* 制御ボタン */}
          <div className="flex items-center gap-2">
            {/* 最小化ボタン */}
            <button
              onClick={() => minimizeWindow(window.id)}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
              aria-label="最小化"
            >
              <RiSubtractLine className="w-5 h-5" />
            </button>

            {/* 最大化/元に戻すボタン */}
            <button
              onClick={() => maximizeWindow(window.id)}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors"
              aria-label={window.isMaximized ? '元に戻す' : '最大化'}
            >
              {window.isMaximized ? (
                <RiCheckboxMultipleLine className="w-5 h-5" />
              ) : (
                <RiCheckboxBlankLine className="w-5 h-5" />
              )}
            </button>

            {/* 閉じるボタン */}
            <button
              onClick={() => closeWindow(window.id)}
              className="w-8 h-8 flex items-center justify-center hover:bg-red-500 rounded-lg transition-colors"
              aria-label="閉じる"
            >
              <RiCloseLine className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* コンテンツエリア */}
        <div className="flex-1 overflow-hidden">
          {AppComponent ? <AppComponent /> : (
            <div className="p-6 text-center text-gray-600 dark:text-gray-400">
              アプリが見つかりません: {window.appId}
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
}
