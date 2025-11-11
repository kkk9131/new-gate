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
- [ ] Phase 3: Desktop UI基盤構築（2-4日目）← **実装中**（基本レイアウト・アイコン・Window管理・分割モード完了、ChatPanel未実装）
- [x] Phase 4: 認証機能実装（5日目）✅ 完了
- [ ] Phase 5: API実装 - プロジェクト管理（6-7日目）
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

- [x] ディレクトリ構造の作成（一部完了）✅
```bash
mkdir -p lib/supabase       # ✅ 完了
mkdir -p lib/auth           # ✅ 完了
mkdir -p lib/types          # ✅ 完了
mkdir -p lib/utils          # 未実装（Phase 5で実装予定）
mkdir -p components/chat    # 未実装（Phase 7で実装予定）
mkdir -p components/desktop # ✅ 完了
mkdir -p store              # ✅ 完了
```

#### 1.4 TypeScript型定義の作成

- [x] `lib/types/database.ts` - データベース型定義 ✅
```typescript
// Phase 4で実装済み
// Project, UserSettings, AppSettings, Revenue型定義
// Input型（CreateProjectInput, UpdateProjectInput等）も含む
```

- [ ] `lib/types/api.ts` - API型定義（Phase 5で実装予定）
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

- [x] `lib/supabase/client.ts` - クライアントサイド用 ✅
```typescript
// Phase 4で実装済み
// createBrowserClient() を使用
```

- [x] `lib/supabase/server.ts` - サーバーサイド用 ✅
```typescript
// Phase 4で実装済み
// createServerClient() を使用
```

- [x] `lib/supabase/route.ts` - API Route用 ✅
```typescript
// Phase 4で実装済み
// createRouteHandlerClient() を使用
```

#### 1.6 共通ユーティリティの作成

- [ ] `lib/utils/error-handler.ts` - エラーハンドリング
- [ ] `lib/utils/validators.ts` - バリデーション（Zod使用）
- [ ] `lib/utils/format.ts` - 日付・金額フォーマット

### 完了条件

- [x] すべての依存パッケージがインストールされている ✅
- [x] 環境変数が正しく設定されている ✅
- [x] 主要なプロジェクト構造が作成されている（lib/supabase, lib/types, lib/auth, components/desktop, store）✅
- [x] `npm run dev`でエラーなく起動できる ✅

**Phase 1 実装状況**: Phase 4までで大部分完了（lib/utils, components/chatは後続フェーズで実装）

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

- [x] Supabase Dashboard > SQL Editorを開く ✅
- [x] `database-schema.md`のSQLを順番に実行 ✅

**実行順序**:
1. [x] `update_updated_at_column()`関数の作成 ✅
2. [x] `projects`テーブル作成 ✅
3. [x] `projects`のインデックス作成 ✅
4. [x] `projects`のトリガー作成 ✅
5. [x] `projects`のRLSポリシー設定 ✅
6. [x] `user_settings`テーブル作成（同様の手順）✅
7. [x] `app_settings`テーブル作成（同様の手順）✅
8. [x] `revenues`テーブル作成（同様の手順）✅

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
- [x] すべてのテーブルが作成されている（projects, user_settings, app_settings, revenues）✅
- [x] RLSポリシーが正しく設定されている ✅
- [x] Supabaseへの接続が確認できている（認証機能で動作確認済み）✅

**Phase 2 実装状況**: Phase 4で完了確認済み（ビューとトリガーは Phase 5で実装予定）

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
Supabase Authを使った認証機能の実装

### タスク

#### 4.1 認証ヘルパーの作成

- [x] `lib/auth/session.ts` - サーバーサイド認証 ✅
```typescript
// getUser(), requireAuth()を実装
// Cookie-based認証でServer Components対応
```

- [x] `lib/supabase/server.ts` - Server Component用クライアント ✅
- [x] `lib/supabase/client.ts` - Client Component用クライアント ✅
- [x] `lib/supabase/route.ts` - Route Handler用クライアント ✅

#### 4.2 認証状態管理（Zustand）

- [x] `store/authStore.ts` - 認証状態管理 ✅
```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  setAuth: (payload: { user: User | null; session: Session | null }) => void;
  clearAuth: () => void;
}
```

- [x] `components/auth/AuthProvider.tsx` - サーバー→クライアント橋渡し ✅
- [x] `app/(protected)/layout.tsx` - 保護されたルート ✅

#### 4.3 ログイン/サインアップページの作成

- [x] `app/login/page.tsx` - ログインページ ✅
  - メール/パスワード認証
  - Google OAuth認証
  - パスワードリセットリンク
- [x] `app/signup/page.tsx` - サインアップページ ✅
  - メール/パスワード登録
  - Google OAuth登録
- [x] `app/api/auth/callback/route.ts` - OAuth認証コールバック ✅

#### 4.4 パスワード管理機能

- [x] `app/(protected)/profile/page.tsx` - プロフィール編集 ✅
  - パスワード変更機能
  - 現在のパスワード検証（セキュリティ対策）
