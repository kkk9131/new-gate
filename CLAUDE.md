# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🎯 Project Overview

**新時代SaaS プラグインベースプラットフォーム** - 拡張可能なSaaSプラットフォーム with デスクトップOS風UI + 右側固定チャット

### アーキテクチャコンセプト

```
┌─────────────────────────────────────────────────┬─────┐
│  Desktop Area (アプリアイコングリッド)           │Chat │
│                                                 │     │
│   [📁]    [⚙️]    [💰]    [🏪]    [🤖]         │[💬] │
│  Projects Settings Revenue  Store  Agent        │     │
│                                                 │固定 │
│  ┌──────────────────┐                          │表示 │
│  │ Window: Projects │ ← ウィンドウは自由配置   │     │
│  │ [_][□][×]       │                          │     │
│  ├──────────────────┤                          │常時 │
│  │ Content...       │                          │対話 │
│  └──────────────────┘                          │可能 │
└─────────────────────────────────────────────────┴─────┘
```

### 3層アーキテクチャ

#### 1. **MVPレイヤー（Phase 1-8: 12-15日）**
- デスクトップOS風UI + 右側固定チャット
- デフォルトアプリ：Projects, Settings, Revenue
- すべての操作はチャット経由でAPI呼び出し

#### 2. **プラグインシステム（Phase 9-10: 8-10日）**
- プラグインストア（検索、インストール、レビュー）
- プラグイン実行環境（サンドボックス、権限管理）
- 開発者向けSDK・CLI

#### 3. **エージェントシステム（Phase 11: 5-7日）**
- YAMLワークフロー定義
- タスクスケジューラー（cron対応）
- バックグラウンド実行エンジン

---

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

---

## 🏗️ Architecture

### 状態管理戦略

**Zustand-based Multi-Store Pattern**:

```typescript
// Desktop UI状態管理
store/useDesktopStore.ts
  - openWindows: 開いているウィンドウ管理
  - openApp(appId): アプリ起動
  - closeWindow(windowId): ウィンドウ閉じる

// プラグイン状態管理
store/usePluginStore.ts
  - installedPlugins: インストール済みプラグイン
  - activePlugins: アクティブプラグイン
  - loadPlugin(pluginId): プラグイン読み込み

// チャット状態管理
store/useChatStore.ts
  - messages: メッセージ履歴
  - sendMessage(content): メッセージ送信
```

### UI構成

#### デスクトップエリア（左側）
- **Header**: ロゴ、開いているウィンドウタブ、4分割モード切替、ユーザーメニュー
- **Desktop Area**: アプリアイコングリッド（8列 × N行）
- **Windows**: 自由配置・リサイズ可能なウィンドウ（最大3-4個）

#### チャットサイドバー（右側）
- **固定幅**: 320px（w-80）
- **常時表示**: ページ遷移なし
- **機能**:
  - アプリ起動指示（「プロジェクト管理を開いて」）
  - データ操作指示（「新しいプロジェクトを作成して」）
  - エージェントタスク実行（「月次レポートを作成して」）
  - プラグイン管理（「売上プラグインをインストール」）

### プラグインアーキテクチャ

#### プラグインの構成
```
my-plugin/
├── plugin.json           # プラグインマニフェスト
├── index.tsx            # エントリーポイント
├── components/          # Reactコンポーネント
├── lib/                 # ビジネスロジック
└── types/               # 型定義
```

#### plugin.json 構造
```json
{
  "id": "com.example.my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "プラグインの説明",
  "entry": "index.tsx",
  "permissions": [
    "storage.read",
    "storage.write",
    "ui.window",
    "network.http"
  ],
  "author": {
    "name": "開発者名",
    "email": "dev@example.com"
  }
}
```

#### Core API利用
```typescript
import { usePluginContext } from '@platform/sdk/react';

function MyComponent() {
  const context = usePluginContext();

  // ストレージ操作
  await context.storage.set('key', 'value');
  const data = await context.storage.get('key');

  // UI操作
  context.ui.showNotification('保存しました', 'success');

  // HTTP通信
  const result = await context.http.get('/api/data');

  // エージェント実行
  await context.agent.executeTask({
    name: 'データ処理',
    steps: [...]
  });
}
```

### データベース構造

