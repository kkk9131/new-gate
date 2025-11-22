import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { type AppId, appComponents } from '@/components/desktop/appRegistry';

// ===========================
// 定数定義（マジックナンバー回避）
// ===========================

/** z-indexの正規化閾値（この値を超えたら正規化を実行） */
const Z_INDEX_NORMALIZATION_THRESHOLD = 1000;

// ===========================
// ヘルパー関数
// ===========================

/**
 * ウィンドウIDの生成（一意性を保証）
 * crypto.randomUUID()を使用してDate.now()の衝突問題を解決
 * @param appId アプリID
 * @returns 一意なウィンドウID
 */
function generateWindowId(appId: AppId): string {
  // crypto.randomUUID()で一意性を保証
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `window-${appId}-${crypto.randomUUID()}`;
  }

  // フォールバック（テスト環境など）
  return `window-${appId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ===========================
// アプリの型定義
// ===========================
export interface App {
  id: AppId; // 型安全性のためAppId型を使用
  name: string;
  icon: string; // アイコンのコンポーネント名（例: 'RiFolder', 'RiSettings'）
  color: string; // アイコンの色
  position: { x: number; y: number }; // デスクトップ上の配置座標
}

// ウィンドウの型定義
export interface WindowState {
  id: string; // ウィンドウのユニークID（例: 'window-projects-1'）
  appId: AppId; // 対応するアプリのID（型安全性のためAppId型を使用）
  title: string; // ウィンドウタイトル（例: 'Projects'）
  position: { x: number; y: number }; // ウィンドウ位置（px）
  size: { width: number; height: number }; // ウィンドウサイズ（px）
  isMinimized: boolean; // 最小化状態
  isMaximized: boolean; // 最大化状態
  zIndex: number; // Z-index（前面表示順序）
}

// スクリーン状態の型定義
export interface ScreenState {
  screenId: number;
  appId: string | null;
  status: string;
  progress: number;
}

// ストアの状態の型定義
interface DesktopState {
  // アプリ一覧
  apps: App[];

  // ダークモード
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Dock表示状態
  isDockVisible: boolean;
  setDockVisible: (visible: boolean) => void;

  // アプリの順序変更
  reorderApps: (oldIndex: number, newIndex: number) => void;
  updateAppPosition: (appId: AppId, position: { x: number; y: number }) => void;
  resetAppPositions: () => void;

  // アプリの追加・削除（将来の拡張用）
  addApp: (app: App) => void;
  removeApp: (appId: AppId) => void;

  // ウィンドウ管理
  windows: WindowState[];
  openWindow: (appId: AppId) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  bringToFront: (windowId: string) => void;
  updateWindowPosition: (windowId: string, position: { x: number; y: number }) => void;
  updateWindowSize: (windowId: string, size: { width: number; height: number }) => void;

  // 分割モード（1: 通常, 2: 2分割, 3: 3分割, 4: 4分割）
  splitMode: 1 | 2 | 3 | 4;
  splitScreenWindows: Record<string, WindowState[]>; // スクリーン位置 → ウィンドウ配列
  toggleSplitMode: () => void;
  setSplitMode: (mode: 1 | 2 | 3 | 4) => void;

  // スクリーンごとのウィンドウ管理
  openWindowInScreen: (screenId: string, appId: AppId) => void;
  closeWindowInScreen: (screenId: string, windowId: string) => void;
  minimizeWindowInScreen: (screenId: string, windowId: string) => void;
  maximizeWindowInScreen: (screenId: string, windowId: string) => void;
  bringToFrontInScreen: (screenId: string, windowId: string) => void;
  updateWindowPositionInScreen: (screenId: string, windowId: string, position: { x: number; y: number }) => void;
  updateWindowSizeInScreen: (screenId: string, windowId: string, size: { width: number; height: number }) => void;

  // Agent用スクリーン管理
  screens: Record<number, ScreenState>;
  setLayout: (layout: 1 | 2 | 3 | 4) => void;
  openAppInScreenForAgent: (appId: string, screenId: number) => void;
  updateScreenStatus: (screenId: number, status: string, progress?: number) => void;
  closeAllWindows: () => void;
}

// デフォルトのアプリ一覧
const ICON_COL_COUNT = 12;
const ICON_X_OFFSET = 48;
const ICON_Y_OFFSET = 40;
const ICON_X_GAP = 120;
const ICON_Y_GAP = 140;
const ICON_MIN_DISTANCE = 96;

const generateIconPosition = (index: number): { x: number; y: number } => {
  const column = index % ICON_COL_COUNT;
  const row = 0;
  return {
    x: ICON_X_OFFSET + column * ICON_X_GAP,
    y: ICON_Y_OFFSET + row * ICON_Y_GAP,
  };
};

const snapToGrid = (position: { x: number; y: number }): { x: number; y: number } => {
  const snap = (value: number, offset: number, gap: number) =>
    offset + Math.round((value - offset) / gap) * gap;
  return {
    x: snap(position.x, ICON_X_OFFSET, ICON_X_GAP),
    y: snap(position.y, ICON_Y_OFFSET, ICON_Y_GAP),
  };
};


type BaseAppConfig = Omit<App, 'position'>;

const baseDefaultApps: BaseAppConfig[] = [
  { id: 'projects', name: 'Projects', icon: 'RiFolder', color: 'text-ink' },
  { id: 'settings', name: 'Settings', icon: 'RiSettings', color: 'text-ink' },
  { id: 'revenue', name: 'Revenue', icon: 'RiMoneyDollar', color: 'text-ink' },
  { id: 'store', name: 'Store', icon: 'RiStore', color: 'text-ink' },
  { id: 'calendar', name: 'Calendar', icon: 'RiCalendar', color: 'text-ink' },
];

const defaultApps: App[] = baseDefaultApps.map((app, index) => ({
  ...app,
  position: generateIconPosition(index),
}));

const ensureAppsHavePositions = (apps: App[]): App[] =>
  apps.map((app, index) => ({
    ...app,
    position: app.position
      ? snapToGrid({ ...app.position })
      : generateIconPosition(index),
  }));

const normalizeApps = (apps?: App[]): App[] =>
  ensureAppsHavePositions(apps && apps.length ? apps : cloneDefaultApps());

const validAppIds = new Set(Object.keys(appComponents));

const purgeInvalidEntries = (state: any) => {
  const cleanApps = (state?.apps ?? []).filter((app: any) => validAppIds.has(app.id));

  const cleanWindows = (state?.windows ?? []).filter((w: any) => validAppIds.has(w.appId));

  const cleanSplitScreenWindows = Object.fromEntries(
    Object.entries(state?.splitScreenWindows ?? createSplitScreenWindows()).map(([key, windows]: any) => [
      key,
      (windows ?? []).filter((w: any) => validAppIds.has(w.appId)),
    ])
  );

  const cleanScreens = Object.fromEntries(
    Object.entries(state?.screens ?? createScreens()).map(([id, screen]: any) => [
      Number(id),
      validAppIds.has(screen?.appId) ? screen : { ...screen, appId: null },
    ])
  );

  return {
    ...state,
    apps: cleanApps,
    windows: cleanWindows,
    splitScreenWindows: cleanSplitScreenWindows,
    screens: cleanScreens,
  };
};

const nudgePositionIfNeeded = (
  appId: AppId,
  position: { x: number; y: number },
  apps: App[]
): { x: number; y: number } => {
  let adjusted = snapToGrid(position);
  const safetyLimit = 30;
  let attempts = 0;

  const collides = (pos: { x: number; y: number }) =>
    apps.some(
      (app) =>
        app.id !== appId &&
        app.position &&
        Math.abs(app.position.x - pos.x) < ICON_MIN_DISTANCE &&
        Math.abs(app.position.y - pos.y) < ICON_MIN_DISTANCE
    );

  while (collides(adjusted) && attempts < safetyLimit) {
    const direction = attempts % 4;
    const delta = ICON_MIN_DISTANCE;
    switch (direction) {
      case 0:
        adjusted = { x: adjusted.x + delta, y: adjusted.y };
        break;
      case 1:
        adjusted = { x: adjusted.x, y: adjusted.y + delta };
        break;
      case 2:
        adjusted = { x: adjusted.x - delta, y: adjusted.y };
        break;
      default:
        adjusted = { x: adjusted.x, y: adjusted.y - delta };
        break;
    }
    attempts += 1;
  }

  return adjusted;
};

/**
 * z-indexの正規化（無限増加を防止）
 *
 * ウィンドウを最前面に持ってくる度にz-indexが増加していくと、
 * 最終的に数値が大きくなりすぎてオーバーフローする可能性があります。
 * この関数は、最大z-indexが閾値を超えた場合に、すべてのウィンドウの
 * z-indexを相対順序を保ったまま1から再割り当てします。
 *
 * 処理手順：
 * 1. 全ウィンドウの最大z-indexをチェック
 * 2. 閾値（1000）以下なら何もせずそのまま返す
 * 3. 閾値を超えていたら、z-indexの昇順でソート
 * 4. ソート順に1, 2, 3...と新しいz-indexを割り当て
 * 5. 元の配列順序を維持したまま、新しいz-indexを適用
 *
 * @param windows ウィンドウの配列
 * @returns 正規化されたウィンドウ配列
 *
 * @example
 * // 入力: [{id: 'a', zIndex: 1500}, {id: 'b', zIndex: 1501}]
 * // 出力: [{id: 'a', zIndex: 1}, {id: 'b', zIndex: 2}]
 */
const normalizeZIndexesIfNeeded = (windows: WindowState[], previousWindows?: WindowState[]) => {
  const reference = previousWindows ?? windows;
  const hadOverflow = reference.some((w) => w.zIndex > Z_INDEX_NORMALIZATION_THRESHOLD);

  if (!hadOverflow) {
    return windows;
  }

  // z-indexでソートして1から再割り当て
  // 相対的な前後関係（どのウィンドウが前面にあるか）は維持される
  const sorted = [...windows].sort((a, b) => a.zIndex - b.zIndex);
  const orderMap = new Map(sorted.map((w, index) => [w.id, index + 1]));
  return windows.map((w) => ({ ...w, zIndex: orderMap.get(w.id) ?? w.zIndex }));
};

type DesktopDataSlice = Pick<DesktopState, 'apps' | 'isDarkMode' | 'isDockVisible' | 'windows' | 'splitMode' | 'splitScreenWindows' | 'screens'>;

const createSplitScreenWindows = (): DesktopDataSlice['splitScreenWindows'] => ({
  left: [],
  right: [],
  topLeft: [],
  topRight: [],
  bottomLeft: [],
  bottomRight: [],
});

const cloneDefaultApps = () =>
  defaultApps.map((app) => ({ ...app, position: { ...app.position } }));

const createDesktopData = (): DesktopDataSlice => ({
  apps: cloneDefaultApps(),
  isDarkMode: false,
  isDockVisible: false,
  windows: [],
  splitMode: 1,
  splitScreenWindows: createSplitScreenWindows(),
  screens: {},
});

type MemoryStorage = StateStorage & { clear: () => void };

const createMemoryStorage = (): MemoryStorage => {
  let storage: Record<string, string> = {};
  return {
    getItem: (name) => storage[name] ?? null,
    setItem: (name, value) => {
      storage[name] = value;
    },
    removeItem: (name) => {
      delete storage[name];
    },
    clear: () => {
      storage = {};
    },
  };
};

const memoryStorage = createMemoryStorage();

// Zustandストアの作成（localStorage永続化対応）
export const useDesktopStore = create<DesktopState>()(
  persist(
    (set, get) => ({
      ...createDesktopData(),

      // ダークモード切り替え
      toggleDarkMode: () =>
        set((state) => ({ isDarkMode: !state.isDarkMode })),

      // Dock表示切り替え
      setDockVisible: (visible) =>
        set({ isDockVisible: visible }),

      // アプリの順序を変更
      reorderApps: (oldIndex, newIndex) =>
        set((state) => {
          const newApps = [...state.apps];
          const [removed] = newApps.splice(oldIndex, 1);
          newApps.splice(newIndex, 0, removed);
          return { apps: newApps };
        }),

      // アプリアイコンの座標を更新
      updateAppPosition: (appId, position) =>
        set((state) => ({
          apps: state.apps.map((app) =>
            app.id === appId
              ? {
                ...app,
                position: nudgePositionIfNeeded(
                  appId,
                  snapToGrid(position),
                  state.apps
                ),
              }
              : app
          ),
        })),

      resetAppPositions: () =>
        set((state) => ({
          apps: state.apps.map((app, index) => ({
            ...app,
            position: generateIconPosition(index),
          })),
        })),

      // アプリを追加
      addApp: (app) =>
        set((state) => ({
          apps: [
            ...state.apps,
            {
              ...app,
              position:
                nudgePositionIfNeeded(
                  app.id,
                  snapToGrid(
                    app.position ?? generateIconPosition(state.apps.length)
                  ),
                  state.apps
                ),
            },
          ],
        })),

      // アプリを削除
      removeApp: (appId) =>
        set((state) => ({
          apps: state.apps.filter((app) => app.id !== appId),
        })),

      // ウィンドウを開く
      openWindow: (appId) =>
        set((state) => {
          // 既に開いているウィンドウがあれば、最前面に
          const existingWindow = state.windows.find((w) => w.appId === appId);
          if (existingWindow) {
            const maxZ = Math.max(...state.windows.map((w) => w.zIndex), 0);
            const updatedWindows = state.windows.map((w) =>
              w.id === existingWindow.id
                ? { ...w, zIndex: maxZ + 1, isMinimized: false }
                : w
            );
            return {
              windows: normalizeZIndexesIfNeeded(updatedWindows, state.windows),
            };
          }

          // 新しいウィンドウを作成
          const app = state.apps.find((a) => a.id === appId);
          if (!app) return state;

          const windowId = generateWindowId(appId); // 一意性を保証
          const maxZ = Math.max(...state.windows.map((w) => w.zIndex), 0);

          const newWindow: WindowState = {
            id: windowId,
            appId,
            title: app.name,
            position: { x: 100 + state.windows.length * 30, y: 100 + state.windows.length * 30 },
            size: { width: 800, height: 600 },
            isMinimized: false,
            isMaximized: false,
            zIndex: maxZ + 1,
          };

          const windows = [...state.windows, newWindow];
          return { windows: normalizeZIndexesIfNeeded(windows, state.windows) };
        }),

      // ウィンドウを閉じる
      closeWindow: (windowId) =>
        set((state) => ({
          windows: state.windows.filter((w) => w.id !== windowId),
        })),

      // ウィンドウを最小化
      minimizeWindow: (windowId) =>
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === windowId ? { ...w, isMinimized: true } : w
          ),
        })),

      // ウィンドウを最大化/通常サイズに戻す
      maximizeWindow: (windowId) =>
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === windowId ? { ...w, isMaximized: !w.isMaximized } : w
          ),
        })),

      // ウィンドウを最前面に
      bringToFront: (windowId) =>
        set((state) => {
          const targetWindow = state.windows.find((w) => w.id === windowId);
          if (!targetWindow) return state;

          const maxZ = Math.max(...state.windows.map((w) => w.zIndex), 0);

          // zIndexが既に最大なら何もしない（不要な再レンダリング防止）
          if (targetWindow.zIndex === maxZ) return state;

          const updatedWindows = state.windows.map((w) =>
            w.id === windowId ? { ...w, zIndex: maxZ + 1 } : w
          );
          return { windows: normalizeZIndexesIfNeeded(updatedWindows, state.windows) };
        }),

      // ウィンドウ位置を更新
      updateWindowPosition: (windowId, position) =>
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === windowId ? { ...w, position } : w
          ),
        })),

      // ウィンドウサイズを更新
      updateWindowSize: (windowId, size) =>
        set((state) => ({
          windows: state.windows.map((w) =>
            w.id === windowId ? { ...w, size } : w
          ),
        })),

      // 分割モードを切り替え（1→2→3→4→1...）
      toggleSplitMode: () =>
        set((state) => {
          const nextMode = state.splitMode === 4 ? 1 : (state.splitMode + 1) as 1 | 2 | 3 | 4;
          return { splitMode: nextMode };
        }),

      // 分割モードを直接設定
      setSplitMode: (mode) =>
        set({ splitMode: mode }),

      // スクリーンごとのウィンドウを開く
      openWindowInScreen: (screenId, appId) =>
        set((state) => {
          const screenWindows = state.splitScreenWindows[screenId] || [];

          // 既に開いているウィンドウがあれば、最前面に
          const existingWindow = screenWindows.find((w) => w.appId === appId);
          if (existingWindow) {
            const maxZ = Math.max(...screenWindows.map((w) => w.zIndex), 0);
            const updatedScreenWindows = screenWindows.map((w) =>
              w.id === existingWindow.id
                ? { ...w, zIndex: maxZ + 1, isMinimized: false }
                : w
            );
            return {
              splitScreenWindows: {
                ...state.splitScreenWindows,
                [screenId]: normalizeZIndexesIfNeeded(updatedScreenWindows, screenWindows),
              },
            };
          }

          // 新しいウィンドウを作成
          const app = state.apps.find((a) => a.id === appId);
          if (!app) return state;

          const windowId = generateWindowId(appId); // 一意性を保証
          const maxZ = Math.max(...screenWindows.map((w) => w.zIndex), 0);

          const newWindow: WindowState = {
            id: windowId,
            appId,
            title: app.name,
            position: { x: 50 + screenWindows.length * 20, y: 50 + screenWindows.length * 20 },
            size: { width: 600, height: 400 },
            isMinimized: false,
            isMaximized: false,
            zIndex: maxZ + 1,
          };

          const windows = [...screenWindows, newWindow];
          return {
            splitScreenWindows: {
              ...state.splitScreenWindows,
              [screenId]: normalizeZIndexesIfNeeded(windows, screenWindows),
            },
          };
        }),

      // スクリーンごとのウィンドウを閉じる
      closeWindowInScreen: (screenId, windowId) =>
        set((state) => ({
          splitScreenWindows: {
            ...state.splitScreenWindows,
            [screenId]: (state.splitScreenWindows[screenId] || []).filter((w) => w.id !== windowId),
          },
        })),

      // スクリーンごとのウィンドウを最小化
      minimizeWindowInScreen: (screenId, windowId) =>
        set((state) => ({
          splitScreenWindows: {
            ...state.splitScreenWindows,
            [screenId]: (state.splitScreenWindows[screenId] || []).map((w) =>
              w.id === windowId ? { ...w, isMinimized: true } : w
            ),
          },
        })),

      // スクリーンごとのウィンドウを最大化/通常サイズに戻す
      maximizeWindowInScreen: (screenId, windowId) =>
        set((state) => ({
          splitScreenWindows: {
            ...state.splitScreenWindows,
            [screenId]: (state.splitScreenWindows[screenId] || []).map((w) =>
              w.id === windowId ? { ...w, isMaximized: !w.isMaximized } : w
            ),
          },
        })),

      // スクリーンごとのウィンドウを最前面に
      bringToFrontInScreen: (screenId, windowId) =>
        set((state) => {
          const screenWindows = state.splitScreenWindows[screenId] || [];
          const targetWindow = screenWindows.find((w) => w.id === windowId);
          if (!targetWindow) return state;

          const maxZ = Math.max(...screenWindows.map((w) => w.zIndex), 0);

          // zIndexが既に最大なら何もしない（不要な再レンダリング防止）
          if (targetWindow.zIndex === maxZ) return state;

          const updatedScreenWindows = screenWindows.map((w) =>
            w.id === windowId ? { ...w, zIndex: maxZ + 1 } : w
          );
          return {
            splitScreenWindows: {
              ...state.splitScreenWindows,
              [screenId]: normalizeZIndexesIfNeeded(updatedScreenWindows, screenWindows),
            },
          };
        }),

      // スクリーンごとのウィンドウ位置を更新
      updateWindowPositionInScreen: (screenId, windowId, position) =>
        set((state) => ({
          splitScreenWindows: {
            ...state.splitScreenWindows,
            [screenId]: (state.splitScreenWindows[screenId] || []).map((w) =>
              w.id === windowId ? { ...w, position } : w
            ),
          },
        })),

      // スクリーンごとのウィンドウサイズを更新
      updateWindowSizeInScreen: (screenId, windowId, size) =>
        set((state) => ({
          splitScreenWindows: {
            ...state.splitScreenWindows,
            [screenId]: (state.splitScreenWindows[screenId] || []).map((w) =>
              w.id === windowId ? { ...w, size } : w
            ),
          },
        })),

      // Agent用スクリーン管理
      screens: {},

      setLayout: (layout) =>
        set((state) => {
          // レイアウト変更
          const newState = { splitMode: layout };

          // スクリーン状態の初期化
          const screenCount = layout === 1 ? 1 : layout;
          const newScreens: Record<number, ScreenState> = {};

          for (let i = 1; i <= screenCount; i++) {
            newScreens[i] = {
              screenId: i,
              appId: null,
              status: 'idle',
              progress: 0
            };
          }

          return { ...newState, screens: newScreens };
        }),

      openAppInScreenForAgent: (appId, screenId) =>
        set((state) => {
          const screens = { ...state.screens };
          if (screens[screenId]) {
            screens[screenId] = {
              ...screens[screenId],
              appId,
              status: 'loading'
            };
          }

          // 実際にウィンドウも開く（既存のロジックを再利用）
          // splitModeに応じたscreenIdのマッピングが必要
          // ここでは簡易的に 'left', 'right' などをマッピング
          let targetScreenKey = '';
          if (state.splitMode === 2) {
            targetScreenKey = screenId === 1 ? 'left' : 'right';
          } else if (state.splitMode === 3) {
            targetScreenKey = screenId === 1 ? 'left' : screenId === 2 ? 'topRight' : 'bottomRight';
          } else if (state.splitMode === 4) {
            targetScreenKey = screenId === 1 ? 'topLeft' : screenId === 2 ? 'topRight' : screenId === 3 ? 'bottomLeft' : 'bottomRight';
          }

          if (targetScreenKey) {
            // 非同期で呼び出すか、ここでロジックを複製するか。
            // set内で他のアクションを呼ぶのはアンチパターンになりがちなので、
            // ここではウィンドウを開くロジックを呼び出すのではなく、
            // 呼び出し元（Agent）が openWindowInScreen も呼ぶようにするか、
            // あるいはここで openWindowInScreen のロジックを統合するのが良い。
            // 今回はAgentがUI操作を行うため、視覚的な反映としてウィンドウも開くべき。

            // 既存のopenWindowInScreenロジックを再利用したいが、setの中でget().openWindowInScreenは呼べない。
            // よって、state更新のみを行う。
            // 実際のウィンドウオープンはUI Controller側で openWindowInScreen を呼ぶ設計にするのが綺麗。
            // ここではScreenStateの更新のみに留める。
          }

          return { screens };
        }),

      closeAllWindows: () =>
        set((state) => ({
          windows: [],
          splitScreenWindows: createSplitScreenWindows(),
          screens: Object.fromEntries(
            Object.entries(state.screens).map(([id]) => [
              Number(id),
              { screenId: Number(id), appId: null, status: 'idle', progress: 0 },
            ])
          ),
        })),

      updateScreenStatus: (screenId, status, progress) =>
        set((state) => {
          const screens = { ...state.screens };
          if (screens[screenId]) {
            screens[screenId] = {
              ...screens[screenId],
              status,
              progress: progress !== undefined ? progress : screens[screenId].progress
            };
          }
          return { screens };
        }),
    }),
    {
      name: 'desktop-storage-v3', // localStorageのキー名（バージョンアップで強制初期化）
      version: 3, // 現在のストレージバージョン
      storage: createJSONStorage(() => (typeof window !== 'undefined' && window.localStorage ? window.localStorage : memoryStorage)),
      /**
       * マイグレーション処理（古いバージョンのデータを新しい形式に変換）
       *
       * この関数は、localStorageに保存されている古いバージョンのデータを
       * 現在のバージョン（v2）の形式に変換します。
       *
       * @param persistedState - localStorageから読み込まれた古いデータ
       * @param persistedVersion - 保存されていたデータのバージョン番号
       * @returns 新しいバージョンに変換されたデータ
       */
      migrate: (persistedState: any, persistedVersion: number) => {
        const withApps = (state: any) => ({
          ...state,
          apps: normalizeApps(state?.apps),
        });

        // v0またはv1から来た場合、splitScreenWindowsを追加
        if (persistedVersion < 2) {
          return withApps(purgeInvalidEntries({
            ...persistedState,
            // 既存のsplitScreenWindowsがあればそれを使い、なければ初期化
            splitScreenWindows: persistedState?.splitScreenWindows || createSplitScreenWindows(),
          }));
        }

        // v2以降はapp座標のみ補正
        return withApps(purgeInvalidEntries(persistedState));
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('状態の復元に失敗しました:', error);
        }
      },
    }
  )
);

export const resetDesktopStore = () => {
  const initialData = createDesktopData();
  useDesktopStore.setState((state) => ({
    ...state,
    ...initialData,
  }));
  useDesktopStore.persist?.clearStorage();
  memoryStorage.clear();
};
