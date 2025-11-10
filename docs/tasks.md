# 実装タスクリスト

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **対象**: MVP実装
- **想定期間**: 7日間（最短）

---

## 📊 進捗管理

### 全体進捗（MVP Phase）

- [x] Phase 1: 環境構築・基盤準備（1日目）✅ 完了
- [x] Phase 2: データベースセットアップ（1日目）✅ 完了
- [x] Phase 3: Desktop UI基盤構築（2-4日目）✅ 完了（基本レイアウト・アイコン・Window管理・分割モード完了、ChatPanel未実装）
- [x] Phase 4: 認証機能実装（5日目）✅ 完了
- [ ] Phase 5: API実装 - プロジェクト管理（6-7日目）← **次のフェーズ**
- [ ] Phase 6: API実装 - 設定・売上（8-9日目）
- [ ] Phase 7: Agent Builder + ChatKit統合（10-11日目）
- [ ] Phase 8: テスト・デプロイ（12日目）

**MVP見積もり総日数**: 12-15日（Desktop UI実装を含む）

---

### プラグインシステム Phase

- [ ] Phase 9: プラグインシステム実装（13-17日目）
  - [ ] データベース（store_plugins, plugin_installations等）
  - [ ] プラグインストアAPI（17-24エンドポイント）
  - [ ] StoreAppコンポーネント実装
  - [ ] プラグイン動的ロード機能
- [ ] Phase 10: 開発者向け機能実装（18-20日目）
  - [ ] Core APIライブラリ（@platform/sdk）
  - [ ] Plugin SDKとCLI
  - [ ] 開発者ダッシュボード

**プラグインシステム見積もり総日数**: 8-10日

---

### エージェントシステム Phase

- [ ] Phase 11: エージェントシステム実装（21-25日目）
  - [ ] データベース（agent_tasks, agent_executions等）
  - [ ] エージェントAPI（25-32エンドポイント）
  - [ ] AgentAppコンポーネント実装
  - [ ] Workflow Executor Engine
  - [ ] Cron Scheduler実装

**エージェントシステム見積もり総日数**: 5-7日

---

**全体見積もり総日数**: 25-32日（MVP + プラグイン + エージェント）

**実装優先順位の考え方**
1. **UI構築優先**: Desktop OS風UIを先に実装し、ユーザー体験の基盤を構築
2. **段階的機能追加**: UI完成後に認証→API→ChatKit統合の順で機能を追加
3. **プラグイン基盤**: MVPアプリをプラグイン化してプラグインシステムの実証
4. **AIエージェント対応**: すべてのAPIはAIエージェントから呼び出し可能な設計とする
5. **最終統合**: Agent Builderでワークフロー構築→ChatKit統合の順

---

## Phase 1: 環境構築・基盤準備 ⚙️

### 目標
開発環境のセットアップと必要なパッケージのインストール

### タスク

#### 1.1 依存パッケージのインストール

- [x] Supabase関連パッケージのインストール ✅
```bash
npm install @supabase/supabase-js @supabase/ssr
```

- [x] ChatKit関連パッケージのインストール ✅
```bash
npm install @openai/chatkit-react openai
```

- [x] その他必要なパッケージ ✅
```bash
npm install date-fns zod
npm install -D @types/node
```

#### 1.2 環境変数の設定

- [x] `.env.local`ファイル作成 ✅
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

- [x] `.env.example`ファイル作成（テンプレート）✅
- [x] `.gitignore`に`.env.local`追加確認 ✅

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

- [x] すべての依存パッケージがインストールされている ✅
- [x] 環境変数が正しく設定されている ✅
- [ ] プロジェクト構造が作成されている（次タスク）
- [x] `npm run dev`でエラーなく起動できる ✅

**Phase 1 実装状況**: セットアップ準備完了、実装コードは次フェーズ

---

## Phase 2: データベースセットアップ 🗄️

### 目標
Supabaseプロジェクトの作成とデータベーススキーマの構築

### タスク

#### 2.1 Supabaseプロジェクトの作成

