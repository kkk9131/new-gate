'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useDesktopStore, type App } from '@/store/desktopStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useElementSize } from '@/hooks/useElementSize';
import { AppLauncherIcon } from './AppLauncherIcon';
import { Dock } from './Dock';
import { WindowManager } from './WindowManager';
import { SplitMode } from './SplitMode';
import { UserMenu } from './UserMenu';
import { ChatPanel } from './ChatPanel';
import NotificationBell from '@/components/notifications/NotificationBell';
import BrowserNotificationPrompt from '@/components/notifications/BrowserNotificationPrompt';
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
  const openWindow = useDesktopStore((state) => state.openWindow);
  const resetAppPositions = useDesktopStore((state) => state.resetAppPositions);
  const isDarkMode = useDesktopStore((state) => state.isDarkMode);
  const toggleDarkMode = useDesktopStore((state) => state.toggleDarkMode);
  const splitMode = useDesktopStore((state) => state.splitMode);
  const toggleSplitMode = useDesktopStore((state) => state.toggleSplitMode);
  const isChatOpen = useDesktopStore((state) => state.isChatOpen);
  const toggleChat = useDesktopStore((state) => state.toggleChat);

  // レスポンシブ対応：カスタムフックでモバイル判定
  const { isMobile } = useIsMobile();
  const { ref: desktopHostRef, width: desktopHostWidth } = useElementSize<HTMLDivElement>();
  const desktopBaseWidthRef = useRef<number | null>(null);

  // ダークモード初期化（localStorageから復元）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const desktopScale = useMemo(() => {
    if (isMobile) {
      desktopBaseWidthRef.current = null;
      return 1;
    }

    if (!desktopHostWidth) {
      return 1;
    }

    const prevBase = desktopBaseWidthRef.current;

    if (!prevBase || desktopHostWidth > prevBase || !isChatOpen) {
      desktopBaseWidthRef.current = desktopHostWidth;
      return 1;
    }

    const scaleValue = Number((desktopHostWidth / prevBase).toFixed(4));
    return scaleValue >= 1 ? 1 : scaleValue;
  }, [desktopHostWidth, isChatOpen, isMobile]);

  const layoutGap = !isMobile && isChatOpen ? 16 : 0;

  return (
    <div
      className="h-screen overflow-hidden bg-gradient-to-br from-mist to-surface-strong dark:from-gray-900 dark:to-gray-800 transition-colors duration-300"
      suppressHydrationWarning
    >
      <div
        className="flex h-full transition-[gap] duration-200 ease-out"
        style={{ gap: layoutGap ? `${layoutGap}px` : undefined }}
      >
        <div className="flex flex-1 flex-col min-w-0 min-h-0">
        {/* ヘッダー */}
        <header
          className="h-14 md:h-16 bg-surface/90 backdrop-blur-xl border-b border-white/40 flex items-center justify-between px-3 md:px-6 shadow-panel text-ink relative z-50"
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

          {/* 右側：各種操作 */}
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

            {/* AIボタン（チャットペイン） */}
            <button
              type="button"
              onClick={toggleChat}
              aria-pressed={isChatOpen}
              className={`
                inline-flex items-center gap-1 md:gap-2 rounded-xl border border-white/40 px-3 py-1.5 md:px-4 md:py-2 text-sm font-semibold
                bg-surface text-ink hover:bg-cloud/20 transition-all duration-200 shadow-soft hover:shadow-panel
                focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-sand/60
              `}
            >
              <RiRobot2Line className="h-4 w-4" />
              <span>AI</span>
            </button>

            {/* 通知アイコン */}
            <NotificationBell />

            {/* ユーザーメニュー */}
            <UserMenu />
          </div>
        </header>

        {/* デスクトップエリア */}
        <main
          className="relative flex-1 min-h-0 overflow-auto p-3 md:p-6 lg:p-8"
          suppressHydrationWarning
        >
          {isMobile ? (
            <>
              <div className={MOBILE_ICON_GRID_CLASS}>
                {apps.map((app) => (
                  <MobileAppIcon
                    key={app.id}
                    app={app}
                    onOpen={openWindow}
                  />
                ))}
              </div>
              <WindowManager />
            </>
          ) : (
            <div ref={desktopHostRef} className="relative w-full h-full min-h-[400px]">
              <SplitMode className="h-full w-full" scale={desktopScale} />
            </div>
          )}
        </main>

        {/* Dock（下部） */}
        <Dock />

        {/* ブラウザ通知許可プロンプト */}
        <BrowserNotificationPrompt />
        </div>

        <ChatPanel />
      </div>
    </div>
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