#### MVPテーブル（4テーブル）
- `projects` - プロジェクト管理
- `user_settings` - ユーザー設定
- `app_settings` - アプリケーション設定
- `revenues` - 売上データ

#### プラグインシステム（4テーブル）
- `store_plugins` - ストアプラグイン情報
- `plugin_installations` - ユーザーごとのインストール状態
- `plugin_permissions` - プラグイン権限管理
- `plugin_reviews` - プラグインレビュー

#### エージェントシステム（3テーブル）
- `agent_tasks` - タスク定義（YAML workflow）
- `agent_executions` - 実行履歴
- `agent_step_logs` - ステップごとのログ

---

## 📁 Key Files & Structure

```
new-gate/
├── app/
│   ├── layout.tsx                 # ルートレイアウト（日本語設定）
│   ├── page.tsx                   # デスクトップUI + チャット
│   ├── globals.css                # Tailwind CSS
│   └── api/
│       ├── projects/              # プロジェクト管理API
│       ├── settings/              # 設定API
│       ├── revenues/              # 売上API
│       ├── store/                 # プラグインストアAPI
│       ├── plugins/               # プラグイン管理API
│       └── agent/                 # エージェントAPI
│
├── components/
│   ├── desktop/
│   │   ├── DesktopArea.tsx       # デスクトップエリア
│   │   ├── AppIcon.tsx           # アプリアイコン
│   │   └── Window.tsx            # ウィンドウコンポーネント
│   ├── chat/
│   │   └── ChatSidebar.tsx       # 右側固定チャット
│   ├── plugins/
│   │   ├── PluginLoader.tsx      # プラグイン読み込み
│   │   └── StoreApp.tsx          # ストアアプリUI
│   └── agent/
│       └── AgentApp.tsx          # エージェントアプリUI
│
├── store/
│   ├── useDesktopStore.ts        # デスクトップUI状態管理
│   ├── usePluginStore.ts         # プラグイン状態管理
│   └── useChatStore.ts           # チャット状態管理
│
├── lib/
│   ├── plugins/
│   │   ├── loader.ts             # プラグインローダー
│   │   ├── sandbox.ts            # サンドボックス実行
│   │   └── permissions.ts        # 権限管理
│   └── agent/
│       ├── workflow-engine.ts    # ワークフローエンジン
│       └── scheduler.ts          # タスクスケジューラー
│
└── docs/
    ├── platform-requirements.md   # プラットフォーム全体要件
    ├── plugin-architecture.md     # プラグインシステム設計
    ├── agent-system-design.md     # エージェントシステム設計
    ├── plugin-store-design.md     # ストア設計
    ├── developer-guide.md         # プラグイン開発者ガイド
    ├── core-api-spec.md          # Core API仕様
    ├── desktop-ui-design.md      # デスクトップUI設計
    ├── chatkit-implementation.md # ChatKit実装ガイド
    ├── mvp-requirements.md       # MVP要件定義
    ├── database-schema.md        # データベーススキーマ
    ├── api-design.md             # API設計書
    ├── setup-guide.md            # セットアップガイド
    └── tasks.md                  # 実装タスクリスト
```

---

## 🔑 Development Guidelines

### 実装優先順位

#### Phase 1-8: MVP実装（12-15日）
1. **環境構築**（1-2日）
   - Supabase, OpenAI, Vercel設定
   - データベーステーブル作成
   - 環境変数設定

2. **認証システム**（2-3日）
   - Supabase Auth統合
   - ログイン/ログアウト機能

3. **デスクトップUI**（3-4日）
   - Header, DesktopArea, Window実装
   - アイコングリッド配置
   - ウィンドウ管理（開く、閉じる、移動、リサイズ）

4. **チャットUI**（2-3日）
   - ChatKit右側固定レイアウト
   - Agent Builder設定
   - カスタムアクション統合

5. **MVPアプリ実装**（4-5日）
   - Projects: CRUD + API
   - Settings: ユーザー設定・アプリ設定
   - Revenue: 売上データ管理・集計

#### Phase 9-10: プラグインシステム（8-10日）
6. **プラグインインフラ**（5日）
   - ストアAPI実装
   - プラグインローダー
   - サンドボックス実行環境

7. **開発者向けツール**（3-5日）
   - SDK開発（Core API実装）
   - CLI開発（プラグイン生成・デプロイ）
   - デベロッパーダッシュボード

