'use client';

import { useState } from 'react';
import { useDesktopStore, App } from '@/store/desktopStore';
import {
  RiFolderLine,
  RiSettingsLine,
  RiMoneyDollarCircleLine,
  RiStoreLine,
  RiRobotLine,
  RiDashboardLine,
  RiBarChartBoxLine,
  RiCalendarLine,
} from 'react-icons/ri';

// アイコン名とReactコンポーネントのマッピング
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  RiFolder: RiFolderLine,
  RiSettings: RiSettingsLine,
  RiMoneyDollar: RiMoneyDollarCircleLine,
  RiStore: RiStoreLine,
  RiRobot: RiRobotLine,
  RiDashboard: RiDashboardLine,
  RiBarChart: RiBarChartBoxLine,
  RiCalendar: RiCalendarLine,
};

export function Dock() {
  const apps = useDesktopStore((state) => state.apps);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Dockコンテナ */}
      <div
        className={`
          flex items-center gap-2 px-4 py-3
          bg-white/80 dark:bg-gray-800/80
          backdrop-blur-xl
          rounded-2xl
          shadow-2xl dark:shadow-gray-900/50
          border border-gray-200/50 dark:border-gray-700/50
          transition-all duration-300 ease-out
          pointer-events-auto
          ${isHovered ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}
        `}
      >
        {apps.map((app) => (
          <DockIcon key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}

// Dockアイコンコンポーネント
function DockIcon({ app }: { app: App }) {
  const [isHovered, setIsHovered] = useState(false);
  const openWindow = useDesktopStore((state) => state.openWindow);
  const IconComponent = iconMap[app.icon] || RiFolderLine;

  const handleClick = () => {
    openWindow(app.id);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ツールチップ */}
      {isHovered && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 animate-fade-in">
          <div className="px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
            {app.name}
          </div>
        </div>
      )}

      {/* アイコン */}
      <button
        onClick={handleClick}
        className={`
          w-12 h-12 rounded-xl
          bg-white dark:bg-gray-700
          shadow-md dark:shadow-gray-900/50
          flex items-center justify-center
          transition-all duration-200
          hover:scale-125 hover:shadow-lg
          active:scale-110
          ${isHovered ? 'scale-110' : 'scale-100'}
        `}
      >
        <IconComponent className={`w-6 h-6 ${app.color}`} />
      </button>
    </div>
  );
}
