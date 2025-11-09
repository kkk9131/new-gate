# デスクトップUI 設計書

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **UIコンセプト**: デスクトップOS風ウィンドウシステム
- **拡張性**: 無限にアプリアイコン追加可能

---

## 🎨 確定UI構成

### 通常モード（デスクトップビュー）

```
┌─────────────────────────────────────────────────┬─────┐
│  [Logo]  新時代SaaS          [4分割モード]  [User]│     │
├─────────────────────────────────────────────────┤ チャ│
│                                                 │ ット│
│   Desktop Area (アイコン配置)                   │ 固定│
│                                                 │     │
│   [📁]    [⚙️]    [💰]    [📊]                 │ [💬]│
│  Projects Settings Revenue Dashboard            │     │
│                                                 │ 常時│
│   [📧]    [📅]    [📈]    [+]                  │ 表示│
│   Email  Calendar Reports  追加...              │     │
│                                                 │ リサ│
│  ← ドラッグ&ドロップで並び替え可能              │ イズ│
│  ← アイコンクリックでウィンドウ開く(最大3-4個)  │ 可能│
│                                                 │     │
│  ┌──────────────────┐                          │     │
│  │ Window: Projects │                          │     │
│  │ [_][□][×]       │ ← 自由移動・リサイズ     │     │
│  ├──────────────────┤                          │     │
│  │ Content...       │                          │     │
│  └──────────────────┘                          │     │
└─────────────────────────────────────────────────┴─────┘
```

### 4分割モード（上位レイヤー）

```
┌─────────────────────────────────────────────────┐
│  [×閉じる]  4分割モード        [通常モードへ]   │
├────────────────────┬────────────────────────────┤
│                    │                            │
│  Screen 1          │  Screen 2                  │
│  [Projects]        │  [Settings]                │
│  Content...        │  Content...                │
│                    │                            │
├────────────────────┼────────────────────────────┤
│                    │                            │
│  Screen 3          │  Screen 4                  │
│  [Revenue]         │  [Chat]                    │
│  Content...        │  Content...                │
│                    │                            │
└────────────────────┴────────────────────────────┘
```

---

## 🔧 コンポーネント詳細仕様

### 1. Header（固定）

#### 構成
```tsx
左側:
  - [Logo Icon] クリックでデスクトップクリア
  - "新時代SaaS" タイトル

中央:
  - 開いているウィンドウのタブ表示（最大4個）
    [Projects] [Settings] [Revenue] [×]

右側:
  - [4分割モード] ボタン → 4分割レイヤー表示
  - [User Menu] ドロップダウン
    - プロフィール
    - ログアウト
```

#### サイズ
- 高さ: 64px
- 幅: calc(100vw - チャット幅)

---

### 2. Desktop Area（メインエリア）

#### アイコングリッド

**配置ルール**:
```
グリッド: 8列 × N行（自動計算）
アイコンサイズ: 80x80px
間隔: 24px
```

**アイコン構成**:
```tsx
┌────────┐
│  Icon  │ 48x48px
├────────┤
│  Label │ テキスト
└────────┘
```

**デフォルトアイコン（Phase 1: MVP）**:
1. 📁 Projects（プロジェクト管理）
2. ⚙️ Settings（設定）
3. 💰 Revenue（売上確認）
4. 📊 Dashboard（ダッシュボード）

**追加アイコン（Phase 2: プラグインシステム）**:
5. 🏪 Store（プラグインストア）- プラグインの検索・インストール・管理

**追加アイコン（Phase 3: エージェントシステム）**:
6. 🤖 Agent（エージェント管理）- 自動化タスクの作成・実行・履歴

**将来の拡張**:
7. ➕ 追加...（ユーザーがインストールしたプラグインアプリ）

**アイコンドラッグ&ドロップ**:
```tsx
// react-beautiful-dnd 使用
<DragDropContext onDragEnd={handleDragEnd}>
  <Droppable droppableId="desktop">
    {apps.map((app, index) => (
      <Draggable key={app.id} draggableId={app.id} index={index}>
        <AppIcon app={app} onClick={openWindow} />
      </Draggable>
    ))}
  </Droppable>
</DragDropContext>
```

**アイコン配置保存**:
```tsx
// localStorageに保存
{
  "apps": [
    { "id": "projects", "position": 0, "label": "Projects", "icon": "📁" },
    { "id": "settings", "position": 1, "label": "Settings", "icon": "⚙️" },
    ...
  ]
}
```

---

### 3. Window System（ウィンドウ管理）

#### ウィンドウ仕様

**最大同時表示**: 3-4個

