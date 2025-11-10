/**
 * データベース型定義
 *
 * Supabaseのテーブル構造に対応した型を定義
 */

// ============================================
// 共通型
// ============================================

/**
 * タイムスタンプ型（ISO 8601形式の文字列）
 */
export type Timestamp = string;

/**
 * UUID型（文字列）
 */
export type UUID = string;

// ============================================
// Projects テーブル
// ============================================

/**
 * プロジェクトのステータス
 */
export type ProjectStatus = 'active' | 'completed' | 'on_hold';

/**
 * プロジェクトテーブルの型定義
 */
export interface Project {
  id: UUID;
  name: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string; // YYYY-MM-DD
  end_date: string | null; // YYYY-MM-DD
  budget: number;
  actual_cost: number;
  user_id: UUID;
  is_deleted: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * プロジェクト作成時の入力型
 */
export interface CreateProjectInput {
  name: string;
  description?: string;
  status?: ProjectStatus;
  start_date: string;
  end_date?: string;
  budget: number;
}

/**
 * プロジェクト更新時の入力型
 */
export interface UpdateProjectInput {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  budget?: number;
  actual_cost?: number;
}

// ============================================
// User Settings テーブル
// ============================================

/**
 * ユーザー設定テーブルの型定義
 */
export interface UserSettings {
  id: UUID;
  user_id: UUID;
  language: string;
  timezone: string;
  date_format: string;
  currency: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * ユーザー設定更新時の入力型
 */
export interface UpdateUserSettingsInput {
  language?: string;
  timezone?: string;
  date_format?: string;
  currency?: string;
  notifications_enabled?: boolean;
  email_notifications?: boolean;
}

// ============================================
// App Settings テーブル
// ============================================

/**
 * アプリ設定テーブルの型定義
 */
export interface AppSettings {
  id: UUID;
  user_id: UUID;
  theme: string;
  sidebar_collapsed: boolean;
  default_view: string;
  items_per_page: number;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * アプリ設定更新時の入力型
 */
export interface UpdateAppSettingsInput {
  theme?: string;
  sidebar_collapsed?: boolean;
  default_view?: string;
  items_per_page?: number;
}

// ============================================
// Revenues テーブル
// ============================================

/**
 * 売上のステータス
 */
export type RevenueStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

/**
 * 売上テーブルの型定義
 */
export interface Revenue {
  id: UUID;
  project_id: UUID | null;
  user_id: UUID;
  amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: RevenueStatus;
  invoice_number: string | null;
  invoice_date: string | null; // YYYY-MM-DD
  due_date: string | null; // YYYY-MM-DD
  paid_date: string | null; // YYYY-MM-DD
  description: string | null;
  is_deleted: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

/**
 * 売上作成時の入力型
 */
export interface CreateRevenueInput {
  project_id?: UUID;
  amount: number;
  tax_rate: number;
  status?: RevenueStatus;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  paid_date?: string;
  description?: string;
}

/**
 * 売上更新時の入力型
 */
export interface UpdateRevenueInput {
  project_id?: UUID;
  amount?: number;
  tax_rate?: number;
  status?: RevenueStatus;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  paid_date?: string;
  description?: string;
}

// ============================================
// 認証関連
// ============================================

/**
 * Supabase Authユーザー情報（簡易版）
 */
export interface AuthUser {
  id: UUID;
  email: string;
  created_at: Timestamp;
}

/**
 * セッション情報
 */
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: AuthUser;
}
