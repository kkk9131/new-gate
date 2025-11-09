# セットアップガイド（プラグインベースプラットフォーム版）

## 📋 実装開始前の準備

このガイドに従って、プラグインベースSaaSプラットフォームの開発環境をセットアップしてください。

---

## ✅ セットアップチェックリスト

### 1. アカウント・サービス準備

- [ ] **Supabaseアカウント**
  - https://supabase.com でアカウント作成
  - 無料プランで開始可能

- [ ] **OpenAI Platform アカウント**
  - https://platform.openai.com でアカウント作成
  - API Keyを取得（有料）
  - 組織の認証（ストリーミング用）

- [ ] **Vercel アカウント**
  - https://vercel.com でアカウント作成
  - GitHubアカウントと連携
  - 無料プランで開始可能

- [ ] **GitHub リポジトリ**
  - 既存リポジトリがあればそのまま使用
  - なければ新規作成

---

## 🗄️ Step 1: Supabaseプロジェクト作成

### 1.1 プロジェクト作成

1. https://supabase.com にアクセス
2. 「New Project」をクリック
3. 以下を入力：
   - **Name**: `new-gate` または任意の名前
   - **Database Password**: 強力なパスワードを設定（保存必須）
   - **Region**: `Northeast Asia (Tokyo)` 推奨
   - **Pricing Plan**: `Free` で開始
4. 「Create new project」をクリック（数分かかります）

### 1.2 API Keysの取得

1. 左サイドバーから「Project Settings」→「API」
2. 以下をコピーして保存：
   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

⚠️ **重要**: `service_role key`は絶対に公開しないこと！

### 1.3 データベーススキーマの構築

1. 左サイドバーから「SQL Editor」を開く
2. `docs/database-schema.md`のSQLを順番に実行：

**実行順序**:
```sql
-- 1. update_updated_at_column 関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. MVPテーブル（4つ）
-- projects, user_settings, app_settings, revenues

-- 3. プラグインシステムテーブル（4つ）
-- store_plugins, plugin_installations, plugin_permissions, plugin_reviews

-- 4. エージェントシステムテーブル（3つ）
-- agent_tasks, agent_executions, agent_step_logs

-- 5. 各テーブルのインデックス・トリガー・RLS設定

-- 6. 自動設定作成関数・トリガー
CREATE OR REPLACE FUNCTION create_user_settings() ...
CREATE TRIGGER on_auth_user_created ...

-- 7. ビュー作成
CREATE OR REPLACE VIEW project_revenue_summary AS ...
CREATE OR REPLACE VIEW monthly_revenue_summary AS ...
```

3. 各SQL実行後「Success」を確認

### 1.4 認証設定

1. 「Authentication」→「Providers」
2. 「Email」を有効化
3. 必要に応じて他のプロバイダー（Google等）を有効化

---

## 🤖 Step 2: OpenAI Platform セットアップ

### 2.1 API Key取得

