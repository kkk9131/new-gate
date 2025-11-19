/**
 * 売上データの型定義
 */
export interface Revenue {
  id: string;
  project_id: string | null;
  user_id: string;
  amount: number;
  currency: string;
  revenue_date: string; // YYYY-MM-DD
  description: string | null;
  category: string | null;
  tax_included: boolean;
  tax_amount: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  projects?: {
    name: string;
  } | null;
}

/**
 * 経費データの型定義
 */
export interface Expense {
  id: string;
  project_id: string | null;
  user_id: string;
  amount: number;
  currency: string;
  expense_date: string; // YYYY-MM-DD
  description: string | null;
  category: string | null;
  tax_included: boolean;
  tax_amount: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  projects?: {
    name: string;
  } | null;
}

/**
 * 売上目標データの型定義
 */
export interface RevenueTarget {
  id: string;
  project_id: string | null;
  user_id: string;
  target_amount: number;
  currency: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  title: string;
  description: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  projects?: {
    name: string;
  } | null;
}

/**
 * ダッシュボード集計データの型定義
 */
export interface DashboardData {
  summary: {
    total_revenue: number;
    total_expense: number;
    gross_profit: number;
    gross_profit_rate: number;
  };
  target: {
    target_amount: number;
    achievement_rate: number;
    remaining: number;
    target_period: {
      start_date: string;
      end_date: string;
      title: string;
    };
  } | null;
  monthly: Record<
    string,
    {
      revenue: number;
      expense: number;
      gross_profit: number;
    }
  >;
}

/**
 * 期間フィルタータイプ（年間・月間・週間）
 */
export type PeriodType = 'year' | 'month' | 'week';

/**
 * プロジェクト情報の型定義（簡易版）
 */
export interface Project {
  id: string;
  name: string;
}
