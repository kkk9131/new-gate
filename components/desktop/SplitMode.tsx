'use client';

import { useDesktopStore } from '@/store/desktopStore';
import { RiCloseLine } from 'react-icons/ri';

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

export function SplitMode() {
  const splitMode = useDesktopStore((state) => state.splitMode);
  const splitScreens = useDesktopStore((state) => state.splitScreens);
  const apps = useDesktopStore((state) => state.apps);
  const setSplitScreen = useDesktopStore((state) => state.setSplitScreen);
  const setSplitMode = useDesktopStore((state) => state.setSplitMode);

  // 通常モードなら表示しない
  if (splitMode === 1) return null;

  // 2分割レイアウト
  if (splitMode === 2) {
    return (
      <div className="fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900 flex">
        {/* 左画面 */}
        <SplitScreen
          position="left"
          appId={splitScreens.left}
          apps={apps}
          setSplitScreen={setSplitScreen}
          className="w-1/2 border-r border-gray-300 dark:border-gray-700"
        />

        {/* 右画面 */}
        <SplitScreen
          position="right"
          appId={splitScreens.right}
          apps={apps}
          setSplitScreen={setSplitScreen}
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
          position="left"
          appId={splitScreens.left}
          apps={apps}
          setSplitScreen={setSplitScreen}
          className="w-1/2 border-r border-gray-300 dark:border-gray-700"
        />

        {/* 右側2分割 */}
        <div className="w-1/2 flex flex-col">
          {/* 右上画面 */}
          <SplitScreen
            position="topRight"
            appId={splitScreens.topRight}
            apps={apps}
            setSplitScreen={setSplitScreen}
            className="h-1/2 border-b border-gray-300 dark:border-gray-700"
          />

          {/* 右下画面 */}
          <SplitScreen
            position="bottomRight"
            appId={splitScreens.bottomRight}
            apps={apps}
            setSplitScreen={setSplitScreen}
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
          position="topLeft"
          appId={splitScreens.topLeft}
          apps={apps}
          setSplitScreen={setSplitScreen}
          className="border-r border-b border-gray-300 dark:border-gray-700"
        />

        {/* 右上画面 */}
        <SplitScreen
          position="topRight"
          appId={splitScreens.topRight}
          apps={apps}
          setSplitScreen={setSplitScreen}
          className="border-b border-gray-300 dark:border-gray-700"
        />

        {/* 左下画面 */}
        <SplitScreen
          position="bottomLeft"
          appId={splitScreens.bottomLeft}
          apps={apps}
          setSplitScreen={setSplitScreen}
          className="border-r border-gray-300 dark:border-gray-700"
        />

        {/* 右下画面 */}
        <SplitScreen
          position="bottomRight"
          appId={splitScreens.bottomRight}
          apps={apps}
          setSplitScreen={setSplitScreen}
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

// 個別スクリーンコンポーネント
interface SplitScreenProps {
  position: string;
  appId: string | null;
  apps: any[];
  setSplitScreen: (position: string, appId: string | null) => void;
  className?: string;
}

function SplitScreen({ position, appId, apps, setSplitScreen, className = '' }: SplitScreenProps) {
  const AppComponent = appId ? appComponents[appId] : null;

  return (
    <div className={`relative ${className}`}>
      {/* アプリ選択ドロップダウン */}
      <div className="absolute top-4 left-4 z-10">
        <select
          value={appId || ''}
          onChange={(e) => setSplitScreen(position, e.target.value || null)}
          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-800 dark:text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">アプリを選択...</option>
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name}
            </option>
          ))}
        </select>
      </div>

      {/* アプリコンテンツ */}
      <div className="h-full overflow-hidden">
        {AppComponent ? (
          <AppComponent />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
            アプリを選択してください
          </div>
        )}
      </div>
    </div>
  );
}
