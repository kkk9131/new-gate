'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDesktopStore } from '@/store/desktopStore';
import { type AppId } from './appRegistry';
import { AppLauncherIcon } from './AppLauncherIcon';

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

  // ダブルクリックでアプリ起動
  const handleDoubleClick = () => {
    if (onOpen) {
      onOpen(id);
      return;
    }
    openWindow(id);
  };

  return (
    <AppLauncherIcon
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      name={name}
      icon={icon}
      color={color}
      onActivate={handleDoubleClick}
      activation="double"
      containerClassName="p-2 md:p-4"
      iconWrapperClassName={`w-12 h-12 md:w-16 md:h-16 ${isDragging ? 'scale-95' : ''} group-hover:scale-110 group-hover:shadow-xl`}
      iconClassName="w-6 h-6 md:w-8 md:h-8 transition-transform group-hover:scale-110"
      labelClassName="mt-1 md:mt-2 text-xs md:text-sm font-medium text-ink group-hover:text-ink transition-colors"
    />
  );
}
