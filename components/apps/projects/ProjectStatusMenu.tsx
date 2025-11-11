'use client';

import { useState, useEffect, useRef } from 'react';
import { RiCheckLine } from 'react-icons/ri';

type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold';

const statusLabel: Record<ProjectStatus, string> = {
  planning: '企画',
  active: '進行中',
  completed: '完了',
  on_hold: '保留',
};

const statusStyle: Record<ProjectStatus, string> = {
  planning: 'text-accent-sand',
  active: 'text-ink',
  completed: 'text-cloud',
  on_hold: 'text-cloud',
};

type ProjectStatusMenuProps = {
  currentStatus: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
  size?: 'sm' | 'md';
};

export function ProjectStatusMenu({ currentStatus, onChange, size = 'md' }: ProjectStatusMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const statuses: ProjectStatus[] = ['planning', 'active', 'completed', 'on_hold'];

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (status: ProjectStatus) => {
    setIsOpen(false);
    onChange(status);
  };

  const buttonClass =
    size === 'sm'
      ? 'text-xs px-2 py-1'
      : 'text-xs px-3 py-1';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`${buttonClass} rounded-full ${statusStyle[currentStatus]} bg-mist hover:bg-cloud/20 transition-colors border border-cloud/30`}
        type="button"
      >
        {statusLabel[currentStatus]}
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-32 bg-surface border border-white/40 rounded-2xl shadow-soft overflow-hidden z-20">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => handleSelect(status)}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-mist transition-colors text-left ${
                status === currentStatus ? 'bg-mist' : ''
              }`}
            >
              <span className={statusStyle[status]}>{statusLabel[status]}</span>
              {status === currentStatus && <RiCheckLine className="w-4 h-4 text-accent-sand" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