- [x] Supabase（https://supabase.com）でプロジェクト作成 ✅
- [x] プロジェクトURL、API Keyを取得 ✅
- [x] `.env.local`に環境変数を設定 ✅

#### 2.2 データベーススキーマの作成

- [ ] Supabase Dashboard > SQL Editorを開く
- [ ] `database-schema.md`のSQLを順番に実行（実装時に実施）

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

- [x] Supabaseプロジェクトが作成されている ✅
- [ ] すべてのテーブルが作成されている（実装時に実施）
- [ ] RLSポリシーが正しく設定されている（実装時に実施）
- [ ] Supabaseへの接続が確認できている（実装時に実施）

**Phase 2 実装状況**: Supabaseプロジェクト作成済み、スキーマ構築は実装時に実施

---

## Phase 3: Desktop UI基盤構築 🖥️

### 目標
Desktop OS風UIの実装（Window管理、AppIcon、ChatPanel、4分割モード）

### 参照ドキュメント
- `docs/desktop-ui-design.md` - 完全な設計仕様

### タスク

#### 3.1 必要なパッケージのインストール

- [x] Window管理・UI関連パッケージ ✅
```bash
npm install react-rnd @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install react-resizable-panels  # ChatPanel実装時に必要
npm install react-icons
```

#### 3.2 Zustand状態管理の拡張

- [x] `store/desktopStore.ts` - Desktop UI状態管理（基本実装完了）✅
```typescript
interface App {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType;
  position: { x: number; y: number };
  gridIndex: number;
}

interface Window {
  id: string;
  appId: string;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  zIndex: number;
}

interface DesktopState {
  // Apps
  apps: App[];
  addApp: (app: App) => void;
  updateAppPosition: (id: string, position: { x: number; y: number }) => void;
  reorderApps: (oldIndex: number, newIndex: number) => void;

  // Windows
  windows: Window[];
  openWindow: (appId: string) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  updateWindowPosition: (id: string, position: { x: number; y: number }) => void;
  updateWindowSize: (id: string, size: { width: number; height: number }) => void;
  bringToFront: (windowId: string) => void;

  // Chat Panel
  isChatOpen: boolean;
  chatWidth: number;
  toggleChat: () => void;
  setChatWidth: (width: number) => void;

  // Quad Mode
  isQuadMode: boolean;
  quadScreens: QuadScreenConfig;
  toggleQuadMode: () => void;
  setQuadScreen: (position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight', appId: string) => void;
}
```

#### 3.3 デスクトップレイアウトコンポーネント

- [x] `components/desktop/DesktopLayout.tsx` - メインレイアウト ✅
```typescript
// Header（64px固定）
// Desktop Area（アイコングリッド + ウィンドウエリア）
// Chat Panel（右側、リサイズ可能 300-600px）
```

#### 3.4 AppIconグリッド実装

- [x] `components/desktop/AppIcon.tsx` - AppIconコンポーネント実装済み ✅
- [x] DesktopLayout.tsx内でグリッド表示実装済み ✅
```typescript
// @dnd-kit/sortableでドラッグ＆ドロップ ✅
// 80x80pxアイコン ✅
// グリッドレイアウト（8列自動調整） ✅
// ダブルクリックでウィンドウ起動（機能は未実装、Window管理システム実装後に追加）
```

#### 3.5 Window管理システム実装

- [x] `components/desktop/WindowManager.tsx` ✅
```typescript
// react-rndでドラッグ＆リサイズ ✅
// Z-index管理（クリックで最前面） ✅
// 最大3-4ウィンドウ（超過時はタブ化） ✅
// 最小化・最大化・閉じる ✅
```

- [x] `components/desktop/Window.tsx` - 個別ウィンドウ ✅
```typescript
// タイトルバー（ドラッグハンドル） ✅
// 制御ボタン（最小化・最大化・閉じる） ✅
// リサイズハンドル ✅
// コンテンツエリア ✅
```

- [x] アプリコンポーネント8つ作成 ✅
  - DashboardApp, ProjectsApp, SettingsApp, RevenueApp
  - StoreApp, AgentApp, AnalyticsApp, CalendarApp

#### 3.6 ChatPanel実装

