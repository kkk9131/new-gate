'use client';

import { useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { useDesktopStore, type App } from '@/store/desktopStore';
import { useChatStore } from '@/store/useChatStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import { AppLauncherIcon } from './AppLauncherIcon';
import { Dock } from './Dock';
import { WindowManager } from './WindowManager';
import { SplitMode } from './SplitMode';
import { UserMenu } from './UserMenu';
import { ChatSidebar } from './ChatSidebar';
import NotificationBell from '@/components/notifications/NotificationBell';
import BrowserNotificationPrompt from '@/components/notifications/BrowserNotificationPrompt';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import {
  RiMoonLine,
  RiSunLine,
  RiLayout2Line,
  RiLayout3Line,
  RiLayout4Line,
  RiLayoutLine,
  RiArrowGoBackLine,
  RiRobot2Line,
} from 'react-icons/ri';

// モバイル時のグリッド設定を定数化してマジックナンバーを回避
const MOBILE_ICON_GRID_CLASS = 'grid gap-3 pb-20 grid-cols-2 sm:grid-cols-3 min-[560px]:grid-cols-4';

export function DesktopLayout() {
  const apps = useDesktopStore((state) => state.apps);
  const updateAppPosition = useDesktopStore((state) => state.updateAppPosition);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const resetAppPositions = useDesktopStore((state) => state.resetAppPositions);
  const isDarkMode = useDesktopStore((state) => state.isDarkMode);
  const toggleDarkMode = useDesktopStore((state) => state.toggleDarkMode);
  const splitMode = useDesktopStore((state) => state.splitMode);
  const toggleSplitMode = useDesktopStore((state) => state.toggleSplitMode);

  const isSidebarOpen = useChatStore((state) => state.isSidebarOpen);
  const toggleSidebar = useChatStore((state) => state.toggleSidebar);

  // レスポンシブ対応：カスタムフックでモバイル判定
  const { isMobile } = useIsMobile();

  // ダークモード初期化（localStorageから復元）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <div
      className="h-screen overflow-hidden bg-gradient-to-br from-mist to-surface-strong dark:from-gray-900 dark:to-gray-800 transition-colors duration-300 flex flex-col"
      suppressHydrationWarning
    >
      {/* ヘッダー */}
      <header
        className="h-14 md:h-16 bg-surface/90 backdrop-blur-xl border-b border-white/40 flex items-center justify-between px-3 md:px-6 shadow-panel text-ink relative z-50 flex-shrink-0"
        suppressHydrationWarning
      >
        {/* 左側：ロゴ */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-accent-sand flex items-center justify-center shadow-soft text-ink">
            <span className="font-bold text-lg md:text-xl">N</span>
          </div>
          <h1 className="text-lg md:text-xl font-bold">
            New Gate
          </h1>
        </div>

        {/* 右側：分割ボタン + ダークモード切り替えボタン */}
        <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
          <button
            onClick={resetAppPositions}
            className="
              p-1.5 md:p-2 rounded-xl
              bg-surface border border-white/40
              hover:bg-cloud/20
              transition-colors duration-200
              shadow-soft hover:shadow-panel
            "
            aria-label="アイコン配置をリセット"
          >
            <RiArrowGoBackLine className="w-5 h-5 md:w-6 md:h-6 text-accent-sand" />
          </button>
          {/* 分割モードボタン */}
          <button
            onClick={toggleSplitMode}
            className="
              p-1.5 md:p-2 rounded-xl
              bg-surface border border-white/40
              hover:bg-cloud/20
              transition-colors duration-200
              shadow-soft hover:shadow-panel
            "
            aria-label="分割モード切り替え"
            suppressHydrationWarning
          >
            {splitMode === 1 && <RiLayoutLine className="w-5 h-5 md:w-6 md:h-6 text-accent-sand" />}
            {splitMode === 2 && <RiLayout2Line className="w-5 h-5 md:w-6 md:h-6 text-accent-sand" />}
            {splitMode === 3 && <RiLayout3Line className="w-5 h-5 md:w-6 md:h-6 text-accent-sand" />}
            {splitMode === 4 && <RiLayout4Line className="w-5 h-5 md:w-6 md:h-6 text-accent-sand" />}
          </button>

          {/* ダークモード切り替えボタン */}
          <button
            onClick={toggleDarkMode}
            className="
              p-1.5 md:p-2 rounded-xl
              bg-surface border border-white/40
              hover:bg-cloud/20
              transition-colors duration-200
              shadow-soft hover:shadow-panel
            "
            aria-label="ダークモード切り替え"
            suppressHydrationWarning
          >
            {isDarkMode ? (
              <RiSunLine className="w-5 h-5 md:w-6 md:h-6 text-accent-sand" />
            ) : (
              <RiMoonLine className="w-5 h-5 md:w-6 md:h-6 text-accent-sand" />
            )}
          </button>

          {/* Agent Toggle Button */}
          <button
            onClick={toggleSidebar}
            className={`
              p-1.5 md:p-2 rounded-xl
              border border-white/40
              transition-colors duration-200
              shadow-soft hover:shadow-panel
              ${isSidebarOpen ? 'bg-accent-sand text-ink' : 'bg-surface hover:bg-cloud/20'}
            `}
            aria-label="Toggle Agent Sidebar"
          >
            <RiRobot2Line className={`w-5 h-5 md:w-6 md:h-6 ${isSidebarOpen ? 'text-ink' : 'text-accent-sand'}`} />
          </button>

          {/* 通知アイコン */}
          <NotificationBell />

          {/* ユーザーメニュー */}
          <UserMenu />
        </div>
      </header>

      {/* メインエリア */}
      <div className="flex-1 relative overflow-hidden">
        <PanelGroup direction="horizontal" className="h-full w-full">
          {/* Main Content Panel */}
          {(!isMobile || !isSidebarOpen) && (
            <Panel 
              defaultSize={isSidebarOpen ? 75 : 100} 
              minSize={30} 
              className="relative"
            >
              <MainContent
                apps={apps}
                isMobile={isMobile}
                openWindow={openWindow}
                updateAppPosition={updateAppPosition}
              />
            </Panel>
          )}

          {/* Chat Sidebar Panel */}
          {isSidebarOpen && (
            <>
              {!isMobile && (
                <PanelResizeHandle className="w-1 bg-white/10 hover:bg-accent-sand/50 transition-colors" />
              )}
              <Panel 
                defaultSize={isMobile ? 100 : 25} 
                minSize={20} 
                maxSize={isMobile ? 100 : 40}
              >
                <ChatSidebar />
              </Panel>
            </>
          )}
        </PanelGroup>
      </div>

      {/* ブラウザ通知許可プロンプト */}
      <BrowserNotificationPrompt />
    </div>
  );
}

// MainContent Component to reduce duplication
interface MainContentProps {
  apps: App[];
  isMobile: boolean;
  openWindow: (appId: App['id']) => void;
  updateAppPosition: (appId: App['id'], position: { x: number; y: number }) => void;
}

function MainContent({ apps, isMobile, openWindow, updateAppPosition }: MainContentProps) {
  return (
    <main className="relative w-full h-full overflow-hidden flex flex-col">
      {/* スクロール可能なコンテンツエリア */}
      <div className="flex-1 relative w-full h-full overflow-auto p-3 md:p-6 lg:p-8 pb-24">
        {isMobile ? (
          /* モバイル：グリッドレイアウト */
          <div className={MOBILE_ICON_GRID_CLASS}>
            {apps.map((app) => (
              <MobileAppIcon
                key={app.id}
                app={app}
                onOpen={openWindow}
              />
            ))}
          </div>
        ) : (
          /* デスクトップ：ドラッグ可能なレイアウト */
          <div className="relative w-full h-full min-h-[400px]">
            {apps.map((app) => (
              <DesktopIcon
                key={app.id}
                app={app}
                onOpen={openWindow}
                onPositionChange={updateAppPosition}
              />
            ))}
          </div>
        )}

        <WindowManager />
      </div>

      {/* Dock（下部） */}
      <Dock />

      {/* 分割モード */}
      <SplitMode />
    </main>
  );
}

interface DesktopIconProps {
  app: App;
  onOpen: (appId: App['id']) => void;
  onPositionChange: (appId: App['id'], position: { x: number; y: number }) => void;
}

function DesktopIcon({ app, onOpen, onPositionChange }: DesktopIconProps) {
  const position = app.position ?? { x: 0, y: 0 };

  return (
    <Rnd
      size={{ width: 96, height: 120 }}
      position={{ x: position.x, y: position.y }}
      bounds="parent"
      enableResizing={false}
      dragAxis="both"
      onDragStop={(e, data) => onPositionChange(app.id, { x: data.x, y: data.y })}
      className="absolute"
    >
      <AppLauncherIcon
        name={app.name}
        icon={app.icon}
        color={app.color}
        onActivate={() => onOpen(app.id)}
        activation="double"
        containerClassName="p-2 md:p-4"
        iconWrapperClassName="w-12 h-12 md:w-16 md:h-16 group-hover:scale-110 group-hover:shadow-xl"
        iconClassName="w-6 h-6 md:w-8 md:h-8 transition-transform group-hover:scale-110"
        labelClassName="mt-1 md:mt-2 text-xs md:text-sm font-medium text-ink group-hover:text-ink transition-colors"
      />
    </Rnd>
  );
}

// モバイルアイコンコンポーネント（グリッドレイアウト用、ドラッグ不可）
interface MobileAppIconProps {
  app: App;
  onOpen: (appId: App['id']) => void;
}

function MobileAppIcon({ app, onOpen }: MobileAppIconProps) {
  return (
    <AppLauncherIcon
      name={app.name}
      icon={app.icon}
      color={app.color}
      onActivate={() => onOpen(app.id)}
      activation="single"
      containerClassName="p-2"
      iconWrapperClassName="w-12 h-12 active:scale-95"
      iconClassName="w-6 h-6"
      labelClassName="mt-1 text-xs font-medium text-ink text-center line-clamp-2"
    />
  );
}
