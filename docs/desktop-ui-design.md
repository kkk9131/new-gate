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

**デフォルトアイコン**:
1. 📁 Projects（プロジェクト管理）
2. ⚙️ Settings（設定）
3. 💰 Revenue（売上確認）
4. 📊 Dashboard（ダッシュボード）
5. ➕ 追加...（将来の機能用）

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
│   └── DashboardApp.tsx      # ダッシュボード
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

### Phase 3: アプリ実装（3-4日）
- [ ] ProjectsApp（一覧・詳細）
- [ ] SettingsApp（タブ切替）
- [ ] RevenueApp（一覧・集計）
- [ ] DashboardApp（概要）

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

**合計**: 12-15日

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

## 📚 関連ドキュメント
- [MVP要件定義書](./mvp-requirements.md)
- [スクリーン設計書](./screen-design.md)
- [API設計書](./api-design.md)
- [実装タスクリスト](./tasks.md)
