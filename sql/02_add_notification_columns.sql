-- user_settingsテーブルに通知設定カラムを追加

-- 通知方法カラムを追加
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notification_browser BOOLEAN DEFAULT true;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notification_in_app BOOLEAN DEFAULT true;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notification_sound BOOLEAN DEFAULT true;

-- 通知カテゴリカラムを追加
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notify_agent_task_success BOOLEAN DEFAULT true;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notify_agent_task_failure BOOLEAN DEFAULT true;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notify_security_alert BOOLEAN DEFAULT true;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notify_platform_updates BOOLEAN DEFAULT false;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notify_project_reminder BOOLEAN DEFAULT true;

-- 通知タイミングカラムを追加
ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notification_timing TEXT DEFAULT 'immediate';

-- 既存の制約を削除（存在する場合）
ALTER TABLE user_settings
DROP CONSTRAINT IF EXISTS user_settings_notification_timing_check;

-- 制約を追加
ALTER TABLE user_settings
ADD CONSTRAINT user_settings_notification_timing_check
CHECK (notification_timing IN ('immediate', 'batched', 'business_hours'));

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notification_batch_interval INTEGER DEFAULT 60;

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notification_business_hours_start TIME DEFAULT '09:00';

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS notification_business_hours_end TIME DEFAULT '18:00';

-- コメントを追加
COMMENT ON COLUMN user_settings.notification_email IS 'メール通知の有効/無効';
COMMENT ON COLUMN user_settings.notification_browser IS 'ブラウザ通知の有効/無効';
COMMENT ON COLUMN user_settings.notification_in_app IS 'アプリ内通知の有効/無効';
COMMENT ON COLUMN user_settings.notification_sound IS '通知音の有効/無効';
COMMENT ON COLUMN user_settings.notify_agent_task_success IS 'エージェントタスク成功時の通知';
COMMENT ON COLUMN user_settings.notify_agent_task_failure IS 'エージェントタスク失敗時の通知';
COMMENT ON COLUMN user_settings.notify_security_alert IS 'セキュリティアラート通知';
COMMENT ON COLUMN user_settings.notify_platform_updates IS 'プラットフォーム更新通知';
COMMENT ON COLUMN user_settings.notify_project_reminder IS 'プロジェクトリマインダー通知';
COMMENT ON COLUMN user_settings.notification_timing IS '通知タイミング: immediate(即時), batched(まとめて), business_hours(営業時間のみ)';
COMMENT ON COLUMN user_settings.notification_batch_interval IS '通知のまとめ送信間隔（分単位）';
COMMENT ON COLUMN user_settings.notification_business_hours_start IS '営業時間開始時刻';
COMMENT ON COLUMN user_settings.notification_business_hours_end IS '営業時間終了時刻';
