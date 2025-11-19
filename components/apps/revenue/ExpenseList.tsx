'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  RiAddLine,
  RiCalendarLine,
  RiEdit2Line,
  RiDeleteBin6Line,
  RiWallet3Line,
} from 'react-icons/ri';
import { subYears, subMonths, subWeeks, format } from 'date-fns';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { Expense, PeriodType } from '@/types/revenue';
import { ExpenseFormModal } from './ExpenseFormModal';
import { useProjectStore } from '@/store/useProjectStore';

/**
 * 経費一覧コンポーネント
 * - 経費データの一覧表示
 * - 新規作成・編集・削除機能
 * - 期間フィルター（年間・月間・週間）
 * - プロジェクトフィルター
 */
export function ExpenseList() {
  const { t } = useTranslation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [period, setPeriod] = useState<PeriodType>('month');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  // Zustand storeからプロジェクト一覧を取得
  const { projects, fetchProjects, error: projectError } = useProjectStore();

  // プロジェクト一覧取得
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // プロジェクト取得エラー表示
  useEffect(() => {
    if (projectError) {
      setError(projectError);
    }
  }, [projectError]);

  // 経費データ取得
  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 期間に応じた開始日を計算（date-fns使用で安全な日付計算）
      const endDate = new Date();
      let startDate: Date;

      switch (period) {
        case 'year':
          startDate = subYears(endDate, 1);
          break;
        case 'month':
          startDate = subMonths(endDate, 1);
          break;
        case 'week':
          startDate = subWeeks(endDate, 1);
          break;
      }

      const params = new URLSearchParams({
        limit: '100',
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
      });

      // プロジェクトフィルター
      if (selectedProjectId) {
        params.append('project_id', selectedProjectId);
      }

      const response = await fetch(`/api/expenses?${params}`);

      if (!response.ok) {
        throw new Error(t.revenue.fetchErrorExpense);
      }

      const result = await response.json();
      setExpenses(result.data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError(err instanceof Error ? err.message : t.revenue.error);
    } finally {
      setIsLoading(false);
    }
  }, [period, selectedProjectId, t]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // 経費作成ハンドラー
  const handleCreate = async (formData: any) => {
    // 空文字列のproject_idを削除
    const submitData = {
      ...formData,
      project_id: formData.project_id || undefined,
    };

    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || t.revenue.createErrorExpense);
    }

    await fetchExpenses();
  };

  // 経費更新ハンドラー
  const handleUpdate = async (formData: any) => {
    if (!selectedExpense) return;

    // 空文字列のproject_idを削除
    const submitData = {
      ...formData,
      project_id: formData.project_id || undefined,
    };

    const response = await fetch(`/api/expenses/${selectedExpense.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || t.revenue.updateErrorExpense);
    }

    await fetchExpenses();
    setSelectedExpense(null);
  };

  // 経費削除ハンドラー
  const handleDelete = async (expense: Expense) => {
    const confirmMessage = t.revenue.deleteConfirmExpense.replace(
      '{item}',
      expense.description || t.revenue.expenseItem
    );
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/expenses/${expense.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(t.revenue.deleteErrorExpense);
      }

      await fetchExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert(err instanceof Error ? err.message : t.revenue.error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cloud">{t.revenue.loading}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-accent-sand">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">{t.revenue.expenseList}</h3>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-sand text-ink rounded-full hover:bg-accent-sand/80 transition-colors"
        >
          <RiAddLine className="w-4 h-4" /> {t.revenue.new}
        </button>
      </div>

      {/* フィルターエリア */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-surface border border-white/40 rounded-2xl p-4 shadow-soft">
        {/* 期間フィルター */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('year')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              period === 'year'
                ? 'bg-accent-sand text-ink'
                : 'bg-mist text-cloud hover:bg-cloud/20'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t.revenue.yearly}
          </button>
          <button
            onClick={() => setPeriod('month')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              period === 'month'
                ? 'bg-accent-sand text-ink'
                : 'bg-mist text-cloud hover:bg-cloud/20'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t.revenue.monthly}
          </button>
          <button
            onClick={() => setPeriod('week')}
            disabled={isLoading}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              period === 'week'
                ? 'bg-accent-sand text-ink'
                : 'bg-mist text-cloud hover:bg-cloud/20'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t.revenue.weekly}
          </button>
        </div>

        {/* プロジェクトフィルター */}
        <div className="flex items-center gap-2">
          <label htmlFor="project-filter" className="text-sm text-cloud whitespace-nowrap">
            {t.revenue.project}:
          </label>
          <select
            id="project-filter"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            disabled={isLoading}
            className={`px-3 py-2 bg-mist border border-cloud/30 rounded-xl text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent-sand ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <option value="">{t.revenue.all}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 一覧 */}
      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-cloud">
          <RiWallet3Line className="w-16 h-16 mb-4" />
          <p className="text-lg">{t.revenue.noExpenses}</p>
          <p className="text-sm">{t.revenue.createExpenseHint}</p>
        </div>
      ) : (
        <div className="bg-surface border border-white/40 rounded-3xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cloud/20">
                  <th className="px-6 py-3 text-left text-xs text-cloud">{t.revenue.expenseDate}</th>
                  <th className="px-6 py-3 text-left text-xs text-cloud">{t.revenue.amount}</th>
                  <th className="px-6 py-3 text-left text-xs text-cloud">{t.revenue.project}</th>
                  <th className="px-6 py-3 text-left text-xs text-cloud">{t.revenue.category}</th>
                  <th className="px-6 py-3 text-left text-xs text-cloud">{t.revenue.description}</th>
                  <th className="px-6 py-3 text-right text-xs text-cloud">{t.revenue.actions}</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense, index) => (
                  <tr
                    key={expense.id}
                    className={`${index !== expenses.length - 1 ? 'border-b border-cloud/10' : ''}`}
                  >
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <RiCalendarLine className="w-4 h-4 text-cloud" />
                        {expense.expense_date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-500">
                      ¥{expense.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-cloud">
                      {expense.projects?.name || t.revenue.unassigned}
                    </td>
                    <td className="px-6 py-4 text-sm text-cloud">{expense.category || '—'}</td>
                    <td className="px-6 py-4 text-sm text-cloud truncate max-w-xs">
                      {expense.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedExpense(expense);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 rounded-full text-cloud hover:bg-cloud/20 transition-colors"
                          title={t.revenue.edit}
                          aria-label={t.revenue.editExpense}
                        >
                          <RiEdit2Line className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense)}
                          className="p-2 rounded-full text-cloud hover:bg-red-50 hover:text-red-500 transition-colors"
                          title={t.revenue.delete}
                          aria-label={t.revenue.deleteExpense}
                        >
                          <RiDeleteBin6Line className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 新規作成モーダル */}
      <ExpenseFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* 編集モーダル */}
      <ExpenseFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedExpense(null);
        }}
        onSubmit={handleUpdate}
        initialData={
          selectedExpense
            ? {
                amount: selectedExpense.amount,
                expense_date: selectedExpense.expense_date,
                description: selectedExpense.description || '',
                category: selectedExpense.category || '',
                project_id: selectedExpense.project_id || '',
                tax_included: selectedExpense.tax_included,
              }
            : undefined
        }
        mode="edit"
      />
    </div>
  );
}