- [x] `app/forgot-password/page.tsx` - パスワードリセット申請 ✅
- [x] `app/reset-password/page.tsx` - パスワードリセット実行 ✅

#### 4.5 UI/UXの改善

- [x] `components/desktop/UserMenu.tsx` - ユーザーメニュー ✅
  - ドロップダウンメニュー
  - プロフィール編集へのリンク
  - ログアウト機能
- [x] `lib/constants/auth-errors.ts` - エラーメッセージ定数化 ✅
- [x] アクセシビリティ対応（aria属性） ✅
- [x] z-index階層定義（tailwind.config.ts） ✅

#### 4.6 セキュリティ対策

- [x] Cookie設定の最適化 ✅
- [x] RLSポリシーの設定確認 ✅
- [x] パスワード変更時の再認証 ✅
- [x] 二重セッション初期化の防止（AuthListener削除） ✅

### 完了条件

- [x] ユーザー登録・ログインができる（メール/パスワード + Google OAuth） ✅
- [x] ログアウトができる ✅
- [x] 認証状態が保持される ✅
- [x] プロフィール編集（パスワード変更）ができる ✅
- [x] パスワードリセット機能が動作する ✅
- [x] セキュリティ対策が実装されている ✅
- [x] エラーハンドリングが適切 ✅
- [x] アクセシビリティ対応済み ✅

**Phase 4 実装期間**: 1日（2025-11-10完了）

**実装内容の詳細**:
- 認証方式: メール/パスワード + Google OAuth
- 状態管理: Zustand（persist削除、サーバー側認証を信頼）
- セキュリティ: Cookie-based認証、RLS、パスワード再認証
- UX改善: エラー定数化、アクセシビリティ対応、z-index階層定義

---

## Phase 5: MVPアプリAPI実装（設定・プロジェクト・売上） 🚀

### 目標
デフォルトアプリ（Settings, Projects, Revenue）の全API実装

### 実装順序
1. **共通エラーハンドリング** - すべてのAPIで使用
2. **設定API** - ユーザー設定・アプリ設定（GET/PATCH）
3. **プロジェクトAPI** - CRUD操作
4. **売上API** - CRUD操作 + 集計機能

---

### タスク

#### 5.1 エラーハンドリング共通化（最優先）

- [ ] `lib/utils/api-error.ts` - エラーハンドラー作成
```typescript
import { NextResponse } from 'next/server';

export function handleAPIError(error: any) {
  console.error('API Error:', error);

  // 認証エラー
  if (error.message === 'UNAUTHORIZED') {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: '認証が必要です',
        },
      },
      { status: 401 }
    );
  }

  // バリデーションエラー
  if (error.name === 'ZodError') {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力値が不正です',
          details: error.errors,
        },
      },
      { status: 400 }
    );
  }

  // Supabaseエラー
  if (error.code) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: 500 }
    );
  }

  // その他のエラー
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    },
    { status: 500 }
  );
}
```

---

### 🔧 設定API実装

#### 5.2 ユーザー設定API

- [ ] `app/api/settings/user/route.ts` - GET/PATCHハンドラー
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

// バリデーションスキーマ
const updateUserSettingsSchema = z.object({
  language: z.enum(['ja', 'en']).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  timezone: z.string().optional(),
  notifications_enabled: z.boolean().optional(),
  email_notifications: z.boolean().optional(),
});

// GET: ユーザー設定取得
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

// PATCH: ユーザー設定更新
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // バリデーション
    const validated = updateUserSettingsSchema.parse(body);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_settings')
      .update(validated)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### 5.3 アプリ設定API

- [ ] `app/api/settings/app/route.ts` - GET/PATCHハンドラー
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

// バリデーションスキーマ
const updateAppSettingsSchema = z.object({
  default_currency: z.string().length(3).optional(),
  date_format: z.string().optional(),
  fiscal_year_start: z.string().regex(/^\d{2}-\d{2}$/).optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  business_name: z.string().max(255).optional(),
  business_address: z.string().optional(),
});

// GET: アプリ設定取得
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

// PATCH: アプリ設定更新
export async function PATCH(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // バリデーション
    const validated = updateAppSettingsSchema.parse(body);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .update(validated)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

---

### 📦 プロジェクトAPI実装

#### 5.4 プロジェクトAPI（CRUD操作）

- [ ] `app/api/projects/route.ts` - GET/POSTハンドラー
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

// バリデーションスキーマ
const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  budget: z.number().min(0),
  status: z.enum(['active', 'completed', 'on_hold']).optional(),
});

// GET: プロジェクト一覧取得
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

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

// POST: プロジェクト作成
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // バリデーション
    const validated = createProjectSchema.parse(body);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...validated,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### 5.5 プロジェクト詳細・更新・削除API

- [ ] `app/api/projects/[id]/route.ts` - GET/PATCH/DELETEハンドラー
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  budget: z.number().min(0).optional(),
  status: z.enum(['active', 'completed', 'on_hold']).optional(),
});

// GET: プロジェクト詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

// PATCH: プロジェクト更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = updateProjectSchema.parse(body);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('projects')
      .update(validated)
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