**ウィンドウ構造**:
```tsx
┌────────────────────────────┐
│ Title Bar                  │
│ [App Icon] Title  [_][□][×]│ ← ドラッグで移動
├────────────────────────────┤
│                            │
│  Content Area              │
│  (各アプリの画面)          │
│                            │
│                            │
└────────────────────────────┘
  ↑ 右下ドラッグでリサイズ
```

**ウィンドウ機能**:
- ✅ 自由移動（ドラッグ）
- ✅ リサイズ（8方向）
- ✅ 最小化（Headerタブに格納）
- ✅ 最大化（フルスクリーン）
- ✅ 閉じる

**サイズ制約**:
```tsx
default: {
  width: 800px,
  height: 600px,
}
min: {
  width: 400px,
  height: 300px,
}
max: {
  width: calc(100vw - チャット幅 - 40px),
  height: calc(100vh - 64px - 40px),
}
```

**Z-index管理**:
```tsx
// クリックしたウィンドウを最前面に
const [windows, setWindows] = useState([
  { id: 'projects', zIndex: 1, isActive: false },
  { id: 'settings', zIndex: 2, isActive: true }, // 最前面
]);

const bringToFront = (id) => {
  const maxZ = Math.max(...windows.map(w => w.zIndex));
  setWindows(windows.map(w =>
    w.id === id
      ? { ...w, zIndex: maxZ + 1, isActive: true }
      : { ...w, isActive: false }
  ));
};
```

---

### 4. Chat Panel（右側固定）

#### 仕様
- **位置**: 右側固定（既存設計を維持）
- **幅**: 300-600px（リサイズ可能）
- **高さ**: calc(100vh - 64px)
- **トグル**: 開閉ボタン

#### 特徴
- ウィンドウシステムとは独立
- 常に最前面（z-index最大）
- 全モードで利用可能

---

### 5. 4分割モード（上位レイヤー）

#### レイヤー構造
```tsx
// z-index階層
Desktop View:     z-index: 1
Windows:          z-index: 10-50
Chat Panel:       z-index: 100
4分割モード:      z-index: 1000 (オーバーレイ)
```

#### 4分割レイアウト
```
┌─────────┬─────────┐
│ Screen1 │ Screen2 │ 各50%
│ 固定    │ 固定    │
├─────────┼─────────┤
│ Screen3 │ Screen4 │
│ 固定    │ 固定    │
└─────────┴─────────┘
```

**画面割り当て**:
```tsx
// デフォルト構成
const quadScreens = {
  screen1: 'projects',   // 左上
  screen2: 'settings',   // 右上
  screen3: 'revenues',   // 左下
  screen4: 'chat',       // 右下（ChatKit表示）
};

// ユーザーがカスタマイズ可能
// 各スクリーンに任意のアプリを配置
```

**切り替えボタン**:
```tsx
Header右側:
  [4分割モード] ボタン
    ↓ クリック
  4分割レイヤー表示（フルスクリーンオーバーレイ）
    ↓
  [通常モードへ] ボタンで戻る
```

---

## 🎨 デザイン仕様

### カラーパレット

```css
/* デスクトップ背景 */
--desktop-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

/* ウィンドウ */
--window-bg: #ffffff;
--window-border: #e5e7eb;
--window-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);

/* タイトルバー */
--titlebar-bg: #f3f4f6;
--titlebar-active: #3b82f6;
--titlebar-text: #1f2937;

/* アイコン */
--icon-bg: rgba(255, 255, 255, 0.9);
--icon-hover: rgba(255, 255, 255, 1);
--icon-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
```

### アイコンスタイル

```tsx
// 通常状態
<div className="
  w-20 h-20
  bg-white/90 backdrop-blur-sm
  rounded-2xl
  shadow-lg
  flex flex-col items-center justify-center
  cursor-pointer
  transition-all
  hover:scale-110 hover:shadow-xl
">
  <span className="text-3xl">{icon}</span>
  <span className="text-xs text-gray-700 mt-1">{label}</span>
</div>
```

### ウィンドウスタイル

```tsx
// アクティブウィンドウ
<div className="
  absolute
  bg-white
  rounded-lg
  shadow-2xl
  border border-gray-200
  overflow-hidden
  transition-all
">
  <div className="
    h-10
    bg-gray-100
    border-b border-gray-200
    flex items-center justify-between
    px-4
    cursor-move
  ">
    <span className="font-semibold text-gray-800">
      {title}
    </span>
    <div className="flex gap-2">
      <button>_</button>
      <button>□</button>
      <button>×</button>
    </div>
  </div>
  <div className="p-4">
    {content}
  </div>
</div>
```

