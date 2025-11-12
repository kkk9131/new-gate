/**
 * 通知設定の型定義
 */

/**
 * 通知タイプ
 */
export type NotificationType =
  | 'system'
  | 'project_update'
  | 'revenue_alert'
  | 'plugin_update'
  | 'agent_complete'
  | 'mention'
  | 'reminder';

/**
 * 通知設定
 */
export interface NotificationSettings {
  id: string;
  user_id: string;

  // 通知タイプごとの有効/無効
  enabled_types: NotificationType[];

  // ブラウザ通知の有効/無効
  browser_notifications_enabled: boolean;

  // 通知音の有効/無効
  sound_enabled: boolean;

  // メール通知の有効/無効
  email_notifications_enabled: boolean;

  // タイムスタンプ
  created_at: string;
  updated_at: string;
}

/**
 * 通知設定の更新リクエスト
 */
export interface NotificationSettingsUpdate {
  enabled_types?: NotificationType[];
  browser_notifications_enabled?: boolean;
  sound_enabled?: boolean;
  email_notifications_enabled?: boolean;
}

/**
 * デフォルトの通知設定
 */
export const DEFAULT_NOTIFICATION_SETTINGS: Omit<NotificationSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  enabled_types: [
    'system',
    'project_update',
    'revenue_alert',
    'plugin_update',
    'agent_complete',
    'mention',
    'reminder',
  ],
  browser_notifications_enabled: false,
  sound_enabled: true,
  email_notifications_enabled: false,
};

/**
 * 通知タイプの表示名
 */
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  system: 'システム通知',
  project_update: 'プロジェクト更新',
  revenue_alert: '売上アラート',
  plugin_update: 'プラグイン更新',
  agent_complete: 'エージェント完了',
  mention: 'メンション',
  reminder: 'リマインダー',
};

/**
 * 通知タイプの説明
 */
export const NOTIFICATION_TYPE_DESCRIPTIONS: Record<NotificationType, string> = {
  system: 'システムからの重要なお知らせ',
  project_update: 'プロジェクトの変更や更新情報',
  revenue_alert: '売上の変動や目標達成の通知',
  plugin_update: 'プラグインのアップデート情報',
  agent_complete: 'エージェントタスクの完了通知',
  mention: 'あなたへのメンションやコメント',
  reminder: '設定したリマインダー通知',
};
