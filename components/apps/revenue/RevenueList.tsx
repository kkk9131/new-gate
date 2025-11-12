'use client';

import { useEffect, useState } from 'react';
import {
  RiAddLine,
  RiCalendarLine,
  RiEdit2Line,
  RiDeleteBin6Line,
  RiMoneyDollarCircleLine,
} from 'react-icons/ri';
import { subYears, subMonths, subWeeks, format } from 'date-fns';
import { useTranslation } from '@/lib/hooks/useTranslation';
import type { Revenue, PeriodType } from '@/types/revenue';
import { RevenueFormModal } from './RevenueFormModal';
import { useProjectStore } from '@/store/useProjectStore';

/**
 * 売上一覧コンポーネント
 * - 売上データの一覧表示
 * - 新規作成・編集・削除機能
 * - 期間フィルター（年間・月間・週間）
 * - プロジェクトフィルター
 */
export function RevenueList() {
  const { t } = useTranslation();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);
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

  // 売上データ取得
  useEffect(() => {
    fetchRevenues();
  }, [period, selectedProjectId]);

  const fetchRevenues = async () => {
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

      const response = await fetch(`/api/revenues?${params}`);

      if (!response.ok) {
        throw new Error(t.revenue.fetchError);
      }

      const result = await response.json();
      setRevenues(result.data || []);
    } catch (err) {
      console.error('Error fetching revenues:', err);
      setError(err instanceof Error ? err.message : t.revenue.error);
    } finally {
      setIsLoading(false);
    }
  };

  // 売上作成ハンドラー
  const handleCreate = async (formData: any) => {
    // 空文字列のproject_idを削除
    const submitData = {
      ...formData,
      project_id: formData.project_id || undefined,
    };

    const response = await fetch('/api/revenues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || t.revenue.createError);
    }

    await fetchRevenues();
  };

  // 売上更新ハンドラー
  const handleUpdate = async (formData: any) => {
    if (!selectedRevenue) return;

    // 空文字列のproject_idを削除
    const submitData = {
      ...formData,
      project_id: formData.project_id || undefined,
    };

    const response = await fetch(`/api/revenues/${selectedRevenue.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submitData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || t.revenue.updateError);
    }

    await fetchRevenues();
    setSelectedRevenue(null);
  };

  // 売上削除ハンドラー
  const handleDelete = async (revenue: Revenue) => {
    const confirmMessage = t.revenue.deleteConfirm.replace(
      '{item}',
      revenue.description || t.revenue.revenueItem
    );
    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`/api/revenues/${revenue.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(t.revenue.deleteError);
      }

      await fetchRevenues();
    } catch (err) {
      console.error('Error deleting revenue:', err);
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
        <h3 className="text-xl font-semibold">{t.revenue.revenueList}</h3>
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
      {revenues.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-cloud">
          <RiMoneyDollarCircleLine className="w-16 h-16 mb-4" />
          <p className="text-lg">{t.revenue.noRevenues}</p>
          <p className="text-sm">{t.revenue.createRevenueHint}</p>
        </div>
      ) : (
        <div className="bg-surface border border-white/40 rounded-3xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cloud/20">
                  <th className="px-6 py-3 text-left text-xs text-cloud">{t.revenue.revenueDate}</th>
                  <th className="px-6 py-3 text-left text-xs text-cloud">{t.revenue.amount}</th>
                  <th className="px-6 py-3 text-left text-xs text-cloud">{t.revenue.project}</th>
                  <th className="px-6 py-3 text-left text-xs text-cloud">{t.revenue.category}</th>
                  <th className="px-6 py-3 text-left text-xs text-cloud">{t.revenue.description}</th>
                  <th className="px-6 py-3 text-right text-xs text-cloud">{t.revenue.actions}</th>
                </tr>
              </thead>
              <tbody>
                {revenues.map((revenue, index) => (
                  <tr
                    key={revenue.id}
                    className={`${index !== revenues.length - 1 ? 'border-b border-cloud/10' : ''}`}
                  >
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <RiCalendarLine className="w-4 h-4 text-cloud" />
                        {revenue.revenue_date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      ¥{revenue.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-cloud">
                      {revenue.projects?.name || t.revenue.unassigned}
                    </td>
                    <td className="px-6 py-4 text-sm text-cloud">{revenue.category || '—'}</td>
                    <td className="px-6 py-4 text-sm text-cloud truncate max-w-xs">
                      {revenue.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedRevenue(revenue);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 rounded-full text-cloud hover:bg-cloud/20 transition-colors"
                          title={t.revenue.edit}
                          aria-label={t.revenue.editRevenue}
                        >
                          <RiEdit2Line className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(revenue)}
                          className="p-2 rounded-full text-cloud hover:bg-red-50 hover:text-red-500 transition-colors"
                          title={t.revenue.delete}
                          aria-label={t.revenue.deleteRevenue}
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
      <RevenueFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* 編集モーダル */}
      <RevenueFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedRevenue(null);
        }}
        onSubmit={handleUpdate}
        initialData={
          selectedRevenue
            ? {
                amount: selectedRevenue.amount,
                revenue_date: selectedRevenue.revenue_date,
                description: selectedRevenue.description || '',
                category: selectedRevenue.category || '',
                project_id: selectedRevenue.project_id || '',
                tax_included: selectedRevenue.tax_included,
              }
            : undefined
        }
        mode="edit"
      />
    </div>
  );
}
