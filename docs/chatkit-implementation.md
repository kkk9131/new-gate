# ChatKit実装ガイド（デスクトップUI統合版）

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **更新日**: 2025-11-09
- **参照**: OpenAI ChatKit公式ドキュメント
- **対象**: Next.js 16 + React 19 + デスクトップOS風UI

---

## 🎯 ChatKitの役割（新アーキテクチャ）

### UIレイアウト
```
┌─────────────────────────────────────────────────┬─────┐
│  Desktop Area (アプリアイコン、ウィンドウ)       │チャ │
│                                                 │ット │
│   [📁]    [⚙️]    [💰]    [📊]                 │     │
│  Projects Settings Revenue Dashboard            │固定 │
│                                                 │     │
│  ┌──────────────────┐                          │[💬] │
│  │ Window: Projects │                          │     │
│  │ Content...       │                          │常時 │
│  └──────────────────┘                          │表示 │
└─────────────────────────────────────────────────┴─────┘
```

### チャットの機能

**1. アプリ起動指示**
```
ユーザー: 「プロジェクト管理を開いて」
→ Projects アプリのウィンドウを開く

ユーザー: 「売上確認したい」
→ Revenue アプリを起動
```

**2. データ操作指示**
```
ユーザー: 「新しいプロジェクトを作成して」
→ POST /api/projects API呼び出し
→ 結果をチャットで報告

ユーザー: 「今月の売上を教えて」
→ GET /api/revenues?month=2025-01 呼び出し
→ 集計結果を返答
```

**3. エージェントタスク実行**
```
ユーザー: 「月次レポートを作成して」
→ Agent APIで task を作成
→ バックグラウンド実行
→ 完了通知
```

---

## 📦 インストール

### 必要なパッケージ

```bash
# ChatKit React パッケージ
npm install @openai/chatkit-react

# OpenAI SDK（サーバーサイド用）
npm install openai
```

---

## 🔐 認証フロー

ChatKitは**短期間有効なクライアントトークン**を使用します。

### セキュリティポリシー
- ❌ **クライアントで直接OpenAI APIキーを使用しない**
- ✅ **サーバーサイドでセッションを作成**
- ✅ **一時的なclient_secretをクライアントに返す**

### 認証フロー図

```
┌─────────────┐
│   Client    │
│ (Frontend)  │
└──────┬──────┘
       │ 1. セッション要求
       │    GET /api/create-session
       ▼
┌──────────────┐
│   Server     │  2. OpenAI Sessions APIを呼び出し
│  (Backend)   │     (OPENAI_API_KEY使用)
└──────┬───────┘
       │ 3. client_secret返却
       ▼
┌─────────────┐
│   Client    │  4. ChatKit初期化
│  (ChatKit)  │     (client_secret使用)
└─────────────┘
```

---

## 🛠️ 実装手順

### Step 1: サーバーサイド - セッションエンドポイント作成

#### Next.js API Route (`app/api/create-session/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // ユーザー識別（オプション）
    // 本番環境では認証されたユーザーIDを使用
    const body = await request.json();
    const userId = body.userId || 'anonymous';

    // ChatKitセッションの作成
    const session = await openai.chatkit.sessions.create({
      // Agent Builderで作成したワークフローIDを指定
      workflow_id: process.env.CHATKIT_WORKFLOW_ID!,

      // ユーザー固有の識別子（オプション）
      external_user_id: userId,

      // 追加のメタデータ（オプション）
      metadata: {
        source: 'web',
        timestamp: new Date().toISOString(),
      },
    });

    // client_secretをクライアントに返却
    return NextResponse.json({
      client_secret: session.client_secret,
    });
  } catch (error) {
    console.error('ChatKitセッション作成エラー:', error);

    return NextResponse.json(
      {
        error: {
          code: 'SESSION_CREATE_ERROR',
          message: 'セッションの作成に失敗しました'
        }
      },
      { status: 500 }
    );
  }
}
```

---

### Step 2: クライアントサイド - 右側固定チャットコンポーネント

#### React版 (`components/chat/ChatSidebar.tsx`)

```typescript
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useEffect, useState } from 'react';