#### Phase 11: エージェントシステム（5-7日）
8. **エージェント実装**（5-7日）
   - ワークフローエンジン
   - タスクスケジューラー
   - Agent UI

### 機能追加時のガイドライン

#### 1. プラグイン対応を考慮
- すべての新機能は「プラグインとして実装できるか？」を検討
- MVPアプリもプラグイン化可能な設計

#### 2. Core API経由での実装
- 直接的なDOM操作を避ける
- `context.ui`, `context.storage`, `context.http` 経由で実装

#### 3. チャット統合
- すべての機能はチャット経由で操作可能にする
- Agent Builderにカスタム関数を登録

#### 4. 権限管理
- 新しいAPI呼び出しには適切な権限チェックを実装
- RLS（Row Level Security）を活用

### Git操作のガイドライン

#### ⚠️ 重要: Git操作は必ずユーザーの明示的な指示を待つこと

**禁止事項**:
- ❌ **mainブランチへの直接操作**: push, merge, rebase等は絶対禁止
- ❌ **devブランチへの直接commit/push**: 必ずfeatureブランチ経由で作業
- ❌ **勝手なマージ**: ユーザーの明示的な指示なしにマージしない
- ❌ **勝手なpush**: コミット後、pushはユーザーに確認を取る

**作業フロー**:
1. **新機能開発**: 必ずfeatureブランチ（worktree）で作業
   - 例: `feature/calendar-app`, `feature/revenue-app`
2. **コミット**: featureブランチでコミット
3. **push確認**: 「pushしますか？」とユーザーに確認
4. **マージ確認**: 「devにマージしますか？」とユーザーに確認

**例外**: featureブランチへのcommitとpushのみ自動実行可（ただし確認推奨）

#### Git Worktreeでの作業方法

**Worktree構造**:
```
/Users/kazuto/Desktop/new-gate            # devブランチ (メイン)
/Users/kazuto/Desktop/new-gate-calendar   # feature/calendar-app
/Users/kazuto/Desktop/new-gate-revenue    # feature/revenue-app
/Users/kazuto/Desktop/new-gate-settings   # feature/notification-system
```

**⚠️ 重要: Bashコマンドはworktreeディレクトリで実行すること**

Bashツールは実行後に自動的に元のディレクトリ（`/Users/kazuto/Desktop/new-gate`）に戻るため、**各コマンドの前に必ずcdを付ける**:

```bash
# ❌ 間違い（devブランチで実行されてしまう）
git add -A

# ✅ 正しい（feature/calendar-appで実行）
cd /Users/kazuto/Desktop/new-gate-calendar && git add -A
cd /Users/kazuto/Desktop/new-gate-calendar && git commit -m "..."
cd /Users/kazuto/Desktop/new-gate-calendar && git push origin feature/calendar-app
```

**Worktree作業フロー**:
1. **ブランチ確認**: `cd /path/to/worktree && git branch --show-current`
2. **ファイル編集**: Read/Edit/Writeは通常通り絶対パスで実行
3. **Git操作**: 必ず `cd /path/to/worktree &&` を前置

**Worktree一覧確認**:
```bash
git worktree list
```

### Component Development

#### Tailwind CSS使用規則
- プリセットカラー: `bg-indigo-600` (primary), `bg-gray-100` (background)
- レスポンシブ: モバイルファーストデザイン
- ダークモード: 準備中（`dark:` prefix使用可能）

#### アクセシビリティ
- すべてのボタンに`aria-label`を付与
- キーボードナビゲーション対応
- WAI-ARIA準拠

#### 日本語サポート
- すべてのUIテキストは日本語
- `lang="ja"`をルートレイアウトで設定済み
- 日付フォーマット: `date-fns`の`ja`ロケール使用

---

## 🌐 Tech Stack

### フロントエンド
- **Next.js 16** (App Router, TypeScript)
- **React 19** (latest)
- **ChatKit** (@openai/chatkit-react) - 右側固定チャットUI
- **Zustand** (state management)
- **Tailwind CSS** (styling)
- **TypeScript 5.9** (strict mode)

### バックエンド
- **Next.js API Routes** - RESTful API（32エンドポイント）
- **Next.js Server Actions** - サーバーサイドロジック
- **Supabase** - PostgreSQL database & authentication（11テーブル）
- **Supabase Client** - Database connection

