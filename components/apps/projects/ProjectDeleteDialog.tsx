'use client';

import { useState } from 'react';
import { RiAlertLine } from 'react-icons/ri';

type ProjectDeleteDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  projectName: string;
};

export function ProjectDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  projectName,
}: ProjectDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      console.error('削除エラー:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-surface border border-cloud/20 rounded-lg w-full max-w-md my-auto overflow-hidden max-h-[calc(100vh-2rem)]">
        {/* アイコン */}
        <div className="flex justify-center pt-6">
          <div className="w-16 h-16 bg-accent-sand/10 rounded-full flex items-center justify-center">
            <RiAlertLine className="w-8 h-8 text-accent-sand" />
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 text-center">
          <h3 className="text-lg font-bold text-ink mb-2">プロジェクトを削除</h3>
          <p className="text-cloud text-sm mb-4">
            「<span className="font-semibold text-ink">{projectName}</span>」を削除してもよろしいですか？
          </p>
          <p className="text-cloud text-xs">
            この操作は取り消すことができません。
          </p>
        </div>

        {/* ボタン */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-2 bg-mist border border-cloud/30 text-ink rounded-full hover:bg-cloud/10 transition-colors"
            disabled={isDeleting}
          >
            キャンセル
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-6 py-2 bg-accent-sand text-ink rounded-full hover:bg-accent-sand/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isDeleting}
          >
            {isDeleting ? '削除中...' : '削除'}
          </button>
        </div>
      </div>
    </div>
  );
}
