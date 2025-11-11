# new-gate

新時代SaaS Ver0.1 - マルチタスク型SaaSのMVP版

## 🚀 セットアップ

### 必要な環境

- Node.js 18以上
- npm または yarn

### インストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 🎯 MVP機能

- **プロジェクト管理** - プロジェクトのCRUD操作
- **設定管理** - ユーザー設定・アプリケーション設定
- **売上確認** - 売上データの登録・集計
- **チャットUI** - OpenAI ChatKitによる対話型インターフェース

## 📦 使用技術

### フロントエンド
- **Next.js 16** (App Router, TypeScript)
- **React 19**
- **ChatKit** (@openai/chatkit-react) - チャットUI
- **Zustand** - 状態管理
- **Tailwind CSS** - スタイリング
- **TypeScript 5.9**

### バックエンド
- **Next.js API Routes** - RESTful API
- **Supabase** - PostgreSQL & 認証

### インフラ
- **Vercel** - デプロイ

## 📁 プロジェクト構造

```
new-gate/
├── app/              # Next.js App Router
│   ├── globals.css   # グローバルスタイル（Tailwind CSS）
│   ├── layout.tsx    # ルートレイアウト
│   └── page.tsx      # ホームページ
├── components/       # Reactコンポーネント
├── store/           # Zustandストア
│   └── useStore.ts  # メインストア
├── docs/            # ドキュメント
│   └── requirements.md  # 要件定義書
└── package.json     # 依存関係
```

## 🛠️ 利用可能なスクリプト

- `npm run dev` - 開発サーバーを起動
- `npm run build` - プロダクションビルド
- `npm run start` - プロダクションサーバーを起動
- `npm run lint` - ESLintを実行
- `npm run e2e` - PlaywrightでE2Eテストを実行

## 🧪 E2Eテスト

Supabase認証を利用するE2EテストをPlaywrightで用意しています。

1. `.env.local` などに `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY` を設定
2. 初回のみ `npx playwright install --with-deps`
3. `npm run e2e` でテストを実行（必要に応じて `E2E_BASE_URL` を指定可能）

メール認証テストでは Service Role Key でテストユーザーを作成/削除するため、必ず検証用のSupabase環境で実行してください。

## 📚 ドキュメント

### MVP実装ガイド

開発を始める前に、以下のドキュメントを順番に確認してください：

1. **[MVP要件定義書](./docs/mvp-requirements.md)** - 機能要件、非機能要件、成功指標
2. **[データベーススキーマ設計](./docs/database-schema.md)** - Supabaseテーブル定義、RLS設定、SQL
3. **[API設計書](./docs/api-design.md)** - エンドポイント仕様、リクエスト/レスポンス形式
4. **[実装タスクリスト](./docs/tasks.md)** - 7フェーズの詳細な実装手順

### その他のドキュメント

- [オリジナル要件定義](./docs/requirements.md) - 初期コンセプトと将来ビジョン
- [CLAUDE.md](./CLAUDE.md) - Claude Code用の開発ガイド

## 🚀 実装の進め方

### Phase 1: 環境構築（1日目）
```bash
# 依存パッケージのインストール
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @openai/chatkit-react @openai/chatkit-js
npm install date-fns zod

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集してSupabase、OpenAI APIキーを設定
```

詳細は [docs/tasks.md](./docs/tasks.md) を参照してください。

## 🤝 開発ルール

### Git操作
- mainブランチへの直接プッシュは禁止
- featureブランチで開発 → mainへのマージは確認必須
- コミットメッセージは日本語（軽い関西弁）で記述

### コミットメッセージ例
```bash
git commit -m "✨ プロジェクト管理APIを実装したで"
git commit -m "🐛 認証周りのバグを修正しといた"
git commit -m "📝 API設計書を更新や"
```
