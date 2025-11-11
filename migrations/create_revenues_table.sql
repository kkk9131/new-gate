-- revenuesテーブル作成SQL
-- Supabase Dashboard > SQL Editor で実行してください

CREATE TABLE revenues (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 関連情報
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 売上情報
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'JPY',
  revenue_date DATE NOT NULL,

  -- 詳細情報
  description TEXT,
  category VARCHAR(100),

  -- 税金計算
  tax_included BOOLEAN NOT NULL DEFAULT TRUE,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),

  -- 削除管理
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_revenues_user_id ON revenues(user_id);
CREATE INDEX idx_revenues_project_id ON revenues(project_id);
CREATE INDEX idx_revenues_date ON revenues(revenue_date DESC);
CREATE INDEX idx_revenues_created_at ON revenues(created_at DESC);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_revenues_updated_at
  BEFORE UPDATE ON revenues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分の売上のみ参照可能
CREATE POLICY "Users can view their own revenues"
  ON revenues FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分の売上を作成可能
CREATE POLICY "Users can create their own revenues"
  ON revenues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ポリシー: ユーザーは自分の売上を更新可能
CREATE POLICY "Users can update their own revenues"
  ON revenues FOR UPDATE
  USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分の売上を削除可能
CREATE POLICY "Users can delete their own revenues"
  ON revenues FOR DELETE
  USING (auth.uid() = user_id);
