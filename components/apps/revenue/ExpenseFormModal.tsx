'use client';

import { useState, useEffect } from 'react';
import { RiCloseLine } from 'react-icons/ri';

type ExpenseFormData = {
  amount: number;
  expense_date: string;
  description: string;
  category: string;
  project_id: string;
  tax_included: boolean;
};

type ExpenseFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  initialData?: Partial<ExpenseFormData>;
  mode: 'create' | 'edit';
};

/**
 * 経費入力フォームモーダル
 * - 金額、日付、説明、カテゴリ、プロジェクト選択
 * - 税込み/税抜き選択
 */
export function ExpenseFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: ExpenseFormModalProps) {
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    project_id: '',
    tax_included: true,
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
        amount: initialData.amount || 0,
        expense_date: initialData.expense_date || new Date().toISOString().split('T')[0],
        description: initialData.description || '',
        category: initialData.category || '',
        project_id: initialData.project_id || '',
        tax_included: initialData.tax_included !== undefined ? initialData.tax_included : true,
      });
    }
  }, [initialData]);

  // モーダルが閉じられたらフォームをリセット
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        amount: 0,
        expense_date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        project_id: '',
        tax_included: true,
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
      if (formData.amount <= 0) {
        throw new Error('金額は0より大きい値を入力してください');
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
            {mode === 'create' ? '経費新規登録' : '経費編集'}
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

          {/* 金額 */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-ink mb-2">
              金額 <span className="text-accent-sand">*</span>
            </label>
            <input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
              required
              min="0"
              step="1"
            />
          </div>

          {/* 日付 */}
          <div>
            <label htmlFor="expense_date" className="block text-sm font-medium text-ink mb-2">
              経費日 <span className="text-accent-sand">*</span>
            </label>
            <input
              id="expense_date"
              type="date"
              value={formData.expense_date}
              onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
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
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand"
            >
              <option value="">未分類</option>
              <option value="交通費">交通費</option>
              <option value="通信費">通信費</option>
              <option value="消耗品費">消耗品費</option>
              <option value="外注費">外注費</option>
              <option value="広告費">広告費</option>
              <option value="接待交際費">接待交際費</option>
              <option value="その他">その他</option>
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
              placeholder="経費の詳細を入力してください"
              className="w-full px-4 py-2 bg-mist border border-cloud/30 rounded-2xl text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand resize-none"
            />
          </div>

          {/* 税込み/税抜き */}
          <div className="flex items-center gap-2">
            <input
              id="tax_included"
              type="checkbox"
              checked={formData.tax_included}
              onChange={(e) => setFormData({ ...formData, tax_included: e.target.checked })}
              className="w-4 h-4 rounded border-cloud/30 text-accent-sand focus:ring-accent-sand"
            />
            <label htmlFor="tax_included" className="text-sm text-ink">
              税込み
            </label>
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