---

## 🔧 実装技術

### 必要なパッケージ

```bash
# ウィンドウシステム
npm install react-rnd  # リサイズ&ドラッグ

# アイコンドラッグ&ドロップ
npm install @dnd-kit/core @dnd-kit/sortable

# チャットパネルリサイズ（既存）
npm install react-resizable-panels

# アイコン
npm install react-icons
```

### 状態管理（Zustand拡張）

```typescript
// store/useStore.ts に追加
interface DesktopState {
  // アプリアイコン管理
  apps: App[];
  addApp: (app: App) => void;
  removeApp: (id: string) => void;
  reorderApps: (sourceIndex: number, destIndex: number) => void;

  // ウィンドウ管理
  windows: Window[];
  openWindow: (appId: string) => void;
  closeWindow: (windowId: string) => void;
  updateWindowPosition: (windowId: string, x: number, y: number) => void;
  updateWindowSize: (windowId: string, width: number, height: number) => void;
  bringToFront: (windowId: string) => void;

  // 4分割モード
  isQuadMode: boolean;
  toggleQuadMode: () => void;
  quadScreens: QuadScreenConfig;
  updateQuadScreen: (screenId: string, appId: string) => void;
}

interface App {
  id: string;
  label: string;
  icon: string;
  position: number;
  component: React.ComponentType;
}

interface Window {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isActive: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
}

interface QuadScreenConfig {
  screen1: string; // appId
  screen2: string;
  screen3: string;
  screen4: string;
}
```

---

## 📋 コンポーネント構造

```
app/
├── layout.tsx                # ルートレイアウト
└── (desktop)/                # デスクトップUIグループ
    ├── layout.tsx            # デスクトップレイアウト
    │   ├── <Header />
    │   ├── <DesktopArea />
    │   ├── <WindowManager />
    │   └── <ChatPanel />
    └── page.tsx              # メインページ

components/
├── desktop/
│   ├── Header.tsx            # ヘッダー
│   ├── DesktopArea.tsx       # デスクトップ背景+アイコン
│   ├── AppIcon.tsx           # アプリアイコン
│   ├── WindowManager.tsx     # ウィンドウマネージャー
│   ├── Window.tsx            # 個別ウィンドウ
│   ├── TitleBar.tsx          # ウィンドウタイトルバー
│   ├── QuadModeOverlay.tsx   # 4分割モードオーバーレイ
│   └── ChatPanel.tsx         # チャットパネル
│
├── apps/                     # 各アプリのコンテンツ
│   ├── ProjectsApp.tsx       # プロジェクト管理
│   ├── SettingsApp.tsx       # 設定
│   ├── RevenueApp.tsx        # 売上確認
│   ├── DashboardApp.tsx      # ダッシュボード
│   ├── StoreApp.tsx          # プラグインストア（Phase 2）
│   └── AgentApp.tsx          # エージェント管理（Phase 3）
│
└── chat/
    └── ChatInterface.tsx     # ChatKit統合
```

---

## 🚀 実装フェーズ

### Phase 1: デスクトップ基盤（2日）
- [ ] Header実装
- [ ] DesktopArea + アイコングリッド
- [ ] アイコンドラッグ&ドロップ
- [ ] ChatPanel（リサイズ機能）

### Phase 2: ウィンドウシステム（2-3日）
- [ ] Windowコンポーネント
- [ ] ドラッグ移動
- [ ] リサイズ機能
- [ ] 最小化・最大化・閉じる
- [ ] Z-index管理

### Phase 3: MVPアプリ実装（3-4日）
- [ ] ProjectsApp（一覧・詳細・作成・編集・削除）
- [ ] SettingsApp（ユーザー設定・アプリ設定）
- [ ] RevenueApp（一覧・登録・編集・削除・集計）
- [ ] DashboardApp（概要・統計）

### Phase 4: 4分割モード（1日）
- [ ] QuadModeOverlay
- [ ] 画面固定レイアウト
- [ ] アプリ割り当て機能

### Phase 5: API統合（3-4日）
- [ ] Supabase認証
- [ ] API Routes実装
- [ ] データフェッチング

### Phase 6: ChatKit統合（1日）
- [ ] Agent Builder設定
- [ ] create-sessionエンドポイント
- [ ] ChatKit統合

**Phase 1-6 合計**: 12-15日（MVP完成）

---