// DELETE: プロジェクト削除（ソフトデリート）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const supabase = createClient();

    const { error } = await supabase
      .from('projects')
      .update({ is_deleted: true })
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ message: '削除しました' });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

---

### 💰 売上API実装

#### 5.6 売上API（CRUD操作）

- [ ] `app/api/revenues/route.ts` - GET/POSTハンドラー
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

// バリデーションスキーマ
const createRevenueSchema = z.object({
  project_id: z.string().uuid().optional(),
  amount: z.number().min(0),
  tax_amount: z.number().min(0).optional(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().optional(),
  category: z.string().optional(),
});

// GET: 売上一覧取得
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    // フィルタリングパラメータ
    const projectId = searchParams.get('project_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createClient();
    let query = supabase
      .from('revenues')
      .select('*, projects(name)')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('payment_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (startDate) {
      query = query.gte('payment_date', startDate);
    }

    if (endDate) {
      query = query.lte('payment_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

// POST: 売上登録
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    // バリデーション
    const validated = createRevenueSchema.parse(body);

    // 税額自動計算（指定がない場合）
    if (!validated.tax_amount) {
      // app_settingsからtax_rateを取得
      const supabase = createClient();
      const { data: settings } = await supabase
        .from('app_settings')
        .select('tax_rate')
        .eq('user_id', user.id)
        .single();

      const taxRate = settings?.tax_rate || 10; // デフォルト10%
      validated.tax_amount = Math.floor(validated.amount * (taxRate / 100));
    }

    const { data, error } = await supabase
      .from('revenues')
      .insert({
        ...validated,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

#### 5.7 売上詳細・更新・削除API

- [ ] `app/api/revenues/[id]/route.ts` - GET/PATCH/DELETEハンドラー
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

const updateRevenueSchema = z.object({
  project_id: z.string().uuid().optional(),
  amount: z.number().min(0).optional(),
  tax_amount: z.number().min(0).optional(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

// GET, PATCH, DELETE handlers...
// （プロジェクトAPIと同様の実装）
```

#### 5.8 売上集計API

- [ ] `app/api/revenues/summary/route.ts` - GETハンドラー
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/server';
import { handleAPIError } from '@/lib/utils/api-error';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const groupBy = searchParams.get('group_by'); // 'month' or 'project'

    const supabase = createClient();

    // 期間集計
    let query = supabase
      .from('revenues')
      .select('amount, tax_amount, payment_date, project_id, projects(name)')
      .eq('user_id', user.id)
      .eq('is_deleted', false);

    if (startDate) {
      query = query.gte('payment_date', startDate);
    }

    if (endDate) {
      query = query.lte('payment_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    // グループ化処理
    if (groupBy === 'month') {
      // 月別集計
      const monthly = data.reduce((acc, item) => {
        const month = item.payment_date.substring(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = { amount: 0, tax_amount: 0, count: 0 };
        }
        acc[month].amount += item.amount;
        acc[month].tax_amount += item.tax_amount;
        acc[month].count += 1;
        return acc;
      }, {});

      return NextResponse.json({ data: monthly });
    } else if (groupBy === 'project') {
      // プロジェクト別集計
      const byProject = data.reduce((acc, item) => {
        const projectId = item.project_id || 'no_project';
        if (!acc[projectId]) {
          acc[projectId] = {
            project_name: item.projects?.name || '未割当',
            amount: 0,
            tax_amount: 0,
            count: 0,
          };
        }
        acc[projectId].amount += item.amount;
        acc[projectId].tax_amount += item.tax_amount;
        acc[projectId].count += 1;
        return acc;
      }, {});

      return NextResponse.json({ data: byProject });
    }

    // 総計のみ
    const total = data.reduce(
      (acc, item) => ({
        amount: acc.amount + item.amount,
        tax_amount: acc.tax_amount + item.tax_amount,
        count: acc.count + 1,
      }),
      { amount: 0, tax_amount: 0, count: 0 }
    );

    return NextResponse.json({ data: total });
  } catch (error) {
    return handleAPIError(error);
  }
}
```

---

### 完了条件（AIエージェント統合対応）

**設定API**:
- [ ] ユーザー設定の取得・更新ができる
- [ ] アプリ設定の取得・更新ができる

**プロジェクトAPI**:
- [ ] プロジェクト一覧が取得できる
- [ ] プロジェクトが作成できる
- [ ] プロジェクト詳細が取得できる
- [ ] プロジェクトが更新できる
- [ ] プロジェクトが削除できる（ソフトデリート）

**売上API**:
- [ ] 売上一覧が取得できる（期間・プロジェクトフィルタ対応）
- [ ] 売上が登録できる（税額自動計算）
- [ ] 売上詳細が取得できる
- [ ] 売上が更新できる
- [ ] 売上が削除できる
- [ ] 売上集計ができる（月別・プロジェクト別・総計）

**共通**:
- [ ] すべてのAPIでRLSが正しく動作する
- [ ] エラーハンドリングが適切に実装されている
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

- [ ] すべての機能が正常動作する
- [ ] 重大なバグがない
- [ ] Vercelへのデプロイが完了している
- [ ] 本番環境で動作確認できている

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
