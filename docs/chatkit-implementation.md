# ChatKit実装ガイド

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **参照**: OpenAI ChatKit公式ドキュメント
- **対象**: Next.js 16 + React 19

---

## 🎯 ChatKitとは

OpenAIが提供するフロントエンド向けJavaScriptツールキットで、カスタムAIチャット体験をWebサイトに埋め込むことができます。

### 主な特徴
- ✅ すぐに使えるチャットUIコンポーネント
- ✅ AgentKitで作成したエージェントとの統合
- ✅ ストリーミング対応
- ✅ セキュアな認証フロー
- ✅ フレームワーク非依存（Web Components）

---

## 📦 インストール

### 必要なパッケージ

```bash
# ChatKit React パッケージ
npm install @openai/chatkit-react

# または JavaScript版
npm install @openai/chatkit-js

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

### Step 2: クライアントサイド - ChatKitコンポーネント作成

#### React版 (`components/chat/ChatInterface.tsx`)

```typescript
'use client';

import { ChatKit, useChatKit } from '@openai/chatkit-react';
import { useEffect, useState } from 'react';

export function ChatInterface() {
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
  const { control } = useChatKit({
    api: {
      clientToken: clientSecret || '',
    },
  });

  // ローディング状態
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">チャットを読み込み中...</div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">エラー: {error}</div>
      </div>
    );
  }

  // ChatKitレンダリング
  return (
    <div className="h-screen w-full">
      <ChatKit
        control={control}
        className="h-full w-full"
      />
    </div>
  );
}
```

---

### Step 3: メインページへの統合

#### `app/page.tsx`

```typescript
import { ChatInterface } from '@/components/chat/ChatInterface';

export default function Home() {
  return (
    <main className="h-screen">
      <ChatInterface />
    </main>
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

## 🔧 高度な設定

### useChatKit フックのメソッド

```typescript
const { control, methods } = useChatKit({
  api: { clientToken },
});

// メソッド一覧
methods.focusComposer();              // 入力欄にフォーカス
methods.setThreadId('thread-123');    // スレッドID設定
methods.sendUserMessage('こんにちは');  // メッセージ送信
methods.setComposerValue('テキスト');   // 入力欄の値設定
methods.fetchUpdates();               // 更新取得
methods.sendCustomAction({ ... });    // カスタムアクション
```

### カスタマイズ例

```typescript
const { control } = useChatKit({
  api: {
    clientToken,
  },
  // テーマカスタマイズ
  theme: {
    primaryColor: '#4F46E5',
    fontFamily: 'Inter, sans-serif',
  },
  // 初期メッセージ
  initialMessages: [
    {
      role: 'assistant',
      content: 'こんにちは！何かお手伝いできることはありますか？',
    },
  ],
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

---

## 📊 Agent Builder連携

### ワークフローIDの取得方法

1. OpenAI Platform → Agent Builder
2. エージェントを作成・編集
3. 「Publish」ボタンをクリック
4. ワークフローIDが表示される（`workflow_xxxxx`形式）
5. `.env.local`に`CHATKIT_WORKFLOW_ID`として設定

### エージェントの設定

Agent Builderで以下を設定：
- **Name**: エージェント名
- **Instructions**: システムプロンプト
- **Tools**: 使用するツール（関数呼び出し等）
- **Knowledge**: アップロードしたファイル

---

## 🔄 次のステップ

1. **基本実装**: 上記のコードでChatKitを動作させる
2. **カスタマイズ**: テーマ、スタイリングを調整
3. **機能統合**: プロジェクト管理・売上確認APIとの連携
4. **コマンド解釈**: ユーザーメッセージから意図を抽出
5. **レスポンス生成**: APIデータを使ったAI応答

---

## 📚 参考リンク

- [ChatKit公式ドキュメント](https://openai.github.io/chatkit-js/)
- [公式スターターリポジトリ](https://github.com/openai/openai-chatkit-starter-app)
- [npmパッケージ](https://www.npmjs.com/package/@openai/chatkit-react)
- [Agent Builder](https://platform.openai.com/agent-builder)

---

## 関連ドキュメント

- [MVP要件定義書](./mvp-requirements.md)
- [API設計書](./api-design.md)
- [実装タスクリスト](./tasks.md)
