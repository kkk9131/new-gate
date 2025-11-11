'use client';

import { useEffect, useState } from 'react';
import {
  RiAddLine,
  RiCalendarLine,
  RiEdit2Line,
  RiDeleteBin6Line,
  RiFlagLine,
} from 'react-icons/ri';
import type { RevenueTarget } from '@/types/revenue';
import { TargetFormModal } from './TargetFormModal';

/**
 * 目標一覧コンポーネント
 * - 売上目標の一覧表示
 * - 新規作成・編集・削除機能
 */
export function TargetList() {
  const [targets, setTargets] = useState<RevenueTarget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<RevenueTarget | null>(null);

  // 目標データ取得
  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/revenue-targets?limit=50');

      if (!response.ok) {
        throw new Error('目標データの取得に失敗しました');
      }

      const result = await response.json();
      setTargets(result.data || []);
    } catch (err) {
      console.error('Error fetching targets:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  // 目標作成ハンドラー
  const handleCreate = async (formData: any) => {
    const response = await fetch('/api/revenue-targets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || '目標の作成に失敗しました');
    }

    await fetchTargets();
  };

  // 目標更新ハンドラー
  const handleUpdate = async (formData: any) => {
    if (!selectedTarget) return;

    const response = await fetch(`/api/revenue-targets/${selectedTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || '目標の更新に失敗しました');
    }

    await fetchTargets();
    setSelectedTarget(null);
  };

  // 目標削除ハンドラー
  const handleDelete = async (target: RevenueTarget) => {
    if (!confirm(`「${target.title}」を削除しますか？`)) return;

    try {
      const response = await fetch(`/api/revenue-targets/${target.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('目標の削除に失敗しました');
      }

      await fetchTargets();
    } catch (err) {
      console.error('Error deleting target:', err);
      alert(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  // 目標期間の判定
  const isActive = (target: RevenueTarget) => {
    const today = new Date();
    const startDate = new Date(target.start_date);
    const endDate = new Date(target.end_date);
    return today >= startDate && today <= endDate;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cloud">読み込み中...</div>
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
        <h3 className="text-xl font-semibold">目標一覧</h3>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-sand text-ink rounded-full hover:bg-accent-sand/80 transition-colors"
        >
          <RiAddLine className="w-4 h-4" /> 新規
        </button>
      </div>

      {/* 一覧 */}
      {targets.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-cloud">
          <RiFlagLine className="w-16 h-16 mb-4" />
          <p className="text-lg">目標データがありません</p>
          <p className="text-sm">「新規」ボタンから目標を設定してください</p>
        </div>
      ) : (
        <div className="bg-surface border border-white/40 rounded-3xl shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cloud/20">
                  <th className="px-6 py-3 text-left text-xs text-cloud">タイトル</th>
                  <th className="px-6 py-3 text-left text-xs text-cloud">目標金額</th>
                  <th className="px-6 py-3 text-left text-xs text-cloud">期間</th>
                  <th className="px-6 py-3 text-left text-xs text-cloud">プロジェクト</th>
                  <th className="px-6 py-3 text-left text-xs text-cloud">ステータス</th>
                  <th className="px-6 py-3 text-right text-xs text-cloud">操作</th>
                </tr>
              </thead>
              <tbody>
                {targets.map((target, index) => (
                  <tr
                    key={target.id}
                    className={`${index !== targets.length - 1 ? 'border-b border-cloud/10' : ''}`}
                  >
                    <td className="px-6 py-4 text-sm font-semibold">{target.title}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-indigo-600">
                      ¥{target.target_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <RiCalendarLine className="w-4 h-4 text-cloud" />
                        <span className="text-cloud">
                          {target.start_date} - {target.end_date}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-cloud">
                      {target.projects?.name || '全体'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {isActive(target) ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          進行中
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          期間外
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedTarget(target);
                            setIsEditModalOpen(true);
                          }}
                          className="p-2 rounded-full text-cloud hover:bg-cloud/20 transition-colors"
                          title="編集"
                          aria-label="目標を編集"
                        >
                          <RiEdit2Line className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(target)}
                          className="p-2 rounded-full text-cloud hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="削除"
                          aria-label="目標を削除"
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
      <TargetFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreate}
        mode="create"
      />

      {/* 編集モーダル */}
      <TargetFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTarget(null);
        }}
        onSubmit={handleUpdate}
        initialData={
          selectedTarget
            ? {
                title: selectedTarget.title,
                target_amount: selectedTarget.target_amount,
                start_date: selectedTarget.start_date,
                end_date: selectedTarget.end_date,
                description: selectedTarget.description || '',
                project_id: selectedTarget.project_id || '',
              }
            : undefined
        }
        mode="edit"
      />
    </div>
  );
}
