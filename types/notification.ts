/**
 * 通知システムの型定義
 */

// 通知タイプの定義
export type NotificationType =
  | 'project_update'      // プロジェクト更新通知
  | 'revenue_alert'       // 売上アラート
  | 'system'              // システム通知
  | 'plugin_update'       // プラグイン更新
  | 'agent_complete'      // エージェントタスク完了
  | 'mention'             // メンション通知
  | 'reminder';           // リマインダー

// 通知メタデータの型（通知タイプごとに異なる情報を保存）
export interface NotificationMetadata {
  project_id?: string;
  revenue_id?: string;
  plugin_id?: string;
  agent_task_id?: string;
  [key: string]: any; // その他の追加データ
}

// データベースの notifications テーブルの型
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link_url?: string;
  metadata?: NotificationMetadata;
  created_at: string;
  updated_at: string;
}

// 通知作成時の入力型（IDやタイムスタンプは自動生成）
export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link_url?: string;
  metadata?: NotificationMetadata;
}

// 通知更新時の入力型（既読フラグの変更など）
export interface UpdateNotificationInput {
  read?: boolean;
  metadata?: NotificationMetadata;
}

// 通知フィルター条件
export interface NotificationFilter {
  type?: NotificationType;
  read?: boolean;
  limit?: number;
  offset?: number;
}

// 通知統計情報
export interface NotificationStats {
  total: number;      // 全通知数
  unread: number;     // 未読通知数
  by_type: Record<NotificationType, number>; // タイプ別通知数
}
