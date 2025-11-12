-- ============================================
-- 通知テーブル作成
-- ============================================

-- notifications テーブル
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 通知タイプ（project_update, revenue_alert, system など）
  type TEXT NOT NULL,

  -- 通知内容
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- 既読フラグ
  read BOOLEAN NOT NULL DEFAULT false,

  -- 関連データへのリンク（任意）
  link_url TEXT,

  -- メタデータ（JSON形式で追加情報を保存）
  metadata JSONB,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- インデックス作成（クエリ効率化）
-- ============================================

-- ユーザーIDでのクエリを高速化
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- 未読通知の取得を高速化
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);

-- 作成日時での並び替えを高速化
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 通知タイプでのフィルタリングを高速化
CREATE INDEX idx_notifications_type ON notifications(type);

-- ============================================
-- RLS（Row Level Security）ポリシー設定
-- ============================================

-- RLSを有効化
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分の通知のみ参照可能
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- ユーザーは自分の通知のみ更新可能（既読フラグの変更など）
CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- システムが通知を作成可能（サービスロールキー経由）
CREATE POLICY "Service role can insert notifications"
  ON notifications
  FOR INSERT
  WITH CHECK (true);

-- ユーザーは自分の通知を削除可能
CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- updated_at 自動更新トリガー
-- ============================================

-- 汎用的なupdated_atトリガー関数（まだ存在しない場合のみ作成）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- notificationsテーブルにトリガーを設定
CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- コメント追加（ドキュメント化）
-- ============================================

COMMENT ON TABLE notifications IS 'ユーザーへの通知を管理するテーブル';
COMMENT ON COLUMN notifications.type IS '通知タイプ（project_update, revenue_alert, system など）';
COMMENT ON COLUMN notifications.title IS '通知のタイトル';
COMMENT ON COLUMN notifications.message IS '通知の本文';
COMMENT ON COLUMN notifications.read IS '既読フラグ';
COMMENT ON COLUMN notifications.link_url IS '通知に関連するページへのリンク（任意）';
COMMENT ON COLUMN notifications.metadata IS '追加のメタデータ（JSON形式）';