- [ ] `components/desktop/ChatPanel.tsx`
```typescript
// react-resizable-panelsでリサイズ
// トグルボタン（開閉）
// 幅をlocalStorageに保存
// アニメーション付きスライド表示
```

#### 3.7 分割モード実装（2/3/4分割対応）

- [x] `components/desktop/SplitMode.tsx` ✅
```typescript
// 2分割: 左右（50%ずつ） ✅
// 3分割: 左50% + 右上25% + 右下25% ✅
// 4分割: 2x2グリッド（各25%） ✅
// 各スクリーンにApp割り当てドロップダウン ✅
// 終了ボタンでデスクトップに戻る ✅
```

- [x] Headerに分割ボタン追加 ✅
```typescript
// クリックで1→2→3→4→1と段階的に切り替え ✅
// splitModeに応じてアイコン変化（通常/2分割/3分割/4分割） ✅
```

#### 3.8 初期アプリ登録

- [x] デフォルトアプリの定義 ✅
```typescript
const defaultApps: App[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: <RiDashboardLine size={32} />,
    component: DashboardApp,
    position: { x: 0, y: 0 },
    gridIndex: 0,
  },
  {
    id: 'projects',
    name: 'Projects',
    icon: <RiFolderLine size={32} />,
    component: ProjectsApp,
    position: { x: 0, y: 0 },
    gridIndex: 1,
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: <RiSettingsLine size={32} />,
    component: SettingsApp,
    position: { x: 0, y: 0 },
    gridIndex: 2,
  },
  {
    id: 'revenues',
    name: 'Revenues',
    icon: <RiMoneyDollarCircleLine size={32} />,
    component: RevenuesApp,
    position: { x: 0, y: 0 },
    gridIndex: 3,
  },
];
```

### 完了条件

- [x] デスクトップレイアウトが表示される ✅
- [x] アプリアイコンがグリッド表示される ✅
- [x] アイコンをドラッグ＆ドロップで並び替えできる ✅
- [x] アイコンダブルクリックでウィンドウが開く ✅
- [x] ウィンドウをドラッグ＆リサイズできる ✅
- [x] ウィンドウの最小化・最大化・閉じるが動作する ✅
- [x] Headerにウィンドウタブ表示＆最小化復元 ✅
- [ ] ChatPanelが開閉・リサイズできる（未実装）
- [x] 分割モードが動作する（2/3/4分割対応） ✅
- [x] 状態がlocalStorageに保存される ✅

**Phase 3 実装期間**: 2-4日

---

## Phase 4: 認証機能実装 🔐

### 目標
Supabase Auth（メール+パスワード / Google OAuth）で認証を実装し、Desktop UI 全体を認証ガード下に置く。未ログイン時は `/login` にリダイレクトし、ログイン/サインアップ/ログアウトの一連の UX を整える。

### 前提

- Supabase プロジェクトは Phase2 までに作成済み
- `.env.local` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を設定済み
- 認証関連の UI もデスクトップ調のデザインで統一する

### タスク

#### 4.1 Supabase クライアントユーティリティ整備

- [x] `lib/supabase/` ディレクトリを新設し、以下を実装 ✅
  - `client.ts`: `createBrowserClient()` をラップし、CSR 用のクライアントを返す
  - `server.ts`: `createServerComponentClient({ cookies })` を返すヘルパー
  - `route.ts`: `createRouteHandlerClient({ cookies })` を返し、API Route からセッション Cookie を検証できるようにする
- [x] 上記 3 ファイルで共通の型定義（例: `Database`）を import できるよう `types/database.ts` を用意する ✅

#### 4.2 認証ヘルパーとリダイレクト制御

- [x] `lib/auth/session.ts`（仮）を作成し、`getUserOnServer()`, `requireAuth()`、`signOut()` を提供 ✅
- [x] `app/(protected)/layout.tsx` を追加し、`requireAuth()` で未認証時は `redirect('/login')` ✅
- [x] `app/page.tsx` を `(protected)` 配下に移動して Desktop UI を保護 ✅
- [x] ルートレイアウトに `AuthListener` コンポーネントを組み込み、セッション変化を拾えるようにする ✅