1. https://platform.openai.com/api-keys にアクセス
2. 「Create new secret key」をクリック
3. 名前を入力（例: `new-gate-platform`）
4. APIキーをコピーして保存（二度と表示されません）
   ```
   sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

⚠️ **重要**: APIキーは絶対に公開しないこと！

### 2.2 組織の認証（ストリーミング用）

1. https://platform.openai.com/settings/organization/general
2. 「Verify organization」セクションで認証手続き
3. 認証完了まで待機（数時間〜数日）

⚠️ **注意**: 認証完了まではストリーミングが使えません

### 2.3 Agent Builder でワークフロー作成

1. https://platform.openai.com/agent-builder にアクセス
2. 「Create Agent」をクリック
3. エージェント設定：
   ```yaml
   Name: 新時代SaaSアシスタント

   Instructions (システムプロンプト):
   あなたは新時代SaaSプラットフォームのアシスタントです。
   ユーザーの指示に応じて以下の操作を実行してください：

   1. アプリ起動: 「〇〇を開いて」→ アプリウィンドウを開く
   2. データ操作: 「〇〇を作成して」→ API呼び出し
   3. エージェントタスク: 「〇〇を実行して」→ タスク作成
   4. プラグイン管理: 「〇〇プラグインをインストール」→ ストア操作

   利用可能なアプリ:
   - プロジェクト管理 (Projects)
   - 設定 (Settings)
   - 売上確認 (Revenue)
   - プラグインストア (Store)
   - エージェント (Agent)

   日本語で親しみやすく、わかりやすく回答してください。

   Tools: （後で追加）
   - get_projects
   - create_project
   - get_revenues
   - install_plugin
   - create_agent_task
   ```

4. 「Publish」をクリック
5. **Workflow ID**をコピー（`workflow_xxxxxxxxxxxxx`形式）

### 2.4 ChatKit Domain Allowlist 設定

1. https://platform.openai.com/settings/organization/chatkit
2. 「Domain Allowlist」セクション
3. 以下のドメインを追加：
   ```
   localhost:3000
   *.vercel.app
   your-production-domain.com
   ```

⚠️ **重要**: この設定がないとChatKitが動作しません！

---

## 🔧 Step 3: プロジェクト環境変数設定

### 3.1 .env.local ファイル作成

```bash
# プロジェクトルートで実行
cp .env.example .env.local
```

### 3.2 環境変数を編集

`.env.local`を開いて、以下を入力：

```env
# Supabase（データベース）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI (ChatKit用)
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CHATKIT_WORKFLOW_ID=workflow_xxxxxxxxxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.3 .gitignore確認

`.gitignore`に以下が含まれていることを確認：

```
# 環境変数
.env
.env.local
.env*.local

# dependencies
node_modules

# Next.js
.next
out

# その他
*.log
.DS_Store
```

---

## 📦 Step 4: 依存パッケージのインストール

### 4.1 基本パッケージ

```bash
# 既存の依存関係
npm install

# Supabase関連
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# ChatKit関連
npm install @openai/chatkit-react @openai/chatkit-js

# OpenAI SDK
npm install openai

# ユーティリティ
npm install date-fns zod

# 開発用型定義
npm install -D @types/node
```

### 4.2 インストール確認

```bash
# ビルドが通るか確認
npm run build

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:3000 を開いてエラーがないことを確認。

---

## 🏗️ Step 5: プラットフォーム構造の準備

### 5.1 フォルダ構造作成

```bash
# プラグイン関連
mkdir -p components/plugins
mkdir -p lib/plugins
mkdir -p app/api/store
mkdir -p app/api/plugins

# エージェント関連
mkdir -p components/agent
mkdir -p lib/agent
mkdir -p app/api/agent

# デスクトップUI関連
mkdir -p components/desktop
mkdir -p components/chat

# ストア関連
mkdir -p store
```

### 5.2 基本設定ファイル作成

**Zustand Store (`store/useDesktopStore.ts`)**:
```typescript
import { create } from 'zustand';

interface DesktopStore {
  // 開いているウィンドウ
  openWindows: Array<{
    id: string;
    appId: string;
    title: string;
  }>;

  // アプリを開く
  openApp: (appId: string) => void;

  // ウィンドウを閉じる
  closeWindow: (windowId: string) => void;
}

export const useDesktopStore = create<DesktopStore>((set) => ({
  openWindows: [],

  openApp: (appId) => {
    set((state) => ({
      openWindows: [
        ...state.openWindows,
        {
          id: `window-${Date.now()}`,
          appId,
          title: appId,
        },
      ],
    }));
  },

  closeWindow: (windowId) => {
    set((state) => ({
      openWindows: state.openWindows.filter((w) => w.id !== windowId),
    }));
  },
}));
```

---

## 🐙 Step 6: Gitセットアップ

### 6.1 現在の状態確認

```bash
git status
```

### 6.2 変更をコミット

```bash
# 新しいブランチを作成
git checkout -b feature/setup-platform-environment

