'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RiCheckLine } from 'react-icons/ri';
import type { ProjectStatus } from '@/types/project';
import { statusLabel, statusStyle } from '@/types/project';

type ProjectStatusMenuProps = {
  currentStatus: ProjectStatus;
  onChange: (status: ProjectStatus) => void;
  size?: 'sm' | 'md';
};

export function ProjectStatusMenu({ currentStatus, onChange, size = 'md' }: ProjectStatusMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const statuses: ProjectStatus[] = ['planning', 'active', 'completed', 'on_hold'];

  // クライアントサイドでマウント済みかチェック
  useEffect(() => {
    setMounted(true);
  }, []);

  // ボタンクリック時に位置を更新
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const newPosition = {
        top: rect.bottom + 8, // ボタンの下に8px余白
        left: rect.left,
      };
      setPosition(newPosition);
    }
    setIsOpen(!isOpen);
  };

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(target);
      const isOutsideButton = buttonRef.current && !buttonRef.current.contains(target);

      if (isOutsideMenu && isOutsideButton) {
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

  const dropdownMenu = isOpen && mounted ? (
    <div
      ref={menuRef}
      className="fixed w-36 bg-white border-2 border-ink/20 rounded-2xl shadow-floating overflow-hidden z-modal"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => handleSelect(status)}
          className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-mist/50 transition-colors text-left ${
            status === currentStatus ? 'bg-mist/30' : ''
          }`}
        >
          <span className={statusStyle[status]}>{statusLabel[status]}</span>
          {status === currentStatus && <RiCheckLine className="w-4 h-4 text-accent-sand" />}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`${buttonClass} rounded-full ${statusStyle[currentStatus]} bg-mist hover:bg-cloud/20 transition-colors border border-cloud/30`}
        type="button"
      >
        {statusLabel[currentStatus]}
      </button>

      {mounted && typeof document !== 'undefined' && createPortal(dropdownMenu, document.body)}
    </>
  );
}