### 開発ツール
- **Vercel** - Hosting & deployment
- **GitHub** - Version control
- **ESLint** - Linting
- **Prettier** - Code formatting

---

## 📚 Documentation

### プラットフォーム設計ドキュメント
完全な設計仕様は以下を参照：

#### 基本設計（必読）
- **[プラットフォーム要件定義](./docs/platform-requirements.md)** - 全体コンセプト、ビジョン
- **[プラグインアーキテクチャ](./docs/plugin-architecture.md)** - プラグインシステム設計
- **[デスクトップUI設計](./docs/desktop-ui-design.md)** - UI仕様、レイアウト

#### プラグイン開発（プラグイン実装時）
- **[開発者ガイド](./docs/developer-guide.md)** - SDK・CLI使用方法
- **[Core API仕様](./docs/core-api-spec.md)** - 利用可能なAPI一覧
- **[プラグインストア設計](./docs/plugin-store-design.md)** - ストア仕様

#### エージェント（自動化実装時）
- **[エージェントシステム設計](./docs/agent-system-design.md)** - ワークフロー、スケジューラー

#### 実装ガイド
- **[セットアップガイド](./docs/setup-guide.md)** - 開発環境構築手順
- **[ChatKit実装ガイド](./docs/chatkit-implementation.md)** - チャット統合方法
- **[MVP要件定義](./docs/mvp-requirements.md)** - MVP機能要件
- **[データベーススキーマ](./docs/database-schema.md)** - テーブル定義、RLS設定
- **[API設計書](./docs/api-design.md)** - エンドポイント仕様
- **[実装タスクリスト](./docs/tasks.md)** - Phase 1-11の詳細タスク

### 実装開始時のワークフロー

#### Step 1: ドキュメント理解
```bash
# 1. プラットフォーム全体像を把握
docs/platform-requirements.md を読む

# 2. 担当フェーズの仕様確認
docs/tasks.md で実装フェーズを確認

# 3. 該当する設計ドキュメントを読む
docs/plugin-architecture.md      # プラグイン実装時
docs/agent-system-design.md      # エージェント実装時
docs/desktop-ui-design.md        # UI実装時
```

#### Step 2: 技術仕様確認
```bash
# データベース構造
docs/database-schema.md

# API仕様
docs/api-design.md

# Core API（プラグイン開発時）
docs/core-api-spec.md
```

#### Step 3: 実装開始
```bash
# タスクリストに従って実装
docs/tasks.md のチェックリストを確認

# セットアップが必要な場合
docs/setup-guide.md を実行
```

---

## 🔧 Development Best Practices

### コーディング規約

#### TypeScript
- **型定義**: すべての関数に型を明示
- **null安全**: `?.` optional chaining使用
- **型推論**: 明示的な型アノテーションを優先

#### React
- **関数コンポーネント**: すべてのコンポーネントは関数型
- **Hooks**: useState, useEffect, カスタムHooks活用
- **Props型定義**: interfaceで明示

#### API設計
- **RESTful**: GET, POST, PATCH, DELETE使い分け
- **エラーハンドリング**: 統一したエラーレスポンス形式
- **認証**: Bearer token使用

### セキュリティ

#### 環境変数管理
```env
# ❌ クライアント公開（NEXT_PUBLIC_プレフィックス）
NEXT_PUBLIC_SUPABASE_URL=xxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx

# ✅ サーバーサイドのみ
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=xxx
```

#### RLS（Row Level Security）
- すべてのSupabaseテーブルでRLS有効化
- ユーザーごとのデータ分離
- プラグインごとの権限制御

#### プラグインサンドボックス
- DOM直接操作を禁止
- Core API経由のみ操作許可
- 権限チェック実装

---

## 🐛 Troubleshooting

### よくある問題と解決策

#### ChatKitが表示されない
```bash
# 1. Domain Allowlist確認
OpenAI Dashboard → ChatKit → Domain Allowlist
→ localhost:3000 を追加

# 2. Workflow ID確認
.env.local の CHATKIT_WORKFLOW_ID が正しいか確認

# 3. 組織認証確認
OpenAI組織がストリーミング用に認証されているか確認
```

#### Supabase接続エラー
```bash
# 1. 環境変数確認
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. RLS設定確認
Supabase Dashboard → Authentication → RLS Policies

# 3. 接続テスト
npm run dev でブラウザコンソールを確認
```

