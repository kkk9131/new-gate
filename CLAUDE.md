# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🎯 Project Overview

**新時代SaaS Ver0.1** - MVP for a multi-task SaaS application with chat-driven interface. Currently single-screen, but architected for future 4-panel UI with dynamic screen generation.

### MVP Scope (最短実装)
**実装機能**:
- ✅ **プロジェクト管理** - CRUD操作（作成・一覧・詳細・編集・削除）
- ✅ **設定管理** - ユーザー設定・アプリケーション設定
- ✅ **売上確認** - 売上データ管理・集計
- ✅ **チャットUI** - OpenAI ChatKitによる対話型インターフェース

すべての操作はチャットUI経由でAPI呼び出しを実行。

## 🛠️ Development Commands

### Core Development Workflow
```bash
# Install dependencies
npm install

# Development server (http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint
```

### TypeScript Configuration
- Path alias: `@/*` maps to project root
- Strict mode enabled
- Target: ES2017
- JSX: react-jsx (React 19)

## 🏗️ Architecture

### State Management Strategy
**Zustand-based centralized store** (`store/useStore.ts`):
- **Future-ready design**: Built for dynamic screen generation even though MVP is single-screen
- **Three state domains**:
  - `tasks[]`: Task management
  - `screens[]`: Dynamic screen registry (prepared for multi-screen expansion)
  - `messages[]`: Chat message history with id/content/timestamp

### Planned Integration Points
The requirements document specifies future integrations that should influence architectural decisions:

- **Backend**: Node.js + Fastify/Express with Socket.IO for real-time communication
- **Database**: Supabase (PostgreSQL) for projects, users, jobs, revenue
- **AI**: OpenAI GPT-5 or Claude for chat responses, estimate generation, email drafting
- **Payments**: Stripe API for subscriptions
- **Auth**: Supabase Auth

### Design Philosophy
- **API-driven**: All operations via API calls, not direct UI manipulation
- **Chat-centric**: Every function accessible through conversational interface
- **Extensible**: Single-screen MVP with multi-screen foundation

## 📁 Key Files & Structure

```
app/
├── layout.tsx      # Root layout with Japanese locale
├── page.tsx        # Homepage (currently placeholder)
└── globals.css     # Tailwind global styles

store/
└── useStore.ts     # Zustand store with tasks/screens/messages state

docs/
└── requirements.md # Complete requirements specification (Japanese)
```

## 🔑 Development Guidelines

### When Adding Features
1. **State management**: Extend `useStore` for new state domains
2. **Screen preparation**: Consider how feature fits future multi-screen layout
3. **API-first**: Design operations as API calls, not direct state mutations
4. **Chat integration**: Ensure functionality can be triggered via chat commands

### Component Development
- Use Tailwind CSS for styling (already configured)
- Prepare for shadcn/ui + framer-motion integration (planned but not yet installed)
- Maintain Japanese language support (`lang="ja"` in root layout)

### Future Expansion Awareness
- **Screen system**: `screens[]` array designed for dynamic screen management
- **4-panel UI**: Current single-screen will evolve into quad-layout
- **Real-time updates**: Architecture prepared for Socket.IO integration
- **Task orchestration**: Task system designed for background job tracking

## 🌐 Tech Stack

### フロントエンド
- **Next.js 16** (App Router, TypeScript)
- **React 19** (latest)
- **ChatKit** (@openai/chatkit-react) - チャットUI
- **Zustand** (state management)
- **Tailwind CSS** (styling)
- **TypeScript 5.9** (strict mode)

### バックエンド
- **Next.js API Routes** - RESTful API
- **Next.js Server Actions** - サーバーサイドロジック
- **Supabase** - PostgreSQL database & authentication
- **Supabase Client** - Database connection

### インフラ
- **Vercel** - Hosting & deployment
- **GitHub** - Version control

## 📚 Documentation

### MVP関連ドキュメント
完全な要件定義と実装ガイドは以下を参照：

- **[MVP要件定義書](./docs/mvp-requirements.md)** - 機能要件、非機能要件、KPI
- **[データベーススキーマ設計](./docs/database-schema.md)** - Supabaseテーブル定義、RLS設定
- **[API設計書](./docs/api-design.md)** - エンドポイント仕様、リクエスト/レスポンス形式
- **[実装タスクリスト](./docs/tasks.md)** - 7フェーズの実装手順（チェックリスト付き）
- **[オリジナル要件定義](./docs/requirements.md)** - 初期コンセプトと将来ビジョン

### 実装開始時のワークフロー
1. `docs/mvp-requirements.md` で機能仕様を確認
2. `docs/database-schema.md` でデータ構造を理解
3. `docs/api-design.md` でAPI仕様を確認
4. `docs/tasks.md` のチェックリストに従って実装

