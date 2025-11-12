'use client';

import { useState, useEffect } from 'react';
import { RiCloseLine } from 'react-icons/ri';

type TargetFormData = {
  title: string;
  target_amount: number;
  start_date: string;
  end_date: string;
  description: string;
  project_id: string;
};

type TargetFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TargetFormData) => Promise<void>;
  initialData?: Partial<TargetFormData>;
  mode: 'create' | 'edit';
};

/**
 * 目標設定フォームモーダル
 * - タイトル、目標金額、期間、プロジェクト選択
 */
export function TargetFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: TargetFormModalProps) {
  const [formData, setFormData] = useState<TargetFormData>({
    title: '',
    target_amount: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    description: '',
    project_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  // プロジェクト一覧を取得
  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects?limit=100');
      if (response.ok) {
        const result = await response.json();
        setProjects(result.data || []);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  // 初期データを設定
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        target_amount: initialData.target_amount || 0,
        start_date: initialData.start_date || new Date().toISOString().split('T')[0],
        end_date: initialData.end_date || '',
        description: initialData.description || '',
        project_id: initialData.project_id || '',
      });
    }
  }, [initialData]);

  // モーダルが閉じられたらフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        target_amount: 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        description: '',
        project_id: '',
      });
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // バリデーション
      if (!formData.title) {
        throw new Error('タイトルを入力してください');
      }
      if (formData.target_amount <= 0) {
        throw new Error('目標金額は0より大きい値を入力してください');
      }
      if (!formData.end_date) {
        throw new Error('終了日を入力してください');
      }
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        throw new Error('終了日は開始日以降の日付を指定してください');
      }

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
            {mode === 'create' ? '目標新規設定' : '目標編集'}
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
            <div className="p-4 bg-accent-sand/10 border border-accent-sand/30 rounded-2xl text-accent-sand text-sm">
              {error}
            </div>
          )}

          {/* タイトル */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-ink mb-2">
              タイトル <span className="text-accent-sand">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例: 2025年1月目標"
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
              required
            />
          </div>

          {/* 目標金額 */}
          <div>
            <label htmlFor="target_amount" className="block text-sm font-medium text-ink mb-2">
              目標金額 <span className="text-accent-sand">*</span>
            </label>
            <input
              id="target_amount"
              type="number"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
              required
              min="0"
              step="1"
            />
          </div>

          {/* 開始日 */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-ink mb-2">
              開始日 <span className="text-accent-sand">*</span>
            </label>
            <input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
              required
            />
          </div>

          {/* 終了日 */}
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-ink mb-2">
              終了日 <span className="text-accent-sand">*</span>
            </label>
            <input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
              required
            />
          </div>

          {/* プロジェクト */}
          <div>
            <label htmlFor="project_id" className="block text-sm font-medium text-ink mb-2">
              プロジェクト
            </label>
            <select
              id="project_id"
              value={formData.project_id}
              onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
            >
              <option value="">全体目標</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
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
              placeholder="目標の詳細を入力してください"
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand resize-none"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-mist border border-cloud/30 text-ink rounded-full hover:bg-cloud/10 transition-colors"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-accent-sand text-ink rounded-full hover:bg-accent-sand/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? '保存中...' : mode === 'create' ? '登録' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