#### 4.3 認証 UI（ログイン / サインアップ / ログアウト）

- [x] `app/login/page.tsx` を実装 ✅
  - メール+パスワードのログインフォーム
  - 未登録ユーザーへのリンク
  - デスクトップUIと統一された配色（accent-sand）
- [x] `app/signup/page.tsx` を実装（メール+パスワード登録、成功時の遷移パターンを決める）✅
- [x] ログアウト導線を追加（Desktop ヘッダーの UserMenu コンポーネント）✅
- [x] `app/api/auth/callback/route.ts` で OAuth のリダイレクト後処理を行い、`/` に戻す ✅
- [x] プロフィールページ `app/(protected)/profile/page.tsx` を実装 ✅
  - ユーザー情報表示（メール、ID、作成日）
  - パスワード変更機能
  - デスクトップに戻るボタン

#### 4.4 Zustand 認証ストア

- [x] `store/authStore.ts` を新設し、以下の state/actions を持たせる ✅
  ```ts
  interface AuthState {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isInitialized: boolean;
    setAuth: (payload: { user: User | null; session: Session | null }) => void;
    clearAuth: () => void;
    setLoading: (value: boolean) => void;
    setInitialized: (value: boolean) => void;
  }
  ```
- [x] `store/desktopStore.ts` とは分離し、Desktop UI から `useAuthStore` を参照してヘッダーや各アプリでユーザー情報を使えるようにする ✅
- [x] Supabase の `onAuthStateChange` で Zustand を更新する `AuthListener` コンポーネントを追加 ✅

#### 4.5 API Route の認証ガード

- [x] `lib/auth/verify-api.ts` を作り、`createClient()` 経由で `supabase.auth.getUser()` を実行し、未認証なら 401 JSON を返すユーティリティを用意 ✅
  - `verifyApiAuth()`: ユーザー取得または null を返す
  - `requireApiAuth()`: ユーザー取得または 401 レスポンスを返す
  - `verifyResourceOwnership()`: リソースの所有者確認
  - `UNAUTHORIZED_RESPONSE`, `FORBIDDEN_RESPONSE` 定数を export
- [x] 今後作成される API Route で使用するテンプレートを準備 ✅

#### 4.6 テスト・検証

- [x] `npm run lint` を通す ✅
- [x] 手動で以下を確認 ✅
  - サインアップ → ログイン → Desktop 画面表示の流れ
  - ログアウト後に `/` アクセスで `/login` へ誘導される
  - UserMenu からプロフィール編集・ログアウトが機能する
  - デザインシステムが統一されている（accent-sand配色）

### 完了条件

- [x] メール+パスワードログインが動作する ✅
- [x] サインアップ～ログイン～ログアウトの導線がデスクトップ UI と統一されたデザインで提供される ✅
- [x] Desktop UI（`/`）は未認証でアクセスすると `/login` にリダイレクトされる ✅
- [x] Zustand で `user`/`session`/`isLoading`/`isInitialized` を保持し、セッション変化時に更新される ✅
- [x] API Route が Supabase セッション Cookie を使って認証チェックを行い、未認証なら 401 が返る ✅
- [x] UserMenu コンポーネントでユーザー名表示、プロフィール編集、ログアウトが可能 ✅
- [x] プロフィールページでパスワード変更が可能 ✅
- [x] 全ページでデザインシステムが統一されている（accent-sand配色、rounded-xl、shadow-soft等）✅

**Phase 4 実装期間**: 完了

---

## Phase 5: API実装 - プロジェクト管理 📦

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

### 完了条件（AIエージェント統合対応）

- [x] プロジェクト一覧が取得できる
- [x] プロジェクトが作成できる
- [x] プロジェクト詳細が取得できる
- [x] プロジェクトが更新できる
- [x] プロジェクトが削除できる
- [x] すべてのAPIでRLSが正しく動作する
- [ ] **AIエージェント統合**: Agent BuilderでAPIをツールとして登録

---

## Phase 6: API実装 - 設定・売上 ⚙️💰

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

### 完了条件（AIエージェント統合対応）

