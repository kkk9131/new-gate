/**
 * プロジェクト関連の型定義
 */

// プロジェクトステータス
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'on_hold';

// プロジェクトデータ型（API レスポンス）
export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// プロジェクトフォームデータ型
export type ProjectFormData = {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  notes: string;
  status: ProjectStatus;
};

// ステータスラベル（UI表示用）
export const statusLabel: Record<ProjectStatus, string> = {
  planning: '企画',
  active: '進行中',
  completed: '完了',
  on_hold: '保留',
};

// ステータススタイル（Tailwind CSS クラス）
export const statusStyle: Record<ProjectStatus, string> = {
  planning: 'text-ink',
  active: 'text-ink',
  completed: 'text-ink',
  on_hold: 'text-ink',
};
