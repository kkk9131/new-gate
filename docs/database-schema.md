# データベーススキーマ設計書

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **データベース**: Supabase (PostgreSQL 15+)
- **文字コード**: UTF-8
- **タイムゾーン**: Asia/Tokyo

---

## 🗄️ テーブル一覧

### コア機能（MVP Phase 1）
1. **projects** - プロジェクト管理
2. **user_settings** - ユーザー設定
3. **app_settings** - アプリケーション設定
4. **revenues** - 売上データ

### プラグインシステム（Phase 2）
5. **store_plugins** - ストア掲載プラグイン情報
6. **plugin_installations** - ユーザーのプラグインインストール状況
7. **plugin_permissions** - プラグイン権限管理
8. **plugin_reviews** - プラグインレビュー

### エージェントシステム（Phase 3）
9. **agent_tasks** - エージェントタスク定義
10. **agent_executions** - タスク実行履歴
11. **agent_step_logs** - ステップ実行ログ

---

## 📊 テーブル詳細

### 1. projects（プロジェクト）

プロジェクト情報を管理するテーブル。

```sql
CREATE TABLE projects (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- プロジェクト情報
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'on_hold')),

  -- 日程管理
  start_date DATE NOT NULL,
  end_date DATE,

  -- 予算管理
  budget DECIMAL(15, 2) NOT NULL DEFAULT 0,
  actual_cost DECIMAL(15, 2) NOT NULL DEFAULT 0,

  -- 関連情報
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 削除管理
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status) WHERE is_deleted = FALSE;
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- 更新日時の自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分のプロジェクトのみ参照可能
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のプロジェクトを作成可能
CREATE POLICY "Users can create their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のプロジェクトを更新可能
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のプロジェクトを削除可能（ソフトデリート）
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

#### カラム説明

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | プロジェクトID（主キー） |
| name | VARCHAR(255) | NO | - | プロジェクト名 |
| description | TEXT | YES | NULL | プロジェクト説明 |
| status | VARCHAR(20) | NO | 'active' | ステータス（active/completed/on_hold） |
| start_date | DATE | NO | - | 開始日 |
| end_date | DATE | YES | NULL | 終了日 |
| budget | DECIMAL(15,2) | NO | 0 | 予算 |
| actual_cost | DECIMAL(15,2) | NO | 0 | 実費 |
| user_id | UUID | NO | - | 作成ユーザーID（外部キー） |
| is_deleted | BOOLEAN | NO | FALSE | 削除フラグ（ソフトデリート） |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | NOW() | 更新日時 |

---

### 2. user_settings（ユーザー設定）

ユーザーごとの個人設定を管理するテーブル。

```sql
CREATE TABLE user_settings (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ユーザー情報
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 表示設定
  display_name VARCHAR(100) NOT NULL,
  language VARCHAR(5) NOT NULL DEFAULT 'ja' CHECK (language IN ('ja', 'en')),
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Tokyo',
  theme VARCHAR(10) NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),

  -- 通知設定
  notification_enabled BOOLEAN NOT NULL DEFAULT TRUE,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE UNIQUE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分の設定のみ参照可能
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分の設定を作成可能
CREATE POLICY "Users can create their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ポリシー: ユーザーは自分の設定を更新可能
CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);
```

#### カラム説明

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 設定ID（主キー） |
| user_id | UUID | NO | - | ユーザーID（外部キー、UNIQUE） |
| display_name | VARCHAR(100) | NO | - | 表示名 |
| language | VARCHAR(5) | NO | 'ja' | 言語設定（ja/en） |
| timezone | VARCHAR(50) | NO | 'Asia/Tokyo' | タイムゾーン |
| theme | VARCHAR(10) | NO | 'light' | テーマ（light/dark） |
| notification_enabled | BOOLEAN | NO | TRUE | 通知有効フラグ |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | NOW() | 更新日時 |

---

### 3. app_settings（アプリケーション設定）

ユーザーごとのアプリケーション設定を管理するテーブル。

```sql
CREATE TABLE app_settings (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ユーザー情報
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 会計設定
  default_currency VARCHAR(3) NOT NULL DEFAULT 'JPY',
  fiscal_year_start INTEGER NOT NULL DEFAULT 4
    CHECK (fiscal_year_start BETWEEN 1 AND 12),
  tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 10.00
    CHECK (tax_rate >= 0 AND tax_rate <= 100),

  -- 会社情報
  company_name VARCHAR(255),

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE UNIQUE INDEX idx_app_settings_user_id ON app_settings(user_id);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分の設定のみ参照可能
CREATE POLICY "Users can view their own app settings"
  ON app_settings FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分の設定を作成可能
CREATE POLICY "Users can create their own app settings"
  ON app_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ポリシー: ユーザーは自分の設定を更新可能
CREATE POLICY "Users can update their own app settings"
  ON app_settings FOR UPDATE
  USING (auth.uid() = user_id);
```

#### カラム説明

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 設定ID（主キー） |
| user_id | UUID | NO | - | ユーザーID（外部キー、UNIQUE） |
| default_currency | VARCHAR(3) | NO | 'JPY' | デフォルト通貨コード（ISO 4217） |
| fiscal_year_start | INTEGER | NO | 4 | 会計年度開始月（1-12） |
| tax_rate | DECIMAL(5,2) | NO | 10.00 | 消費税率（%） |
| company_name | VARCHAR(255) | YES | NULL | 会社名 |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | NOW() | 更新日時 |

---

### 4. revenues（売上）

売上データを管理するテーブル。

```sql
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
```

#### カラム説明

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 売上ID（主キー） |
| project_id | UUID | YES | NULL | プロジェクトID（外部キー、NULL可） |
| user_id | UUID | NO | - | ユーザーID（外部キー） |
| amount | DECIMAL(15,2) | NO | - | 売上金額 |
| currency | VARCHAR(3) | NO | 'JPY' | 通貨コード |
| revenue_date | DATE | NO | - | 売上計上日 |
| description | TEXT | YES | NULL | 説明 |
| category | VARCHAR(100) | YES | NULL | カテゴリ |
| tax_included | BOOLEAN | NO | TRUE | 税込みフラグ |
| tax_amount | DECIMAL(15,2) | NO | 0 | 税額 |
| is_deleted | BOOLEAN | NO | FALSE | 削除フラグ |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | NOW() | 更新日時 |

---

## 🔗 テーブルリレーション

```
auth.users (Supabase Auth)
    │
    ├──[1:N]─→ projects (user_id)
    │
    ├──[1:1]─→ user_settings (user_id)
    │
    ├──[1:1]─→ app_settings (user_id)
    │
    └──[1:N]─→ revenues (user_id)


projects
    │
    └──[1:N]─→ revenues (project_id) ※ NULL許可
```

---

## 🛡️ セキュリティ設定

### Row Level Security (RLS)

すべてのテーブルでRLSを有効化し、以下のポリシーを適用：

1. **SELECT**: ユーザーは自分のデータのみ参照可能
2. **INSERT**: ユーザーは自分のデータのみ作成可能
3. **UPDATE**: ユーザーは自分のデータのみ更新可能
4. **DELETE**: ユーザーは自分のデータのみ削除可能

### 認証

- Supabase Authを使用
- JWTトークンによる認証
- `auth.uid()`で現在のユーザーIDを取得

---

## 📝 初期データ投入

### ユーザー登録時の自動設定作成

ユーザー登録時に`user_settings`と`app_settings`を自動作成するトリガー：

```sql
-- ユーザー登録時に設定を自動作成する関数
CREATE OR REPLACE FUNCTION create_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- ユーザー設定を作成
  INSERT INTO user_settings (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', 'ユーザー'));

  -- アプリ設定を作成
  INSERT INTO app_settings (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーを設定
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_settings();
```

---

## 🔍 便利なビュー

### プロジェクト別売上集計ビュー

```sql
CREATE OR REPLACE VIEW project_revenue_summary AS
SELECT
  p.id AS project_id,
  p.name AS project_name,
  p.user_id,
  COUNT(r.id) AS revenue_count,
  COALESCE(SUM(r.amount), 0) AS total_amount,
  COALESCE(SUM(r.tax_amount), 0) AS total_tax,
  p.budget,
  p.actual_cost
FROM projects p
LEFT JOIN revenues r ON p.id = r.project_id AND r.is_deleted = FALSE
WHERE p.is_deleted = FALSE
GROUP BY p.id, p.name, p.user_id, p.budget, p.actual_cost;
```

### 月次売上集計ビュー

```sql
CREATE OR REPLACE VIEW monthly_revenue_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', revenue_date) AS month,
  COUNT(*) AS revenue_count,
  SUM(amount) AS total_amount,
  SUM(tax_amount) AS total_tax,
  SUM(amount - tax_amount) AS net_amount,
  currency
FROM revenues
WHERE is_deleted = FALSE
GROUP BY user_id, DATE_TRUNC('month', revenue_date), currency;
```

---

## 🚀 セットアップ手順

### 1. Supabaseプロジェクト作成
1. https://supabase.com でプロジェクト作成
2. プロジェクトURLとAPI Keyを取得

### 2. SQL実行
1. Supabase Dashboard > SQL Editorを開く
2. 上記のテーブル作成SQLを順番に実行
3. トリガー・ビューのSQLを実行

### 3. 環境変数設定
```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## プラグインシステム（Phase 2）

### 5. store_plugins（ストア掲載プラグイン情報）

ストアで公開されているプラグインの情報を管理するテーブル。

```sql
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
```

#### カラム説明

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | プラグインID（主キー） |
| plugin_id | VARCHAR(255) | NO | - | プラグイン識別子（com.example.plugin） |
| name | VARCHAR(255) | NO | - | プラグイン名 |
| description | TEXT | YES | NULL | 短い説明 |
| long_description | TEXT | YES | NULL | 詳細説明 |
| icon_url | TEXT | YES | NULL | アイコンURL |
| screenshots | TEXT[] | YES | NULL | スクリーンショットURL配列 |
| author_id | UUID | YES | NULL | 開発者ID（外部キー） |
| author_name | VARCHAR(255) | YES | NULL | 開発者名 |
| author_email | VARCHAR(255) | YES | NULL | 開発者メールアドレス |
| category | VARCHAR(50) | YES | NULL | カテゴリ |
| tags | TEXT[] | YES | NULL | タグ配列 |
| latest_version | VARCHAR(20) | YES | NULL | 最新バージョン |
| min_platform_version | VARCHAR(20) | YES | NULL | 最低プラットフォームバージョン |
| download_count | INT | NO | 0 | ダウンロード数 |
| install_count | INT | NO | 0 | インストール数 |
| average_rating | DECIMAL(3,2) | NO | 0.0 | 平均評価 |
| review_count | INT | NO | 0 | レビュー数 |
| price | DECIMAL(10,2) | NO | 0.0 | 価格 |
| is_free | BOOLEAN | NO | TRUE | 無料フラグ |
| is_published | BOOLEAN | NO | FALSE | 公開フラグ |
| is_featured | BOOLEAN | NO | FALSE | おすすめフラグ |
| is_official | BOOLEAN | NO | FALSE | 公式プラグインフラグ |
| published_at | TIMESTAMPTZ | YES | NULL | 公開日時 |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | NOW() | 更新日時 |

---

### 6. plugin_installations（プラグインインストール状況）

ユーザーがインストールしたプラグインの状態を管理するテーブル。

```sql
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
```

#### カラム説明

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | インストールID（主キー） |
| user_id | UUID | NO | - | ユーザーID（外部キー） |
| plugin_id | VARCHAR(255) | NO | - | プラグイン識別子 |
| installed_version | VARCHAR(20) | NO | - | インストールされたバージョン |
| is_active | BOOLEAN | NO | TRUE | 有効フラグ |
| is_auto_update | BOOLEAN | NO | FALSE | 自動更新フラグ |
| settings | JSONB | YES | '{}' | プラグイン固有の設定 |
| installed_at | TIMESTAMPTZ | NO | NOW() | インストール日時 |
| last_used_at | TIMESTAMPTZ | YES | NULL | 最終使用日時 |
| updated_at | TIMESTAMPTZ | NO | NOW() | 更新日時 |

---

### 7. plugin_permissions（プラグイン権限管理）

プラグインが要求・付与された権限を管理するテーブル。

```sql
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
```

#### カラム説明

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 権限ID（主キー） |
| plugin_id | VARCHAR(255) | NO | - | プラグイン識別子 |
| user_id | UUID | NO | - | ユーザーID（外部キー） |
| permission | VARCHAR(100) | NO | - | 権限名（storage.read等） |
| is_granted | BOOLEAN | NO | FALSE | 付与フラグ |
| granted_at | TIMESTAMPTZ | YES | NULL | 付与日時 |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | NOW() | 更新日時 |

---

### 8. plugin_reviews（プラグインレビュー）

ユーザーがプラグインに投稿したレビューを管理するテーブル。

```sql
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
CREATE INDEX idx_plugin_reviews_rating ON plugin_reviews(plugin_id, rating DESC);
CREATE INDEX idx_plugin_reviews_created ON plugin_reviews(created_at DESC);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_plugin_reviews_updated_at
  BEFORE UPDATE ON plugin_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE plugin_reviews ENABLE ROW LEVEL SECURITY;

-- ポリシー: 全員がレビューを参照可能
CREATE POLICY "Everyone can view reviews"
  ON plugin_reviews FOR SELECT
  USING (TRUE);

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
```

#### カラム説明

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | レビューID（主キー） |
| plugin_id | VARCHAR(255) | NO | - | プラグイン識別子 |
| user_id | UUID | NO | - | ユーザーID（外部キー） |
| rating | INT | NO | - | 評価（1-5） |
| title | VARCHAR(255) | YES | NULL | レビュータイトル |
| comment | TEXT | YES | NULL | レビュー本文 |
| helpful_count | INT | NO | 0 | 役に立った数 |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | NOW() | 更新日時 |

---

## エージェントシステム（Phase 3）

### 9. agent_tasks（エージェントタスク定義）

AIエージェントが実行するタスクの定義を管理するテーブル。

```sql
CREATE TABLE agent_tasks (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ユーザー情報
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- タスク情報
  name VARCHAR(255) NOT NULL,
  description TEXT,

  -- ワークフロー定義（YAML/JSON形式）
  workflow JSONB NOT NULL,

  -- スケジュール設定（cron形式とタイムゾーン）
  schedule JSONB,  -- { cron: "0 9 1 * *", timezone: "Asia/Tokyo" }

  -- ステータス
  is_active BOOLEAN DEFAULT TRUE,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_agent_tasks_user_id ON agent_tasks(user_id);
CREATE INDEX idx_agent_tasks_active ON agent_tasks(user_id, is_active);

-- 更新日時の自動更新トリガー
CREATE TRIGGER update_agent_tasks_updated_at
  BEFORE UPDATE ON agent_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分のタスクのみ参照可能
CREATE POLICY "Users can view their own tasks"
  ON agent_tasks FOR SELECT
  USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のタスクを作成可能
CREATE POLICY "Users can create their own tasks"
  ON agent_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のタスクを更新可能
CREATE POLICY "Users can update their own tasks"
  ON agent_tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- ポリシー: ユーザーは自分のタスクを削除可能
CREATE POLICY "Users can delete their own tasks"
  ON agent_tasks FOR DELETE
  USING (auth.uid() = user_id);
```

#### カラム説明

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | タスクID（主キー） |
| user_id | UUID | NO | - | ユーザーID（外部キー） |
| name | VARCHAR(255) | NO | - | タスク名 |
| description | TEXT | YES | NULL | タスク説明 |
| workflow | JSONB | NO | - | ワークフロー定義 |
| schedule | JSONB | YES | NULL | スケジュール設定 |
| is_active | BOOLEAN | NO | TRUE | 有効フラグ |
| created_at | TIMESTAMPTZ | NO | NOW() | 作成日時 |
| updated_at | TIMESTAMPTZ | NO | NOW() | 更新日時 |

---

### 10. agent_executions（タスク実行履歴）

エージェントタスクの実行履歴を管理するテーブル。

```sql
CREATE TABLE agent_executions (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- タスク情報
  task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,

  -- 実行ステータス
  status VARCHAR(20) NOT NULL,  -- running, success, failed
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- 実行結果
  results JSONB,
  error_message TEXT,

  -- パフォーマンス情報
  execution_time_ms INT
);

-- インデックス
CREATE INDEX idx_agent_executions_task_id ON agent_executions(task_id);
CREATE INDEX idx_agent_executions_status ON agent_executions(status);
CREATE INDEX idx_agent_executions_started ON agent_executions(started_at DESC);

-- Row Level Security (RLS)
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分のタスクの実行履歴のみ参照可能
CREATE POLICY "Users can view their own task executions"
  ON agent_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_tasks
      WHERE agent_tasks.id = agent_executions.task_id
      AND agent_tasks.user_id = auth.uid()
    )
  );
```

#### カラム説明

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | 実行ID（主キー） |
| task_id | UUID | NO | - | タスクID（外部キー） |
| status | VARCHAR(20) | NO | - | ステータス（running/success/failed） |
| started_at | TIMESTAMPTZ | NO | NOW() | 開始日時 |
| completed_at | TIMESTAMPTZ | YES | NULL | 完了日時 |
| results | JSONB | YES | NULL | 実行結果 |
| error_message | TEXT | YES | NULL | エラーメッセージ |
| execution_time_ms | INT | YES | NULL | 実行時間（ミリ秒） |

---

### 11. agent_step_logs（ステップ実行ログ）

エージェントタスクの各ステップの実行ログを管理するテーブル。

```sql
CREATE TABLE agent_step_logs (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 実行情報
  execution_id UUID NOT NULL REFERENCES agent_executions(id) ON DELETE CASCADE,

  -- ステップ情報
  step_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL,

  -- 入出力データ
  input JSONB,
  output JSONB,
  error_message TEXT,

  -- タイムスタンプ
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INT
);

-- インデックス
CREATE INDEX idx_agent_step_logs_execution_id ON agent_step_logs(execution_id);
CREATE INDEX idx_agent_step_logs_step_id ON agent_step_logs(execution_id, step_id);
CREATE INDEX idx_agent_step_logs_status ON agent_step_logs(status);

-- Row Level Security (RLS)
ALTER TABLE agent_step_logs ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分のタスクのステップログのみ参照可能
CREATE POLICY "Users can view their own step logs"
  ON agent_step_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM agent_executions
      JOIN agent_tasks ON agent_tasks.id = agent_executions.task_id
      WHERE agent_executions.id = agent_step_logs.execution_id
      AND agent_tasks.user_id = auth.uid()
    )
  );
```

#### カラム説明

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|-----|------|-----------|------|
| id | UUID | NO | gen_random_uuid() | ログID（主キー） |
| execution_id | UUID | NO | - | 実行ID（外部キー） |
| step_id | VARCHAR(255) | NO | - | ステップ識別子 |
| status | VARCHAR(20) | NO | - | ステータス |
| input | JSONB | YES | NULL | 入力データ |
| output | JSONB | YES | NULL | 出力データ |
| error_message | TEXT | YES | NULL | エラーメッセージ |
| started_at | TIMESTAMPTZ | NO | NOW() | 開始日時 |
| completed_at | TIMESTAMPTZ | YES | NULL | 完了日時 |
| execution_time_ms | INT | YES | NULL | 実行時間（ミリ秒） |

---

## 📚 関連ドキュメント

### プラットフォーム関連
- [プラットフォーム要件定義書](./platform-requirements.md)
- [MVP要件定義書](./mvp-requirements.md)

### プラグインシステム関連
- [プラグインアーキテクチャ](./plugin-architecture.md)
- [プラグインストア設計](./plugin-store-design.md)
- [開発者ガイド](./developer-guide.md)
- [Core API仕様](./core-api-spec.md)

### エージェントシステム関連
- [エージェントシステム設計](./agent-system-design.md)

### 実装関連
- [API設計書](./api-design.md)
- [実装タスクリスト](./tasks.md)
