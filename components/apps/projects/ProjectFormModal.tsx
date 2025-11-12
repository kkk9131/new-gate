'use client';

import { useState, useEffect } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import type { ProjectStatus, ProjectFormData } from '@/types/project';

type ProjectFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  initialData?: Partial<ProjectFormData>;
  mode: 'create' | 'edit';
};

export function ProjectFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: ProjectFormModalProps) {
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    notes: '',
    status: 'planning',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初期データを設定
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        start_date: initialData.start_date || '',
        end_date: initialData.end_date || '',
        notes: initialData.notes || '',
        status: initialData.status || 'planning',
      });
    }
  }, [initialData]);

  // モーダルが閉じられたらフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        notes: '',
        status: 'planning',
      });
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-surface border border-cloud/20 rounded-lg w-full max-w-2xl my-auto flex flex-col overflow-hidden max-h-[calc(100vh-2rem)]">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-cloud/20 flex-shrink-0">
          <h3 className="text-lg font-bold text-ink">
            {mode === 'create' ? 'プロジェクト新規作成' : 'プロジェクト編集'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-cloud hover:bg-cloud/20 transition-colors"
            aria-label="閉じる"
          >
            <RiCloseLine className="w-4 h-4" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 bg-accent-sand/10 border border-accent-sand/30 rounded-lg text-accent-sand text-sm">
              {error}
            </div>
          )}

          {/* プロジェクト名 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-ink mb-2">
              プロジェクト名 <span className="text-accent-sand">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-lg text-ink placeholder-cloud focus:outline-none focus:ring-2 focus:ring-accent-sand"
              placeholder="例: Webサイトリニューアル"
              required
            />
          </div>

          {/* 説明 */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-ink mb-2">
              説明
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-lg text-ink placeholder-cloud focus:outline-none focus:ring-2 focus:ring-accent-sand resize-none"
              placeholder="プロジェクトの詳細説明"
            />
          </div>

          {/* 期間 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-ink mb-2">
                開始日 <span className="text-accent-sand">*</span>
              </label>
              <input
                type="date"
                id="start_date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
                required
              />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-ink mb-2">
                終了日
              </label>
              <input
                type="date"
                id="end_date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
              />
            </div>
          </div>

          {/* 備考 */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-ink mb-2">
              備考
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-lg text-ink placeholder-cloud focus:outline-none focus:ring-2 focus:ring-accent-sand resize-none"
              placeholder="メモや補足情報"
            />
          </div>

          {/* ステータス */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-ink mb-2">
              ステータス
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-lg text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
            >
              <option value="planning">企画</option>
              <option value="active">進行中</option>
              <option value="completed">完了</option>
              <option value="on_hold">保留</option>
            </select>
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-mist border border-cloud/30 text-ink rounded-full hover:bg-cloud/10 transition-colors"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-accent-sand text-ink rounded-full hover:bg-accent-sand/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : mode === 'create' ? '作成' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
