-- ユーザー設定テーブル作成（修正版）
-- 通知設定、言語設定、タイムゾーン設定、プライバシー設定を管理

CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 通知方法
  notification_email BOOLEAN DEFAULT true,
  notification_browser BOOLEAN DEFAULT true,
  notification_in_app BOOLEAN DEFAULT true,
  notification_sound BOOLEAN DEFAULT true,

  -- 通知カテゴリ
  notify_agent_task_success BOOLEAN DEFAULT true,
  notify_agent_task_failure BOOLEAN DEFAULT true,
  notify_security_alert BOOLEAN DEFAULT true,
  notify_platform_updates BOOLEAN DEFAULT false,
  notify_project_reminder BOOLEAN DEFAULT true,

  -- 通知タイミング
  notification_timing TEXT DEFAULT 'immediate' CHECK (notification_timing IN ('immediate', 'batched', 'business_hours')),
  notification_batch_interval INTEGER DEFAULT 60, -- 分単位
  notification_business_hours_start TIME DEFAULT '09:00',
  notification_business_hours_end TIME DEFAULT '18:00',

  -- 言語設定
  language TEXT DEFAULT 'ja' CHECK (language IN ('ja', 'en')),

  -- タイムゾーン設定
  timezone TEXT DEFAULT 'Asia/Tokyo',

  -- プライバシー設定
  collect_usage_data BOOLEAN DEFAULT true,
  share_anonymous_data BOOLEAN DEFAULT true,

  -- セキュリティ設定
  session_timeout_minutes INTEGER DEFAULT 60,

  -- タイムスタンプ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 制約: 1ユーザーにつき1レコード
  UNIQUE(user_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Row Level Security (RLS) 有効化
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;

-- RLSポリシー: ユーザーは自分の設定のみ閲覧可能
CREATE POLICY "Users can view their own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分の設定のみ更新可能
CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分の設定のみ挿入可能
CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分の設定のみ削除可能
CREATE POLICY "Users can delete their own settings"
  ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id);

-- 既存のトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS trigger_update_user_settings_updated_at ON user_settings;

-- 更新日時を自動更新するトリガー関数
CREATE OR REPLACE FUNCTION update_user_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー作成
CREATE TRIGGER trigger_update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_updated_at();

-- コメント追加
COMMENT ON TABLE user_settings IS 'ユーザーごとの設定情報（通知、言語、タイムゾーン、プライバシー等）';
COMMENT ON COLUMN user_settings.notification_email IS 'メール通知の有効/無効';
COMMENT ON COLUMN user_settings.notification_browser IS 'ブラウザ通知の有効/無効';
COMMENT ON COLUMN user_settings.notification_in_app IS 'アプリ内通知の有効/無効';
COMMENT ON COLUMN user_settings.notification_sound IS '通知音の有効/無効';
COMMENT ON COLUMN user_settings.notify_agent_task_success IS 'エージェントタスク成功時の通知';
COMMENT ON COLUMN user_settings.notify_agent_task_failure IS 'エージェントタスク失敗時の通知';
COMMENT ON COLUMN user_settings.notification_timing IS '通知タイミング: immediate(即時), batched(まとめて), business_hours(営業時間のみ)';
COMMENT ON COLUMN user_settings.language IS '表示言語: ja(日本語), en(English)';
COMMENT ON COLUMN user_settings.timezone IS 'タイムゾーン（IANA Timezone Database形式）';
