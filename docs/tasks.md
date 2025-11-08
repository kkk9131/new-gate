# 実装タスクリスト

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **対象**: MVP実装
- **想定期間**: 7日間（最短）

---

## 📊 進捗管理

### 全体進捗

- [ ] Phase 1: 環境構築・基盤準備（1日目）
- [ ] Phase 2: データベースセットアップ（1日目）
- [ ] Phase 3: 認証機能実装（2日目）
- [ ] Phase 4: API実装 - プロジェクト管理（2-3日目）
- [ ] Phase 5: API実装 - 設定・売上（3-4日目）
- [ ] Phase 6: ChatKit統合（5-6日目）
- [ ] Phase 7: テスト・デプロイ（7日目）

---

## Phase 1: 環境構築・基盤準備 ⚙️

### 目標
開発環境のセットアップと必要なパッケージのインストール

### タスク

#### 1.1 依存パッケージのインストール

- [ ] Supabase関連パッケージのインストール
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

- [ ] ChatKit関連パッケージのインストール
```bash
npm install @openai/chatkit-react @openai/chatkit-js
```

- [ ] その他必要なパッケージ
```bash
npm install date-fns zod
npm install -D @types/node
```

#### 1.2 環境変数の設定

- [ ] `.env.local`ファイル作成
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (ChatKit用)
OPENAI_API_KEY=your-openai-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] `.env.example`ファイル作成（テンプレート）
- [ ] `.gitignore`に`.env.local`追加確認

#### 1.3 プロジェクト構造の作成

- [ ] ディレクトリ構造の作成
```bash
mkdir -p lib/supabase
mkdir -p lib/utils
mkdir -p lib/types
mkdir -p components/chat
mkdir -p components/projects
mkdir -p components/settings
mkdir -p components/revenues
```

#### 1.4 TypeScript型定義の作成

- [ ] `lib/types/database.ts` - データベース型定義
```typescript
// プロジェクト、設定、売上の型定義
export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'on_hold';
  startDate: string;
  endDate: string | null;
  budget: number;
  actualCost: number;
  userId: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// UserSettings, AppSettings, Revenue型も定義
```

- [ ] `lib/types/api.ts` - API型定義
```typescript
// APIレスポンス型
export interface APIResponse<T> {
  data: T;
}

export interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
```

#### 1.5 Supabaseクライアントの設定

- [ ] `lib/supabase/client.ts` - クライアントサイド用
```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export const createClient = () => {
  return createClientComponentClient();
};
```

- [ ] `lib/supabase/server.ts` - サーバーサイド用
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const createClient = () => {
  return createServerComponentClient({ cookies });
};
```

#### 1.6 共通ユーティリティの作成

- [ ] `lib/utils/error-handler.ts` - エラーハンドリング
- [ ] `lib/utils/validators.ts` - バリデーション（Zod使用）
- [ ] `lib/utils/format.ts` - 日付・金額フォーマット

### 完了条件

- [x] すべての依存パッケージがインストールされている
- [x] 環境変数が正しく設定されている
- [x] プロジェクト構造が作成されている
- [x] `npm run dev`でエラーなく起動できる

---

## Phase 2: データベースセットアップ 🗄️

### 目標
Supabaseプロジェクトの作成とデータベーススキーマの構築

### タスク

#### 2.1 Supabaseプロジェクトの作成

- [ ] Supabase（https://supabase.com）でプロジェクト作成
- [ ] プロジェクトURL、API Keyを取得
- [ ] `.env.local`に環境変数を設定

#### 2.2 データベーススキーマの作成

- [ ] Supabase Dashboard > SQL Editorを開く
- [ ] `database-schema.md`のSQLを順番に実行

**実行順序**:
1. [ ] `update_updated_at_column()`関数の作成
2. [ ] `projects`テーブル作成
3. [ ] `projects`のインデックス作成
4. [ ] `projects`のトリガー作成
5. [ ] `projects`のRLSポリシー設定
6. [ ] `user_settings`テーブル作成（同様の手順）
7. [ ] `app_settings`テーブル作成（同様の手順）
8. [ ] `revenues`テーブル作成（同様の手順）

#### 2.3 自動設定作成トリガーの設定

- [ ] `create_user_settings()`関数の作成
- [ ] `on_auth_user_created`トリガーの設定

#### 2.4 ビューの作成

- [ ] `project_revenue_summary`ビュー作成
- [ ] `monthly_revenue_summary`ビュー作成

#### 2.5 接続テスト

- [ ] `lib/supabase/test-connection.ts`作成
```typescript
import { createClient } from './client';

export async function testConnection() {
  const supabase = createClient();
  const { data, error } = await supabase.from('projects').select('count');
  console.log('Supabase接続テスト:', error ? 'エラー' : '成功');
  return !error;
}
```

- [ ] 接続テストの実行

### 完了条件

- [x] Supabaseプロジェクトが作成されている
- [x] すべてのテーブルが作成されている
- [x] RLSポリシーが正しく設定されている
- [x] Supabaseへの接続が確認できている

---

## Phase 3: 認証機能実装 🔐

### 目標
Supabase Authを使った認証機能の実装

### タスク

#### 3.1 認証ヘルパーの作成

- [ ] `lib/auth/server.ts` - サーバーサイド認証
```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function getUser() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function requireAuth() {
  const user = await getUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}