### Phase 7: プラグインストアUI実装（2-3日）
- [ ] StoreAppコンポーネント作成
  - [ ] プラグイン一覧画面（カテゴリ・検索・ソート）
  - [ ] プラグイン詳細画面（説明・スクリーンショット・レビュー）
  - [ ] インストール済みプラグイン管理画面
  - [ ] プラグインレビュー投稿機能
- [ ] ストアAPI統合（17-24エンドポイント）
  - [ ] プラグイン一覧・詳細取得
  - [ ] インストール・アンインストール
  - [ ] 有効化・無効化
  - [ ] レビュー投稿・取得
- [ ] プラグインアイコン動的追加機能
  - [ ] インストール時にデスクトップにアイコン追加
  - [ ] アンインストール時にアイコン削除

### Phase 8: エージェントシステムUI実装（2-3日）
- [ ] AgentAppコンポーネント作成
  - [ ] タスク一覧画面（アクティブ/停止中フィルター）
  - [ ] タスク作成・編集画面（YAML/JSONエディタ）
  - [ ] タスク実行履歴画面（成功/失敗ログ）
  - [ ] ステップ詳細ログ画面
- [ ] エージェントAPI統合（25-32エンドポイント）
  - [ ] タスク一覧・詳細取得
  - [ ] タスク作成・更新・削除
  - [ ] 手動実行
  - [ ] 実行履歴・ステップログ取得
- [ ] スケジュール設定UI
  - [ ] Cron式ビルダー
  - [ ] タイムゾーン選択

**Phase 7-8 合計**: 4-6日（プラグイン・エージェント完成）

**全体合計**: 16-21日

---

## 🎯 ユーザー体験フロー

### 初回起動
```
1. デスクトップ画面表示
2. デフォルトアイコン4つ配置
3. チャットパネルは閉じた状態
4. 「プロジェクトを開いてみましょう」メッセージ
```

### 通常操作
```
1. アイコンクリック
   ↓
2. ウィンドウ開く（中央に表示）
   ↓
3. ドラッグで移動、リサイズ
   ↓
4. 複数ウィンドウ並べて作業
   ↓
5. チャット開いて操作指示
```

### 4分割モード
```
1. Header「4分割モード」クリック
   ↓
2. オーバーレイ表示（4画面）
   ↓
3. 各画面で作業
   ↓
4. 「通常モードへ」で戻る
```

---

## 🏪 プラグインストアアプリ仕様（Phase 2）

### StoreApp画面構成

#### 1. ストアホーム画面

```
┌───────────────────────────────────────────────┐
│  🏪 プラグインストア              [検索...] │
├───────────────────────────────────────────────┤
│  [おすすめ] [人気] [新着] [カテゴリ▼]        │
├───────────────────────────────────────────────┤
│                                               │
│  ┌─────────┬─────────┬─────────┬─────────┐  │
│  │  📊     │  💰     │  📧     │  📅     │  │
│  │ Analytics Revenue  Email  Calendar │  │
│  │  4.8⭐  │  4.5⭐  │  4.3⭐  │  4.7⭐  │  │
│  │ 5K DL   │ 3K DL   │ 2K DL   │ 1K DL   │  │
│  │ [詳細]  │ [詳細]  │ [詳細]  │ [詳細]  │  │
│  └─────────┴─────────┴─────────┴─────────┘  │
│                                               │
│  [もっと見る...]                              │
└───────────────────────────────────────────────┘
```

#### 2. プラグイン詳細画面

```
┌───────────────────────────────────────────────┐
│  [← 戻る]  売上管理プラグイン           [×]  │
├───────────────────────────────────────────────┤
│  ┌──────┐  売上管理プラグイン                │
│  │ 💰  │  by Platform Team                 │
│  └──────┘  4.5⭐ (120件) • 5,000ダウンロード│
│                                               │
│  [インストール] または [アンインストール]     │
│                                               │
├───────────────────────────────────────────────┤
│  [説明] [スクリーンショット] [レビュー]      │
├───────────────────────────────────────────────┤
│  詳細な説明文...                              │
│                                               │
│  機能:                                        │
│  • 売上データ管理                             │
│  • 自動集計レポート                           │
│  • グラフ表示                                 │
│                                               │
│  バージョン: 1.0.0                            │
│  最終更新: 2025-01-15                         │
└───────────────────────────────────────────────┘
```

#### 3. インストール済みプラグイン画面

```
┌───────────────────────────────────────────────┐
│  インストール済みプラグイン                   │
├───────────────────────────────────────────────┤
│  [すべて] [有効] [無効]                       │
├───────────────────────────────────────────────┤
│                                               │
│  ✅ 売上管理プラグイン       v1.0.0          │
│     [無効化] [設定] [削除]                    │
│                                               │
│  ⏸️ メール送信プラグイン     v2.1.0          │
│     [有効化] [設定] [削除]                    │
│                                               │
└───────────────────────────────────────────────┘
```