## 📝 Notes
- Application text and documentation are in Japanese
- MVP focuses on minimal viable chat interface
- Internal architecture supports planned expansion to multi-screen SaaS platform

Communication Guidelines for Claude Code
Core Principles
正確性を最優先: わからないことは「わからない」と正直に伝える
ハルシネーション（幻覚）を避ける: 推測や憶測で答えない。確実な情報のみを提供
できないことは明確に伝える: 技術的制約や実装の難しさを隠さない
質問を恐れない: 曖昧な要件や不明点は必ずユーザーに確認する
タスクチケットを正確に読む: 思い込みではなく、ドキュメントの記載内容に従う
Output Language
すべての出力は日本語で行うこと (All outputs must be in Japanese)
コード説明、エラーメッセージ、提案、進捗報告などは日本語で記述
ユーザーとのコミュニケーションは常に日本語を使用
Code Comments
コード内には初心者でも理解できる日本語コメントを必ず記述
複雑なロジックには処理の意図を日本語で説明
関数やクラスの説明にはJSDoc/Docstring形式で日本語ドキュメントを追加
変数名は英語でも、その役割をコメントで日本語説明
コメント例:

// ユーザーの認証状態を確認する関数
// 引数: token - JWTトークン文字列
// 戻り値: 認証が成功した場合はユーザー情報、失敗した場合はnull
async function verifyUser(token: string): Promise<User | null> {
  // トークンの有効性をチェック
  const isValid = await validateToken(token);

  if (!isValid) {
    // トークンが無効な場合はnullを返す
    return null;
  }

  // データベースからユーザー情報を取得
  const user = await fetchUserFromDB(token);
  return user;
}
def calculate_scaffold_units(wall_length: float, height: float) -> int:
    """
    足場の必要単位数を計算する関数

    引数:
        wall_length: 壁の長さ（メートル）
        height: 足場の高さ（メートル）

    戻り値:
        必要な足場単位数（整数）
    """
    # 標準単位の長さは1.8m
    standard_unit_length = 1.8

    # 必要な水平方向の単位数を計算（切り上げ）
    horizontal_units = math.ceil(wall_length / standard_unit_length)

    # 必要な垂直方向の段数を計算（1段あたり1.5m）
    vertical_stages = math.ceil(height / 1.5)

    # 合計単位数を返す
    return horizontal_units * vertical_stages
Git Operations
mainブランチへのgit操作（push, merge, rebase等）は必ずユーザーに確認を取ること
確認なしでmainブランチに直接変更を加えることは禁止
ブランチ作成、featureブランチへのコミットは自由に実行可能
mainへのマージ前には必ず「mainブランチにマージしてもよろしいですか？」と確認
Commit Messages
コミットメッセージは日本語で記述すること
軽い関西弁のトーンで書くこと（親しみやすく、カジュアルな雰囲気）
何をしたのかが明確に分かるように具体的に記述
絵文字を適度に使用してコミット内容を視覚的に分かりやすく
コミットメッセージの例:

# ✅ 良い例
git commit -m "✨ OCR処理パイプラインを追加したで"
git commit -m "🐛 図面アップロード時のバグを修正しといた"
git commit -m "♻️ 足場計算ロジックをリファクタリングしたわ"
git commit -m "📝 READMEにセットアップ手順を追記しとく"
git commit -m "🎨 ダッシュボードのUIを改善したった"
git commit -m "🔧 Supabaseの設定ファイルを更新や"
git commit -m "✅ OCRサービスのテストを追加しといたで"
git commit -m "⚡ 画像処理のパフォーマンスを向上させたわ"

# ❌ 避けるべき例
git commit -m "Update code"  # 英語は避ける
git commit -m "修正"  # 何を修正したか不明
git commit -m "機能追加"  # 具体性がない
よく使う絵文字とその意味:

✨ 新機能追加
🐛 バグ修正
📝 ドキュメント更新
🎨 UI/スタイル改善
♻️ リファクタリング
⚡ パフォーマンス改善
🔧 設定ファイル変更
✅ テスト追加/更新
🚀 デプロイ関連
🔒 セキュリティ関連
Git操作の例:

# OK: featureブランチでの作業
git checkout -b feature/add-ocr-pipeline
git add .
git commit -m "✨ OCR処理パイプラインを実装したで"
git push origin feature/add-ocr-pipeline

# ⚠️ 確認必須: mainへのマージ
# 「mainブランチにマージしてもよろしいですか？変更内容: OCR処理パイプラインの追加」
# とユーザーに確認してから実行
git checkout main
git merge feature/add-ocr-pipeline
git push origin main

