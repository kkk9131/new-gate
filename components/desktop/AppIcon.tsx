'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDesktopStore } from '@/store/desktopStore';
import { type AppId } from './appRegistry';
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
export const appIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  RiFolder: RiFolderLine,
  RiSettings: RiSettingsLine,
  RiMoneyDollar: RiMoneyDollarCircleLine,
  RiStore: RiStoreLine,
  RiRobot: RiRobotLine,
  RiDashboard: RiDashboardLine,
  RiBarChart: RiBarChartBoxLine,
  RiCalendar: RiCalendarLine,
};

interface AppIconProps {
  id: AppId;
  name: string;
  icon: string;
  color: string;
  onOpen?: (appId: AppId) => void;
}

export function AppIcon({ id, name, icon, color, onOpen }: AppIconProps) {
  const openWindow = useDesktopStore((state) => state.openWindow);

  // ドラッグ&ドロップ機能（@dnd-kit/sortable使用）
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // ドラッグ時のスタイル変換
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // アイコンコンポーネントの取得
  const IconComponent = appIconMap[icon] || RiFolderLine;

  // ダブルクリックでアプリ起動
  const handleDoubleClick = () => {
    if (onOpen) {
      onOpen(id);
      return;
    }
    openWindow(id);
  };

  // キーボード操作対応
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleDoubleClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${name}アプリを起動`}
      className="flex flex-col items-center justify-center p-2 md:p-4 cursor-pointer select-none group"
    >
      {/* アイコン */}
      <div
        className={`
          w-12 h-12 md:w-16 md:h-16 rounded-2xl
          bg-surface
          shadow-panel
          flex items-center justify-center
          transition-all duration-200
          group-hover:scale-110 group-hover:shadow-xl
          ${isDragging ? 'scale-95' : ''}
        `}
      >
        <IconComponent
          className={`w-6 h-6 md:w-8 md:h-8 ${color} transition-transform group-hover:scale-110`}
        />
      </div>

      {/* アプリ名 */}
      <span
        className="
          mt-1 md:mt-2 text-xs md:text-sm font-medium
          text-ink
          group-hover:text-ink
          transition-colors
        "
      >
        {name}
      </span>
    </div>
  );
}