export function ChatSidebar() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // セッション作成
  useEffect(() => {
    async function createSession() {
      try {
        const response = await fetch('/api/create-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: 'user-123', // 実際は認証されたユーザーID
          }),
        });

        if (!response.ok) {
          throw new Error('セッション作成に失敗しました');
        }

        const data = await response.json();
        setClientSecret(data.client_secret);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラー');
      } finally {
        setLoading(false);
      }
    }

    createSession();
  }, []);

  // ChatKit初期化
  const { control, methods } = useChatKit({
    api: {
      clientToken: clientSecret || '',
    },
    // テーマカスタマイズ（右側に合わせる）
    theme: {
      primaryColor: '#4F46E5',
      fontFamily: 'Inter, sans-serif',
    },
    // 初期メッセージ
    initialMessages: [
      {
        role: 'assistant',
        content: 'こんにちは！何かお手伝いできることはありますか？\n\n例:\n・「プロジェクト管理を開いて」\n・「新しいプロジェクトを作成して」\n・「今月の売上を教えて」',
      },
    ],
  });

  // ローディング状態
  if (loading) {
    return (
      <div className="w-80 border-l border-gray-200 flex items-center justify-center">
        <div className="text-sm text-gray-500">チャット読み込み中...</div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="w-80 border-l border-gray-200 flex items-center justify-center p-4">
        <div className="text-sm text-red-500">エラー: {error}</div>
      </div>
    );
  }

  // ChatKitレンダリング（右側固定）
  return (
    <div className="w-80 border-l border-gray-200 flex flex-col h-full">
      {/* ヘッダー */}
      <div className="h-16 border-b border-gray-200 flex items-center px-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💬</span>
          <span className="font-semibold text-gray-900">アシスタント</span>
        </div>
      </div>

      {/* ChatKit本体 */}
      <div className="flex-1 overflow-hidden">
        <ChatKit
          control={control}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
```

---

### Step 3: メインレイアウトへの統合

#### `app/layout.tsx` または `app/page.tsx`

```typescript
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { DesktopArea } from '@/components/desktop/DesktopArea';

export default function MainLayout() {
  return (
    <div className="h-screen flex">
      {/* 左側: デスクトップエリア */}
      <div className="flex-1 flex flex-col">
        <DesktopArea />
      </div>

      {/* 右側: チャットサイドバー（固定） */}
      <ChatSidebar />
    </div>
  );
}
```

---

## ⚙️ 環境変数設定

### `.env.local`

```env
# OpenAI API Key（サーバーサイドのみ）
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# ChatKit Workflow ID（Agent Builderで取得）
CHATKIT_WORKFLOW_ID=workflow_xxxxxxxxxxxxx

# ※ NEXT_PUBLIC_ プレフィックスは付けない！
# クライアントに公開されるとセキュリティリスク
```

---

## 🚨 重要な設定：ドメインAllowlist

### セキュリティ要件

ChatKitが動作するには、**OpenAI組織設定でドメインをAllowlistに追加**する必要があります。

### 設定手順

1. OpenAI Dashboard → Settings → Organization
2. ChatKit → Domain Allowlist
3. 以下のドメインを追加：
   ```
   localhost:3000          # ローカル開発用
   your-app.vercel.app     # Vercelプレビュー環境
   your-production.com     # 本番環境
   ```

### 設定しないと...
- ❌ ChatKitウィジェットが表示されない
- ❌ コンソールに403エラー
- ❌ 「Domain not allowed」エラー

---

## 🤖 Agent Builderでの設定

### ワークフローIDの取得方法

1. OpenAI Platform → Agent Builder
2. エージェントを作成・編集
3. 「Publish」ボタンをクリック
4. ワークフローIDが表示される（`workflow_xxxxx`形式）
5. `.env.local`に`CHATKIT_WORKFLOW_ID`として設定

### エージェントの設定例

```yaml
Name: 新時代SaaSアシスタント

Instructions (システムプロンプト):
  あなたは新時代SaaSのアシスタントです。
  ユーザーの指示に応じて以下の操作を実行してください：

  1. アプリ起動: 「〇〇を開いて」→ アプリウィンドウを開く
  2. データ操作: 「〇〇を作成して」→ API呼び出し
  3. エージェントタスク: 「〇〇を実行して」→ タスク作成

  利用可能なアプリ:
  - プロジェクト管理 (Projects)
  - 設定 (Settings)
  - 売上確認 (Revenue)
  - プラグインストア (Store)
  - エージェント (Agent)

  日本語で親しみやすく、わかりやすく回答してください。

Tools:
  - get_projects: プロジェクト一覧取得
  - create_project: プロジェクト作成
  - get_revenues: 売上データ取得
  - create_agent_task: エージェントタスク作成
  （Agent Builderでカスタム関数として定義）
```

---

## 🔧 高度な機能実装

### 1. アプリ起動指示の処理

#### `components/chat/ChatSidebar.tsx` に追加

```typescript
import { useDesktopStore } from '@/store/useDesktopStore';

export function ChatSidebar() {
  const { openApp } = useDesktopStore();

  const { control, methods } = useChatKit({
    api: { clientToken: clientSecret || '' },

    // カスタムアクションハンドラー
    onCustomAction: (action) => {
      if (action.type === 'open_app') {
        // アプリを開く
        openApp(action.appId);

        // 確認メッセージを送信
        methods.sendUserMessage(`${action.appName}を開きました`);
      }
    },
  });

  // ...
}
```

### 2. API呼び出し統合

Agent Builderのカスタム関数として以下を定義：

```javascript
// get_projects 関数
async function get_projects() {
  const response = await fetch('/api/projects', {
    headers: {
      'Authorization': `Bearer ${userToken}`,
    },
  });
  return await response.json();
}

// create_project 関数
async function create_project(name, description) {
  const response = await fetch('/api/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
    body: JSON.stringify({ name, description }),
  });
  return await response.json();
}
```

### 3. エージェントタスク実行

```javascript
// create_agent_task 関数
async function create_agent_task(taskName, workflow) {
  const response = await fetch('/api/agent/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      name: taskName,
      workflow: workflow,
    }),
  });
  return await response.json();
}
```

---

## 🎨 スタイリングカスタマイズ

### 右側固定レイアウトに最適化

```typescript
const { control } = useChatKit({
  api: { clientToken },

  // テーマカスタマイズ
  theme: {
    // プライマリカラー
    primaryColor: '#4F46E5',

    // フォント
    fontFamily: 'Inter, -apple-system, sans-serif',

    // ボーダー半径
    borderRadius: '0.5rem',

    // 背景色（右側に馴染むように）
    backgroundColor: '#FFFFFF',

    // メッセージ背景
    userMessageBackgroundColor: '#4F46E5',
    assistantMessageBackgroundColor: '#F3F4F6',
  },
});
```

---

## 🐛 トラブルシューティング

### 1. ストリーミングエラー

**エラー**: "Your organization must be verified to stream this model"

**解決策**:
- OpenAI Dashboardで組織を認証する
- Settings → Organization → Verification

### 2. ドメインエラー

**エラー**: "Domain not allowed"

**解決策**:
- OpenAI Dashboard → ChatKit → Domain Allowlistにドメイン追加
- `localhost:3000`も追加（開発環境用）

### 3. セッション作成失敗

**エラー**: "Session creation failed"

**確認事項**:
- ✅ `OPENAI_API_KEY`が正しく設定されているか
- ✅ `CHATKIT_WORKFLOW_ID`が正しいか
- ✅ Agent Builderでワークフローが公開されているか

### 4. ChatKitが表示されない

**確認事項**:
- ✅ `@openai/chatkit-react`がインストールされているか
- ✅ `client_secret`が正しく取得できているか
- ✅ ドメインがAllowlistに追加されているか
- ✅ ブラウザコンソールにエラーが出ていないか

### 5. 右側レイアウトが崩れる

**確認事項**:
- ✅ `w-80`（320px固定幅）が適用されているか
- ✅ 親要素が`flex`レイアウトになっているか
- ✅ `h-full`が正しく継承されているか

---

## 🔄 次のステップ

1. **基本実装**: ChatKitを右側に配置
2. **API統合**: Agent BuilderにAPI関数を登録
3. **アプリ起動連携**: チャットからアプリウィンドウを開く
4. **エージェント連携**: バックグラウンドタスク実行
5. **UI調整**: デザインシステムに統一

---

## 📚 参考リンク

- [ChatKit公式ドキュメント](https://openai.github.io/chatkit-js/)
- [公式スターターリポジトリ](https://github.com/openai/openai-chatkit-starter-app)
- [npmパッケージ](https://www.npmjs.com/package/@openai/chatkit-react)
- [Agent Builder](https://platform.openai.com/agent-builder)

---

## 関連ドキュメント

- [デスクトップUI設計書](./desktop-ui-design.md)
- [プラグインアーキテクチャ](./plugin-architecture.md)
- [エージェントシステム設計](./agent-system-design.md)
- [API設計書](./api-design.md)
- [実装タスクリスト](./tasks.md)
