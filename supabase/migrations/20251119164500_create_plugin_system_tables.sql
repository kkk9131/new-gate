-- 5. store_plugins（ストア掲載プラグイン情報）

CREATE TABLE store_plugins (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基本情報
  plugin_id VARCHAR(255) NOT NULL UNIQUE,  -- com.example.plugin
  name VARCHAR(255) NOT NULL,
  description TEXT,
  long_description TEXT,
  icon_url TEXT,
  screenshots TEXT[],

  -- 開発者情報
  author_id UUID REFERENCES auth.users(id),
  author_name VARCHAR(255),
  author_email VARCHAR(255),

  -- カテゴリ・タグ
  category VARCHAR(50),
  tags TEXT[],

  -- バージョン管理
  latest_version VARCHAR(20),
  min_platform_version VARCHAR(20),

  -- 統計情報
  download_count INT DEFAULT 0,
  install_count INT DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0.0,
  review_count INT DEFAULT 0,

  -- 価格
  price DECIMAL(10, 2) DEFAULT 0.0,
  is_free BOOLEAN DEFAULT TRUE,

  -- ステータス
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_official BOOLEAN DEFAULT FALSE,

  -- タイムスタンプ
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_store_plugins_plugin_id ON store_plugins(plugin_id);
CREATE INDEX idx_store_plugins_category ON store_plugins(category);
CREATE INDEX idx_store_plugins_author_id ON store_plugins(author_id);
CREATE INDEX idx_store_plugins_published ON store_plugins(is_published, published_at DESC);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_store_plugins_updated_at
  BEFORE UPDATE ON store_plugins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE store_plugins ENABLE ROW LEVEL SECURITY;

-- ポリシー: 公開されたプラグインは全員が参照可能
CREATE POLICY "Everyone can view published plugins"
  ON store_plugins FOR SELECT
  USING (is_published = TRUE);

-- ポリシー: 開発者は自分のプラグインを参照可能
CREATE POLICY "Authors can view their own plugins"
  ON store_plugins FOR SELECT
  USING (auth.uid() = author_id);

-- ポリシー: 開発者は自分のプラグインを作成可能
CREATE POLICY "Authors can create their own plugins"
  ON store_plugins FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- ポリシー: 開発者は自分のプラグインを更新可能
CREATE POLICY "Authors can update their own plugins"
  ON store_plugins FOR UPDATE
  USING (auth.uid() = author_id);


-- 6. plugin_installations（プラグインインストール状況）

CREATE TABLE plugin_installations (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 関連情報
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plugin_id VARCHAR(255) NOT NULL,

  -- インストール情報
  installed_version VARCHAR(20) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_auto_update BOOLEAN NOT NULL DEFAULT FALSE,

  -- 設定情報（プラグインごとの設定をJSON形式で保存）
  settings JSONB DEFAULT '{}',

  -- タイムスタンプ
  installed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ユニーク制約: 1ユーザーは同じプラグインを1つだけインストール可能
  UNIQUE(user_id, plugin_id)
);

-- インデックス
CREATE INDEX idx_plugin_installations_user_id ON plugin_installations(user_id);
CREATE INDEX idx_plugin_installations_plugin_id ON plugin_installations(plugin_id);
CREATE INDEX idx_plugin_installations_active ON plugin_installations(user_id, is_active);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_plugin_installations_updated_at
  BEFORE UPDATE ON plugin_installations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE plugin_installations ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分のインストール状況のみ参照可能
CREATE POLICY "Users can view their own installations"
  ON plugin_installations FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のプラグインをインストール可能
CREATE POLICY "Users can install plugins"
  ON plugin_installations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のインストール状況を更新可能
CREATE POLICY "Users can update their own installations"
  ON plugin_installations FOR UPDATE
  USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のプラグインをアンインストール可能
CREATE POLICY "Users can uninstall their plugins"
  ON plugin_installations FOR DELETE
  USING (auth.uid() = user_id);


-- 7. plugin_permissions（プラグイン権限管理）

CREATE TABLE plugin_permissions (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 関連情報
  plugin_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 権限情報
  permission VARCHAR(100) NOT NULL,  -- storage.read, storage.write, ui.notification等
  is_granted BOOLEAN NOT NULL DEFAULT FALSE,
  granted_at TIMESTAMPTZ,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ユニーク制約: 同じユーザー・プラグイン・権限の組み合わせは1つのみ
  UNIQUE(user_id, plugin_id, permission)
);

-- インデックス
CREATE INDEX idx_plugin_permissions_user_plugin ON plugin_permissions(user_id, plugin_id);
CREATE INDEX idx_plugin_permissions_granted ON plugin_permissions(user_id, plugin_id, is_granted);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_plugin_permissions_updated_at
  BEFORE UPDATE ON plugin_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE plugin_permissions ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分の権限設定のみ参照可能
CREATE POLICY "Users can view their own permissions"
  ON plugin_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分の権限設定を作成可能
CREATE POLICY "Users can create their own permissions"
  ON plugin_permissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ポリシー: ユーザーは自分の権限設定を更新可能
CREATE POLICY "Users can update their own permissions"
  ON plugin_permissions FOR UPDATE
  USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分の権限設定を削除可能
CREATE POLICY "Users can delete their own permissions"
  ON plugin_permissions FOR DELETE
  USING (auth.uid() = user_id);


-- 8. plugin_reviews（プラグインレビュー）

CREATE TABLE plugin_reviews (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 関連情報
  plugin_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- レビュー内容
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  comment TEXT,

  -- 役に立った数
  helpful_count INT DEFAULT 0,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- ユニーク制約: 1ユーザー1プラグインにつき1レビュー
  UNIQUE(plugin_id, user_id)
);

-- インデックス
CREATE INDEX idx_plugin_reviews_plugin_id ON plugin_reviews(plugin_id);
CREATE INDEX idx_plugin_reviews_user_id ON plugin_reviews(user_id);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_plugin_reviews_updated_at
  BEFORE UPDATE ON plugin_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE plugin_reviews ENABLE ROW LEVEL SECURITY;

-- ポリシー: レビューは全員が参照可能
CREATE POLICY "Everyone can view reviews"
  ON plugin_reviews FOR SELECT
  USING (true);

-- ポリシー: ユーザーは自分のレビューを作成可能
CREATE POLICY "Users can create their own reviews"
  ON plugin_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のレビューを更新可能
CREATE POLICY "Users can update their own reviews"
  ON plugin_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のレビューを削除可能
CREATE POLICY "Users can delete their own reviews"
  ON plugin_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RPC: インストール数をインクリメント
CREATE OR REPLACE FUNCTION increment_plugin_install_count(p_plugin_id VARCHAR)
RETURNS VOID AS $$
BEGIN
  UPDATE store_plugins
  SET install_count = install_count + 1
  WHERE plugin_id = p_plugin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
