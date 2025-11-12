'use client';

import { useEffect, useState } from 'react';
import { Rnd } from 'react-rnd';
import { useDesktopStore, type App } from '@/store/desktopStore';
import { appIconMap } from './AppIcon';
import { Dock } from './Dock';
import { WindowManager } from './WindowManager';
import { SplitMode } from './SplitMode';
import { UserMenu } from './UserMenu';
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
} from 'react-icons/ri';

export function DesktopLayout() {
  const apps = useDesktopStore((state) => state.apps);
  const updateAppPosition = useDesktopStore((state) => state.updateAppPosition);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const resetAppPositions = useDesktopStore((state) => state.resetAppPositions);
  const isDarkMode = useDesktopStore((state) => state.isDarkMode);
  const toggleDarkMode = useDesktopStore((state) => state.toggleDarkMode);
  const splitMode = useDesktopStore((state) => state.splitMode);
  const toggleSplitMode = useDesktopStore((state) => state.toggleSplitMode);

  // レスポンシブ対応：画面幅を監視
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // 初期チェック
    checkMobile();

    // リサイズイベントリスナー
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ダークモード初期化（localStorageから復元）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-mist to-surface-strong dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      {/* ヘッダー */}
      <header className="h-14 md:h-16 bg-surface/90 backdrop-blur-xl border-b border-white/40 flex items-center justify-between px-3 md:px-6 shadow-panel text-ink relative z-50">
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
          >
            {isDarkMode ? (
              <RiSunLine className="w-5 h-5 md:w-6 md:h-6 text-accent-sand" />
            ) : (
              <RiMoonLine className="w-5 h-5 md:w-6 md:h-6 text-accent-sand" />
            )}
          </button>

          {/* 通知アイコン */}
          <NotificationBell />

          {/* ユーザーメニュー */}
          <UserMenu />
        </div>
      </header>

      {/* デスクトップエリア */}
      <main className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] overflow-auto p-3 md:p-6 lg:p-8 relative">
        {isMobile ? (
          /* モバイル：グリッドレイアウト */
          <div className="grid grid-cols-4 gap-3 pb-20">
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
      </main>

      {/* Dock（下部） */}
      <Dock />

      {/* 分割モード */}
      <SplitMode />

      {/* ブラウザ通知許可プロンプト */}
      <BrowserNotificationPrompt />
    </div>
  );
}

// デスクトップアイコンのサイズ（レスポンシブ用の定数）
const ICON_WRAPPER_WIDTH = 80;  // モバイル: 80px
const ICON_WRAPPER_HEIGHT = 100; // モバイル: 100px
const ICON_WRAPPER_WIDTH_MD = 96;  // デスクトップ: 96px
const ICON_WRAPPER_HEIGHT_MD = 120; // デスクトップ: 120px

interface DesktopIconProps {
  app: App;
  onOpen: (appId: App['id']) => void;
  onPositionChange: (appId: App['id'], position: { x: number; y: number }) => void;
}

function DesktopIcon({ app, onOpen, onPositionChange }: DesktopIconProps) {
  const IconComponent = appIconMap[app.icon] || appIconMap['RiFolder'];
  const position = app.position ?? { x: 0, y: 0 };

  const handleDoubleClick = () => onOpen(app.id);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDoubleClick();
    }
  };

  return (
    <Rnd
      size={{ width: ICON_WRAPPER_WIDTH, height: ICON_WRAPPER_HEIGHT }}
      position={{ x: position.x, y: position.y }}
      bounds="parent"
      enableResizing={false}
      dragAxis="both"
      onDragStop={(e, data) => onPositionChange(app.id, { x: data.x, y: data.y })}
      className="absolute"
    >
      <div
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${app.name}アプリを起動`}
        className="flex flex-col items-center justify-center p-2 md:p-4 cursor-pointer select-none group"
      >
        <div
          className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-surface shadow-panel flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-xl"
        >
          <IconComponent className={`w-6 h-6 md:w-8 md:h-8 ${app.color} transition-transform group-hover:scale-110`} />
        </div>
        <span className="mt-1 md:mt-2 text-xs md:text-sm font-medium text-ink group-hover:text-ink transition-colors">
          {app.name}
        </span>
      </div>
    </Rnd>
  );
}

// モバイルアイコンコンポーネント（グリッドレイアウト用、ドラッグ不可）
interface MobileAppIconProps {
  app: App;
  onOpen: (appId: App['id']) => void;
}

function MobileAppIcon({ app, onOpen }: MobileAppIconProps) {
  const IconComponent = appIconMap[app.icon] || appIconMap['RiFolder'];

  const handleClick = () => onOpen(app.id);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${app.name}アプリを起動`}
      className="flex flex-col items-center justify-center p-2 cursor-pointer select-none group"
    >
      <div
        className="w-12 h-12 rounded-2xl bg-surface shadow-panel flex items-center justify-center transition-all duration-200 active:scale-95"
      >
        <IconComponent className={`w-6 h-6 ${app.color}`} />
      </div>
      <span className="mt-1 text-xs font-medium text-ink text-center line-clamp-2">
        {app.name}
      </span>
    </div>
  );
}