- [x] ユーザー設定の取得・更新ができる
- [x] アプリ設定の取得・更新ができる
- [x] 売上の全CRUD操作ができる
- [x] 売上集計が正しく計算される
- [ ] **AIエージェント統合**: Agent BuilderでAPIをツールとして登録

---

## Phase 7: Agent Builder + ChatKit統合 💬

### 目標
ChatKitの統合とチャットUIの実装（※ Phase 4-5のAPI実装完了後に実施）

### 前提条件
- ✅ Phase 5: プロジェクト管理API実装完了
- ✅ Phase 6: 設定・売上API実装完了
- ✅ Agent Builderでワークフロー作成
- ✅ Agent BuilderでAPIツール登録
- ✅ `CHATKIT_WORKFLOW_ID`環境変数設定

### タスク

#### 6.1 Agent Builderワークフロー構築

- [ ] OpenAI Platform > Agent Builderでエージェント作成
- [ ] システムプロンプト設定
```
あなたは新時代SaaSの操作をサポートするアシスタントです。
ユーザーがプロジェクト管理、設定変更、売上確認を行えるよう支援してください。

利用可能なAPI:
- プロジェクト管理: 作成、一覧取得、詳細取得、更新、削除
- 設定管理: ユーザー設定、アプリ設定の取得・更新
- 売上確認: 登録、一覧取得、集計、更新、削除

日本語で親しみやすく、わかりやすく回答してください。
```

- [ ] APIツールの登録
  - [ ] `/api/projects` (GET/POST)
  - [ ] `/api/projects/[id]` (GET/PATCH/DELETE)
  - [ ] `/api/settings/user` (GET/PATCH)
  - [ ] `/api/settings/app` (GET/PATCH)
  - [ ] `/api/revenues` (GET/POST)
  - [ ] `/api/revenues/[id]` (GET/PATCH/DELETE)
  - [ ] `/api/revenues/summary` (GET)

- [ ] ワークフローをPublish
- [ ] Workflow IDを取得して`.env.local`に設定

#### 6.2 ChatKitセッションAPI

- [ ] `app/api/create-session/route.ts` - POSTハンドラー
```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { requireAuth } from '@/lib/auth/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await requireAuth();

    // ChatKitセッション作成
    const session = await openai.chatkit.sessions.create({
      workflow_id: process.env.CHATKIT_WORKFLOW_ID!,
      external_user_id: user.id,
    });

    return NextResponse.json({
      client_secret: session.client_secret,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
```
- [ ] OpenAI Platform > Settings > ChatKit > Domain Allowlistに追加
  - `localhost:3000`
  - `*.vercel.app`
  - 本番ドメイン

#### 6.3 ChatKitコンポーネントの作成

- [ ] `components/chat/ChatInterface.tsx`
```typescript
'use client';

import { useChatKit } from '@openai/chatkit-react';
import { ChatKit } from '@openai/chatkit-react';
import { useEffect, useState } from 'react';

export function ChatInterface() {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    // セッション作成
    fetch('/api/create-session', { method: 'POST' })
      .then(res => res.json())
      .then(data => setClientSecret(data.client_secret));
  }, []);

  const { control } = useChatKit({
    api: {
      clientToken: clientSecret || '',
    },
  });

  if (!clientSecret) return <div>Loading...</div>;

  return (
    <div className="h-full">
      <ChatKit control={control} className="h-full" />
    </div>
  );
}
```

#### 6.4 メインページへの統合

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

#### 6.5 ChatKitカスタマイズ

- [ ] スタイルのカスタマイズ（Tailwind CSS）
- [ ] 日本語対応の確認
- [ ] レスポンシブ対応

### 完了条件

- [ ] Agent Builderでワークフロー構築完了
- [ ] すべてのAPIがAgent Builderにツールとして登録されている
- [ ] ChatKitが正しく表示される
- [ ] チャットでメッセージ送受信ができる
- [ ] AIがAPIを呼び出して操作を実行できる
- [ ] AIレスポンスが適切に返ってくる

---

## Phase 8: テスト・デプロイ 🚀

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