#### プラグインが読み込めない
```bash
# 1. plugin.json検証
plugin.jsonの構文が正しいか確認

# 2. 権限確認
必要な権限がpermissions配列に含まれているか

# 3. エントリーポイント確認
entryで指定したファイルが存在するか
```

---

## 📝 Notes

### 重要な設計決定
- **チャット中心**: すべての操作はチャット経由で実行可能
- **プラグイン化**: MVPアプリもプラグインとして再実装可能
- **API駆動**: UIは直接データを操作せず、API経由で実行
- **拡張性優先**: 将来の機能追加を見据えた設計

### 制約事項
- デスクトップ画面のみ対応（モバイル未対応）
- 同時オープンウィンドウ数: 最大3-4個
- プラグインサンドボックス: DOM直接操作不可

### 将来の拡張予定
- 4分割モード完全実装
- モバイル対応
- オフラインモード
- プラグインマーケットプレイス

---

## 🌏 Communication Guidelines for Claude Code

### Core Principles
- **正確性を最優先**: わからないことは「わからない」と正直に伝える
- **ハルシネーション（幻覚）を避ける**: 推測や憶測で答えない。確実な情報のみを提供
- **できないことは明確に伝える**: 技術的制約や実装の難しさを隠さない
- **質問を恐れない**: 曖昧な要件や不明点は必ずユーザーに確認する
- **タスクチケットを正確に読む**: 思い込みではなく、ドキュメントの記載内容に従う

### Output Language
**すべての出力は日本語で行うこと (All outputs must be in Japanese)**
- コード説明、エラーメッセージ、提案、進捗報告などは日本語で記述
- ユーザーとのコミュニケーションは常に日本語を使用

### Code Comments
コード内には**初心者でも理解できる日本語コメント**を必ず記述：
- 複雑なロジックには処理の意図を日本語で説明
- 関数やクラスの説明にはJSDoc/Docstring形式で日本語ドキュメントを追加
- 変数名は英語でも、その役割をコメントで日本語説明

**コメント例**:
```typescript
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
```

### Git Operations
- **mainブランチへのgit操作**（push, merge, rebase等）は**必ずユーザーに確認を取ること**
- 確認なしでmainブランチに直接変更を加えることは**禁止**
- ブランチ作成、featureブランチへのコミットは自由に実行可能
- mainへのマージ前には必ず「**mainブランチにマージしてもよろしいですか？**」と確認

### Commit Messages
- コミットメッセージは**日本語**で記述すること
- **軽い関西弁のトーン**で書くこと（親しみやすく、カジュアルな雰囲気）
- 何をしたのかが明確に分かるように**具体的に記述**
- **絵文字を適度に使用**してコミット内容を視覚的に分かりやすく

**コミットメッセージの例**:
```bash
# ✅ 良い例
git commit -m "✨ プラグインローダー機能を追加したで"
git commit -m "🐛 チャットUIのレイアウト崩れを修正しといた"
git commit -m "♻️ Core API実装をリファクタリングしたわ"
git commit -m "📝 プラグイン開発ガイドを更新しとく"
git commit -m "🎨 デスクトップUIのアイコン配置を改善したった"

# ❌ 避けるべき例
git commit -m "Update code"  # 英語は避ける
git commit -m "修正"  # 何を修正したか不明
git commit -m "機能追加"  # 具体性がない
```

**よく使う絵文字とその意味**:
- ✨ 新機能追加
- 🐛 バグ修正
- 📝 ドキュメント更新
- 🎨 UI/スタイル改善
- ♻️ リファクタリング
- ⚡ パフォーマンス改善
- 🔧 設定ファイル変更
- ✅ テスト追加/更新
- 🚀 デプロイ関連
- 🔒 セキュリティ関連
- 🔌 プラグイン関連
- 🤖 エージェント関連

**Git操作の例**:
```bash
# OK: featureブランチでの作業
git checkout -b feature/plugin-loader
git add .
git commit -m "✨ プラグインローダーを実装したで"
git push origin feature/plugin-loader

# ⚠️ 確認必須: mainへのマージ
# 「mainブランチにマージしてもよろしいですか？変更内容: プラグインローダーの追加」
# とユーザーに確認してから実行
git checkout main
git merge feature/plugin-loader
git push origin main
```
