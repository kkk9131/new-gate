'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clsx } from 'clsx';

type AppOption = {
  id: string;
  label: string;
  description: string;
};

const APPS: AppOption[] = [
  { id: 'projects', label: 'Projects', description: 'プロジェクト管理' },
  { id: 'calendar', label: 'Calendar', description: '予定管理' },
  { id: 'revenue', label: 'Revenue', description: '売上管理' },

];

interface Props {
  anchorRef: React.RefObject<HTMLTextAreaElement>;
  onSelect: (appId: string) => void;
  visible: boolean;
  keyword: string;
}

export function AppMentionMenu({ anchorRef, onSelect, visible, keyword }: Props) {
  const [position, setPosition] = useState<{ bottom: number; left: number }>({ bottom: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const k = keyword.toLowerCase();
    return APPS.filter((app) => app.id.includes(k) || app.label.toLowerCase().includes(k) || app.description.includes(k));
  }, [keyword]);

  useEffect(() => {
    if (!anchorRef.current || !visible) return;
    const rect = anchorRef.current.getBoundingClientRect();
    // 入力欄の上に表示する (bottom positioning)
    // window.innerHeight - rect.top で入力欄の上端からの距離を計算
    setPosition({ bottom: window.innerHeight - rect.top + 8, left: rect.left + 8 });
  }, [anchorRef, visible, keyword]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] bg-surface border border-white/20 rounded-lg shadow-lg p-2 min-w-[220px] pointer-events-auto"
      style={{ bottom: position.bottom, left: position.left }}
    >
      {filtered.length === 0 && (
        <div className="text-xs text-ink/50 px-2 py-1">該当なし</div>
      )}
      {filtered.map((app) => (
        <button
          key={app.id}
          onClick={() => onSelect(app.id)}
          className={clsx(
            'w-full text-left px-2 py-1 rounded-md text-sm hover:bg-accent-sand/20 text-ink'
          )}
        >
          <div className="font-semibold">@{app.id}</div>
          <div className="text-xs text-ink/60">{app.description}</div>
        </button>
      ))}
    </div>
  );
}
