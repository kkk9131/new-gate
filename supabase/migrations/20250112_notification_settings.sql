-- 通知設定テーブル
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 通知タイプごとの有効/無効（JSONB配列）
  enabled_types JSONB NOT NULL DEFAULT '["system", "project_update", "revenue_alert", "plugin_update", "agent_complete", "mention", "reminder"]'::jsonb,

  -- ブラウザ通知の有効/無効
  browser_notifications_enabled BOOLEAN NOT NULL DEFAULT false,

  -- 通知音の有効/無効
  sound_enabled BOOLEAN NOT NULL DEFAULT true,

  -- メール通知の有効/無効
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT false,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ユーザーごとに1つの設定のみ
  UNIQUE(user_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS notification_settings_user_id_idx ON notification_settings(user_id);

-- RLS（Row Level Security）を有効化
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分の設定のみ表示可能
CREATE POLICY "Users can view their own notification settings"
  ON notification_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分の設定のみ更新可能
CREATE POLICY "Users can update their own notification settings"
  ON notification_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分の設定のみ挿入可能
CREATE POLICY "Users can insert their own notification settings"
  ON notification_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 更新日時を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();

-- コメント
COMMENT ON TABLE notification_settings IS 'ユーザーごとの通知設定';
COMMENT ON COLUMN notification_settings.enabled_types IS '有効な通知タイプの配列';
COMMENT ON COLUMN notification_settings.browser_notifications_enabled IS 'ブラウザ通知の有効/無効';
COMMENT ON COLUMN notification_settings.sound_enabled IS '通知音の有効/無効';
COMMENT ON COLUMN notification_settings.email_notifications_enabled IS 'メール通知の有効/無効';
