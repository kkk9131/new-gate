'use client';

import { useState, useEffect, useRef } from 'react';
import { RiEditLine, RiDeleteBinLine } from 'react-icons/ri';

type ProjectActionsMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
};

export function ProjectActionsMenu({ onEdit, onDelete }: ProjectActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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

  const handleEdit = () => {
    setIsOpen(false);
    onEdit();
  };

  const handleDelete = () => {
    setIsOpen(false);
    onDelete();
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full text-cloud hover:bg-cloud/20 transition-colors"
        title="その他"
        aria-label="その他のオプション"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <circle cx="10" cy="5" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="15" r="1.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-surface border border-white/40 rounded-2xl shadow-soft overflow-hidden z-10">
          <button
            onClick={handleEdit}
            className="w-full flex items-center gap-3 px-4 py-3 text-ink hover:bg-mist transition-colors text-left"
          >
            <RiEditLine className="w-4 h-4 text-cloud" />
            <span className="text-sm">編集</span>
          </button>
          <button
            onClick={handleDelete}
            className="w-full flex items-center gap-3 px-4 py-3 text-accent-sand hover:bg-accent-sand/10 transition-colors text-left border-t border-cloud/10"
          >
            <RiDeleteBinLine className="w-4 h-4" />
            <span className="text-sm">削除</span>
          </button>
        </div>
      )}
    </div>
  );
}
