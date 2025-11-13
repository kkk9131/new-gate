-- アカウント削除リクエストテーブルの作成
-- 30日間の猶予期間を管理するためのテーブル

-- account_deletion_requests テーブル
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_deletion_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cancelled', 'completed')),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_account_deletion_user_id ON account_deletion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_account_deletion_status ON account_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_account_deletion_scheduled ON account_deletion_requests(scheduled_deletion_at) WHERE status = 'pending';

-- RLSの有効化
ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分の削除リクエストのみ閲覧可能
CREATE POLICY "Users can view their own deletion requests"
  ON account_deletion_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分の削除リクエストのみ作成可能
CREATE POLICY "Users can create their own deletion requests"
  ON account_deletion_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLSポリシー: ユーザーは自分の削除リクエストのみキャンセル可能（statusをcancelledに更新）
CREATE POLICY "Users can cancel their own deletion requests"
  ON account_deletion_requests
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND status IN ('pending', 'cancelled'));

-- updated_atの自動更新トリガー
CREATE OR REPLACE FUNCTION update_account_deletion_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_account_deletion_requests_updated_at
  BEFORE UPDATE ON account_deletion_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_account_deletion_requests_updated_at();

-- コメント追加
COMMENT ON TABLE account_deletion_requests IS 'ユーザーのアカウント削除リクエストを管理するテーブル。30日間の猶予期間を持つ。';
COMMENT ON COLUMN account_deletion_requests.user_id IS '削除リクエストを行ったユーザーのID';
COMMENT ON COLUMN account_deletion_requests.requested_at IS '削除リクエストが送信された日時';
COMMENT ON COLUMN account_deletion_requests.scheduled_deletion_at IS '実際に削除が実行される予定日時（リクエスト日時+30日）';
COMMENT ON COLUMN account_deletion_requests.status IS 'リクエストの状態: pending（処理待ち）, cancelled（キャンセル済み）, completed（完了）';
COMMENT ON COLUMN account_deletion_requests.cancellation_reason IS 'キャンセル理由（オプション）';
COMMENT ON COLUMN account_deletion_requests.cancelled_at IS 'キャンセルされた日時';
COMMENT ON COLUMN account_deletion_requests.completed_at IS '削除が完了した日時';