# 変更をステージング
git add .

# コミット
git commit -m "🔧 プラグインプラットフォーム開発環境のセットアップ完了や

- Supabase設定追加（MVP + プラグイン + エージェント）
- OpenAI ChatKit設定追加（右側固定レイアウト）
- 環境変数テンプレート作成
- 依存パッケージインストール
- プラットフォーム構造準備
- ドキュメント整備完了"

# リモートにプッシュ
git push origin feature/setup-platform-environment
```

---

## 🚀 Step 7: Vercel連携準備

### 7.1 Vercelプロジェクト作成

1. https://vercel.com にアクセス
2. 「New Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト名を入力
5. **まだデプロイしない**（環境変数設定後）

### 7.2 環境変数設定（Vercel）

1. Vercel Dashboard → Settings → Environment Variables
2. 以下を**Production**環境に追加：
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   OPENAI_API_KEY
   CHATKIT_WORKFLOW_ID
   NEXT_PUBLIC_APP_URL (Vercelデプロイ後のURL)
   ```

3. **Preview**環境にも同じ環境変数を追加

⚠️ **重要**: `NEXT_PUBLIC_`で始まる変数のみクライアントに公開されます

---

## ✅ セットアップ完了チェック

すべて完了したらチェック：

### 基本セットアップ
- [ ] Supabaseプロジェクト作成完了
- [ ] データベーステーブル作成完了（MVP + プラグイン + エージェント）
- [ ] OpenAI API Key取得完了
- [ ] Agent Builder ワークフロー作成完了
- [ ] ChatKit Domain Allowlist 設定完了

### 開発環境
- [ ] `.env.local` 作成・設定完了
- [ ] 依存パッケージインストール完了
- [ ] `npm run dev` でエラーなく起動
- [ ] `.gitignore` 確認完了

### プラットフォーム構造
- [ ] フォルダ構造作成完了
- [ ] 基本Store設定完了
- [ ] Git コミット完了
- [ ] Vercel連携準備完了

---

## 🎯 次のステップ

セットアップ完了後、実装を開始：

### Phase 1: MVP実装（12-15日）
1. `docs/tasks.md` の Phase 1-8 を順番に実装
2. デスクトップUI + チャット右側固定
3. Projects, Settings, Revenue アプリ

### Phase 2: プラグインシステム（8-10日）
1. `docs/tasks.md` の Phase 9-10 を実装
2. プラグインストア構築
3. 開発者向けSDK・CLI

### Phase 3: エージェントシステム（5-7日）
1. `docs/tasks.md` の Phase 11 を実装
2. ワークフローエンジン
3. タスクスケジューラー

---

## 🐛 トラブルシューティング

### Supabase接続エラー

```bash
# 接続テスト
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
supabase.from('projects').select('count').then(console.log);
"
```

### OpenAI API接続エラー

```bash
# 接続テスト
node -e "
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
openai.models.list().then(() => console.log('✅ OpenAI接続成功'));
"
```

### パッケージインストールエラー

```bash
# node_modules削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

### ChatKit表示エラー

**確認事項**:
- ✅ Domain Allowlistに`localhost:3000`を追加したか
- ✅ `CHATKIT_WORKFLOW_ID`が正しいか
- ✅ OpenAI組織の認証が完了しているか

---

## 📚 関連ドキュメント

### プラットフォーム設計
- [プラットフォーム要件定義](./platform-requirements.md)
- [プラグインアーキテクチャ](./plugin-architecture.md)
- [エージェントシステム設計](./agent-system-design.md)
- [デスクトップUI設計](./desktop-ui-design.md)

### 実装ガイド
- [ChatKit実装ガイド](./chatkit-implementation.md)
- [開発者ガイド](./developer-guide.md)
- [Core API仕様](./core-api-spec.md)

### データベース・API
- [データベーススキーマ](./database-schema.md)
- [API設計書](./api-design.md)

### タスク管理
- [実装タスクリスト](./tasks.md)
