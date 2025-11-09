'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

interface AppIconProps {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export function AppIcon({ id, name, icon, color }: AppIconProps) {
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
  const IconComponent = iconMap[icon] || RiFolderLine;

  // ダブルクリックでアプリ起動（今回は機能なしなのでログのみ）
  const handleDoubleClick = () => {
    console.log(`アプリ起動: ${name}`);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onDoubleClick={handleDoubleClick}
      className="flex flex-col items-center justify-center p-4 cursor-pointer select-none group"
    >
      {/* アイコン */}
      <div
        className={`
          w-16 h-16 rounded-2xl
          bg-white dark:bg-gray-800
          shadow-lg dark:shadow-gray-900/50
          flex items-center justify-center
          transition-all duration-200
          group-hover:scale-110 group-hover:shadow-xl
          ${isDragging ? 'scale-95' : ''}
        `}
      >
        <IconComponent
          className={`w-8 h-8 ${color} transition-transform group-hover:scale-110`}
        />
      </div>

      {/* アプリ名 */}
      <span
        className="
          mt-2 text-sm font-medium
          text-gray-700 dark:text-gray-300
          group-hover:text-gray-900 dark:group-hover:text-white
          transition-colors
        "
      >
        {name}
      </span>
    </div>
  );
}