---

## 🤖 エージェント管理アプリ仕様（Phase 3）

### AgentApp画面構成

#### 1. タスク一覧画面

```
┌───────────────────────────────────────────────┐
│  🤖 エージェントタスク          [+ 新規作成] │
├───────────────────────────────────────────────┤
│  [アクティブ] [停止中] [すべて]              │
├───────────────────────────────────────────────┤
│                                               │
│  ✅ 月次売上レポート自動生成                  │
│     毎月1日 9:00 | 最終実行: 2025-11-01      │
│     [編集] [実行] [停止] [履歴]              │
│                                               │
│  ✅ プロジェクト期限アラート                  │
│     毎日 18:00 | 最終実行: 2025-11-08        │
│     [編集] [実行] [停止] [履歴]              │
│                                               │
│  ⏸️ データバックアップ                        │
│     毎週日曜 2:00 | 停止中                    │
│     [編集] [開始] [削除] [履歴]              │
│                                               │
└───────────────────────────────────────────────┘
```

#### 2. タスク作成・編集画面

```
┌───────────────────────────────────────────────┐
│  新規タスク作成                         [×]  │
├───────────────────────────────────────────────┤
│                                               │
│  タスク名:                                    │
│  [月次売上レポート自動生成            ]      │
│                                               │
│  説明:                                        │
│  [毎月1日に先月の売上レポートを生成...]      │
│                                               │
│  スケジュール:                                │
│  Cron: [0 9 1 * *]  [ビルダー]               │
│  タイムゾーン: [Asia/Tokyo ▼]                │
│                                               │
│  ワークフロー定義:                            │
│  ┌─────────────────────────────────────┐    │
│  │ {                                   │    │
│  │   "steps": [                        │    │
│  │     {                               │    │
│  │       "id": "fetch-revenues",       │    │
│  │       "action": "plugin.call",      │    │
│  │       ...                           │    │
│  │     }                               │    │
│  │   ]                                 │    │
│  │ }                                   │    │
│  └─────────────────────────────────────┘    │
│                                               │
│  [保存] [キャンセル]                          │
└───────────────────────────────────────────────┘
```

#### 3. 実行履歴画面

```
┌───────────────────────────────────────────────┐
│  実行履歴 - 月次売上レポート自動生成          │
├───────────────────────────────────────────────┤
│                                               │
│  ✅ 2025-11-01 09:00  成功  3.2s             │
│     [詳細を表示]                              │
│                                               │
│  ✅ 2025-10-01 09:00  成功  2.8s             │
│     [詳細を表示]                              │
│                                               │
│  ❌ 2025-09-01 09:00  失敗                    │
│     エラー: API timeout                       │
│     [詳細を表示]                              │
│                                               │
└───────────────────────────────────────────────┘
```

#### 4. ステップ詳細ログ画面

```
┌───────────────────────────────────────────────┐
│  実行詳細 - 2025-11-01 09:00                  │
├───────────────────────────────────────────────┤
│                                               │
│  実行ステータス: ✅ 成功                      │
│  実行時間: 3.2秒                              │
│                                               │
│  ステップログ:                                │
│                                               │
│  1. fetch-revenues           ✅ 60秒         │
│     売上データ取得成功 (152件)                │
│                                               │
│  2. aggregate-data           ✅ 5秒          │
│     合計金額: ¥5,000,000                      │
│                                               │
│  3. generate-pdf             ✅ 120秒        │
│     PDFファイル生成完了                       │
│                                               │
│  4. send-email               ✅ 15秒         │
│     メール送信完了                            │
│                                               │
└───────────────────────────────────────────────┘
```

---

## 📚 関連ドキュメント

### プラットフォーム関連
- [プラットフォーム要件定義書](./platform-requirements.md)
- [MVP要件定義書](./mvp-requirements.md)

### プラグインシステム関連
- [プラグインアーキテクチャ](./plugin-architecture.md)
- [プラグインストア設計](./plugin-store-design.md)
- [開発者ガイド](./developer-guide.md)
- [Core API仕様](./core-api-spec.md)

### エージェントシステム関連
- [エージェントシステム設計](./agent-system-design.md)

### 実装関連
- [スクリーン設計書](./screen-design.md)
- [API設計書](./api-design.md)
- [データベーススキーマ設計](./database-schema.md)
- [実装タスクリスト](./tasks.md)
