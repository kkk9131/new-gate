'use client';

import { useState, useEffect } from 'react';
import { RiCloseLine } from 'react-icons/ri';
import { EVENT_CATEGORIES } from '@/types/calendar';

type EventFormData = {
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  project_id: string;
  category: string;
  color: string;
};

type EventFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EventFormData) => Promise<void>;
  initialData?: Partial<EventFormData>;
  mode: 'create' | 'edit';
};

/**
 * イベント入力フォームモーダル
 * - タイトル、時刻、場所、説明、プロジェクト選択
 * - 終日イベント対応
 * - カテゴリ・色選択
 */
export function EventFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: EventFormModalProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    location: '',
    start_time: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    end_time: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // 1時間後
    all_day: false,
    project_id: '',
    category: '',
    color: '#3B82F6',
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
        description: initialData.description || '',
        location: initialData.location || '',
        start_time: initialData.start_time
          ? new Date(initialData.start_time).toISOString().slice(0, 16)
          : new Date().toISOString().slice(0, 16),
        end_time: initialData.end_time
          ? new Date(initialData.end_time).toISOString().slice(0, 16)
          : new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        all_day: initialData.all_day !== undefined ? initialData.all_day : false,
        project_id: initialData.project_id || '',
        category: initialData.category || '',
        color: initialData.color || '#3B82F6',
      });
    }
  }, [initialData]);

  // モーダルが閉じられたらフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        location: '',
        start_time: new Date().toISOString().slice(0, 16),
        end_time: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        all_day: false,
        project_id: '',
        category: '',
        color: '#3B82F6',
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
      if (!formData.title.trim()) {
        throw new Error('タイトルを入力してください');
      }

      if (new Date(formData.end_time) < new Date(formData.start_time)) {
        throw new Error('終了時刻は開始時刻より後にしてください');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm">
      <div className="bg-surface border border-white/40 rounded-3xl shadow-soft w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cloud/20">
          <h3 className="text-xl font-bold text-ink">
            {mode === 'create' ? 'イベント新規作成' : 'イベント編集'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-cloud hover:bg-cloud/20 transition-colors"
            aria-label="閉じる"
          >
            <RiCloseLine className="w-5 h-5" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
              required
              placeholder="イベントのタイトル"
            />
          </div>

          {/* 終日イベント */}
          <div className="flex items-center gap-2">
            <input
              id="all_day"
              type="checkbox"
              checked={formData.all_day}
              onChange={(e) => setFormData({ ...formData, all_day: e.target.checked })}
              className="w-4 h-4 rounded border-cloud/30 text-accent-sand focus:ring-accent-sand"
            />
            <label htmlFor="all_day" className="text-sm text-ink">
              終日イベント
            </label>
          </div>

          {/* 開始時刻 */}
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-ink mb-2">
              開始 <span className="text-accent-sand">*</span>
            </label>
            <input
              id="start_time"
              type={formData.all_day ? 'date' : 'datetime-local'}
              value={formData.all_day ? formData.start_time.split('T')[0] : formData.start_time}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  start_time: formData.all_day ? `${e.target.value}T00:00` : e.target.value,
                })
              }
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
              required
            />
          </div>

          {/* 終了時刻 */}
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-ink mb-2">
              終了 <span className="text-accent-sand">*</span>
            </label>
            <input
              id="end_time"
              type={formData.all_day ? 'date' : 'datetime-local'}
              value={formData.all_day ? formData.end_time.split('T')[0] : formData.end_time}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  end_time: formData.all_day ? `${e.target.value}T23:59` : e.target.value,
                })
              }
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
              required
            />
          </div>

          {/* 場所 */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-ink mb-2">
              場所
            </label>
            <input
              id="location"
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
              placeholder="オンライン、会議室など"
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
              <option value="">未割当</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* カテゴリ */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-ink mb-2">
              カテゴリ
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => {
                const selectedCategory = EVENT_CATEGORIES.find(
                  (cat) => cat.value === e.target.value
                );
                setFormData({
                  ...formData,
                  category: e.target.value,
                  color: selectedCategory?.color || formData.color,
                });
              }}
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
            >
              <option value="">未分類</option>
              {EVENT_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* 色 */}
          <div>
            <label htmlFor="color" className="block text-sm font-medium text-ink mb-2">
              色
            </label>
            <div className="flex items-center gap-2">
              <input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-12 h-12 rounded-xl border border-cloud/30 cursor-pointer"
              />
              <span className="text-sm text-cloud">{formData.color}</span>
            </div>
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
              placeholder="イベントの詳細を入力してください"
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
              {isSubmitting ? '保存中...' : mode === 'create' ? '作成' : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