```

- [ ] `lib/auth/client.ts` - クライアントサイド認証

#### 3.2 API認証ミドルウェアの作成

- [ ] `lib/auth/api-middleware.ts`
```typescript
import { createClient } from '@/lib/supabase/server';

export async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED');
  }

  const token = authHeader.substring(7);
  const supabase = createClient();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error('UNAUTHORIZED');
  }

  return user;
}
```

#### 3.3 ログイン/ログアウトページの作成

- [ ] `app/login/page.tsx` - ログインページ
- [ ] `app/api/auth/callback/route.ts` - 認証コールバック

#### 3.4 認証状態管理（Zustand）

- [ ] `store/useStore.ts`を拡張
```typescript
interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
}

// Zustandストアに追加
```

### 完了条件

- [x] ユーザー登録・ログインができる
- [x] ログアウトができる
- [x] 認証状態が保持される
- [x] API認証ミドルウェアが動作する

---

## Phase 4: API実装 - プロジェクト管理 📦

### 目標
プロジェクト管理のCRUD API実装

### タスク

#### 4.1 プロジェクト一覧取得API

- [ ] `app/api/projects/route.ts` - GETハンドラー
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await requireAuth();

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // データ取得
    const supabase = createClient();
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### 4.2 プロジェクト作成API

- [ ] `app/api/projects/route.ts` - POSTハンドラー
- [ ] バリデーションスキーマ作成（Zod）
```typescript
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  budget: z.number().min(0),
  status: z.enum(['active', 'completed', 'on_hold']).optional(),
});
```

#### 4.3 プロジェクト詳細取得API

- [ ] `app/api/projects/[id]/route.ts` - GETハンドラー

#### 4.4 プロジェクト更新API

- [ ] `app/api/projects/[id]/route.ts` - PATCHハンドラー

#### 4.5 プロジェクト削除API

- [ ] `app/api/projects/[id]/route.ts` - DELETEハンドラー（ソフトデリート）

#### 4.6 エラーハンドリング共通化

- [ ] `lib/utils/api-error.ts`
```typescript
export function handleAPIError(error: any) {
  console.error('API Error:', error);

  if (error.message === 'UNAUTHORIZED') {
    return new Response(
      JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: '認証が必要です'
        }
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // その他のエラー...
}
```

### 完了条件

- [x] プロジェクト一覧が取得できる
- [x] プロジェクトが作成できる
- [x] プロジェクト詳細が取得できる
- [x] プロジェクトが更新できる
- [x] プロジェクトが削除できる
- [x] すべてのAPIでRLSが正しく動作する

---

## Phase 5: API実装 - 設定・売上 ⚙️💰

### 目標
設定管理・売上確認APIの実装

### タスク

#### 5.1 ユーザー設定API

- [ ] `app/api/settings/user/route.ts` - GET/PATCHハンドラー
- [ ] バリデーションスキーマ作成

#### 5.2 アプリ設定API

- [ ] `app/api/settings/app/route.ts` - GET/PATCHハンドラー
- [ ] バリデーションスキーマ作成

#### 5.3 売上一覧取得API

- [ ] `app/api/revenues/route.ts` - GETハンドラー
- [ ] 期間フィルタリング実装
- [ ] プロジェクトフィルタリング実装

#### 5.4 売上登録API

- [ ] `app/api/revenues/route.ts` - POSTハンドラー
- [ ] バリデーションスキーマ作成
- [ ] 税額自動計算ロジック

#### 5.5 売上詳細取得API

- [ ] `app/api/revenues/[id]/route.ts` - GETハンドラー

#### 5.6 売上更新API

- [ ] `app/api/revenues/[id]/route.ts` - PATCHハンドラー

#### 5.7 売上削除API

- [ ] `app/api/revenues/[id]/route.ts` - DELETEハンドラー

#### 5.8 売上集計API

- [ ] `app/api/revenues/summary/route.ts` - GETハンドラー
- [ ] 期間集計ロジック実装
- [ ] 月別グループ化実装
- [ ] プロジェクト別グループ化実装

### 完了条件

- [x] ユーザー設定の取得・更新ができる
- [x] アプリ設定の取得・更新ができる
- [x] 売上の全CRUD操作ができる
- [x] 売上集計が正しく計算される

---

## Phase 6: ChatKit統合 💬

### 目標
ChatKitの統合とチャットUIの実装

### タスク

#### 6.1 ChatKitセッションAPI

- [ ] `app/api/create-session/route.ts` - POSTハンドラー
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // OpenAI ChatKit APIにセッション作成リクエスト
    // ※ 実装は公式ドキュメント参照

    return NextResponse.json({
      data: {
        sessionId: 'session-id',
        token: 'session-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      }
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### 6.2 ChatKitコンポーネントの作成

- [ ] `components/chat/ChatInterface.tsx`
```typescript
'use client';

import { ChatKit } from '@openai/chatkit-react';

export function ChatInterface() {
  return (
    <div className="h-screen">
      <ChatKit
        sessionEndpoint="/api/create-session"
        // その他の設定
      />
    </div>
  );
}
```

#### 6.3 メインページへの統合

- [ ] `app/page.tsx`を更新
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

#### 6.4 チャットコマンド解釈ロジック

- [ ] `lib/chat/command-parser.ts`
```typescript
export function parseCommand(message: string) {
  // 「プロジェクト一覧」→ { type: 'list_projects' }
  // 「今月の売上」→ { type: 'revenue_summary', period: 'this_month' }
  // など
}
```

#### 6.5 AIレスポンス生成

- [ ] OpenAI APIとの連携実装
- [ ] コマンドに応じた適切なレスポンス生成

#### 6.6 ChatKitカスタマイズ

- [ ] スタイルのカスタマイズ（Tailwind CSS）
- [ ] 日本語対応の確認
- [ ] レスポンシブ対応

### 完了条件

- [x] ChatKitが正しく表示される
- [x] チャットでメッセージ送受信ができる
- [x] 基本的なコマンド解釈が動作する
- [x] AIレスポンスが返ってくる

---

## Phase 7: テスト・デプロイ 🚀

### 目標
動作確認、バグ修正、Vercelへのデプロイ

### タスク

#### 7.1 機能テスト

**プロジェクト管理**
- [ ] プロジェクト作成
- [ ] プロジェクト一覧表示
- [ ] プロジェクト詳細表示
- [ ] プロジェクト編集
- [ ] プロジェクト削除

**設定管理**
- [ ] ユーザー設定表示
- [ ] ユーザー設定変更
- [ ] アプリ設定表示
- [ ] アプリ設定変更

**売上確認**
- [ ] 売上登録
- [ ] 売上一覧表示
- [ ] 売上編集
- [ ] 売上削除
- [ ] 売上集計表示

**ChatUI**
- [ ] チャット送受信
- [ ] コマンド解釈
- [ ] 各機能との連携

#### 7.2 エラーハンドリングテスト

- [ ] 認証エラー時の挙動確認
- [ ] バリデーションエラー時の挙動確認
- [ ] 存在しないリソースへのアクセス
- [ ] ネットワークエラー時の挙動

#### 7.3 パフォーマンステスト

- [ ] ビルド時間の確認
- [ ] ページロード時間の確認
- [ ] Lighthouse スコア確認

#### 7.4 バグ修正

- [ ] 発見されたバグの修正
- [ ] コードレビュー
- [ ] リファクタリング

#### 7.5 Vercelデプロイ準備

- [ ] GitHubリポジトリへのプッシュ
- [ ] Vercelプロジェクト作成
- [ ] 環境変数の設定（Vercel Dashboard）
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

#### 7.6 デプロイ実行

- [ ] mainブランチへのマージ
- [ ] 自動デプロイの確認
- [ ] 本番環境での動作確認

#### 7.7 ドキュメント更新

- [ ] README.md更新
- [ ] CLAUDE.md更新
- [ ] デプロイ手順の記録

### 完了条件

- [x] すべての機能が正常動作する
- [x] 重大なバグがない
- [x] Vercelへのデプロイが完了している
- [x] 本番環境で動作確認できている

---

## 🎯 最終チェックリスト

### 機能
- [ ] プロジェクト管理（作成・一覧・詳細・編集・削除）
- [ ] 設定管理（ユーザー設定・アプリ設定）
- [ ] 売上確認（登録・一覧・編集・削除・集計）
- [ ] ChatUI（ChatKit統合）

### 技術
- [ ] Next.js 16 + React 19で動作
- [ ] Supabaseデータベース接続
- [ ] Supabase Auth認証
- [ ] ChatKit統合
- [ ] TypeScript厳格モード
- [ ] ESLintエラーなし

### デプロイ
- [ ] Vercelデプロイ完了
- [ ] 環境変数設定完了
- [ ] 本番環境で動作確認

### ドキュメント
- [ ] README.md更新
- [ ] 要件定義書完成
- [ ] データベーススキーマ文書化
- [ ] API設計書完成
- [ ] タスクリスト完了

---

## 📚 関連ドキュメント

- [MVP要件定義書](./mvp-requirements.md)
- [データベーススキーマ設計](./database-schema.md)
- [API設計書](./api-design.md)
- [README](../README.md)

---

## 🔄 次のステップ（MVP後）

- [ ] 見積機能の追加
- [ ] メール送信機能の追加
- [ ] 4分割UI実装
- [ ] 複数スクリーン動的生成
- [ ] ダッシュボード・分析機能
- [ ] モバイル対応
- [ ] テスト自動化
