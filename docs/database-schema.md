# データベーススキーマ設計書

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **データベース**: Supabase (PostgreSQL 15+)
- **文字コード**: UTF-8
- **タイムゾーン**: Asia/Tokyo

---

## 🗄️ テーブル一覧

1. **projects** - プロジェクト管理
2. **user_settings** - ユーザー設定
3. **app_settings** - アプリケーション設定
4. **revenues** - 売上データ

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

## 📚 関連ドキュメント

- [MVP要件定義書](./mvp-requirements.md)
- [API設計書](./api-design.md)
- [実装タスクリスト](./tasks.md)
