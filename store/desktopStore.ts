import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';

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
function generateWindowId(appId: string): string {
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
  id: string;
  name: string;
  icon: string; // アイコンのコンポーネント名（例: 'RiFolder', 'RiSettings'）
  color: string; // アイコンの色
}

// ウィンドウの型定義
export interface WindowState {
  id: string; // ウィンドウのユニークID（例: 'window-projects-1'）
  appId: string; // 対応するアプリのID（例: 'projects'）
  title: string; // ウィンドウタイトル（例: 'Projects'）
  position: { x: number; y: number }; // ウィンドウ位置（px）
  size: { width: number; height: number }; // ウィンドウサイズ（px）
  isMinimized: boolean; // 最小化状態
  isMaximized: boolean; // 最大化状態
  zIndex: number; // Z-index（前面表示順序）
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

  // アプリの追加・削除（将来の拡張用）
  addApp: (app: App) => void;
  removeApp: (appId: string) => void;

  // ウィンドウ管理
  windows: WindowState[];
  openWindow: (appId: string) => void;
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
  openWindowInScreen: (screenId: string, appId: string) => void;
  closeWindowInScreen: (screenId: string, windowId: string) => void;
  minimizeWindowInScreen: (screenId: string, windowId: string) => void;
  maximizeWindowInScreen: (screenId: string, windowId: string) => void;
  bringToFrontInScreen: (screenId: string, windowId: string) => void;
  updateWindowPositionInScreen: (screenId: string, windowId: string, position: { x: number; y: number }) => void;
  updateWindowSizeInScreen: (screenId: string, windowId: string, size: { width: number; height: number }) => void;
}

// デフォルトのアプリ一覧
const defaultApps: App[] = [
  {
    id: 'projects',
    name: 'Projects',
    icon: 'RiFolder',
    color: 'text-cyan-500',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: 'RiSettings',
    color: 'text-cyan-500',
  },
  {
    id: 'revenue',
    name: 'Revenue',
    icon: 'RiMoneyDollar',
    color: 'text-cyan-500',
  },
  {
    id: 'store',
    name: 'Store',
    icon: 'RiStore',
    color: 'text-cyan-500',
  },
  {
    id: 'agent',
    name: 'Agent',
    icon: 'RiRobot',
    color: 'text-cyan-500',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'RiDashboard',
    color: 'text-cyan-500',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: 'RiBarChart',
    color: 'text-cyan-500',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: 'RiCalendar',
    color: 'text-cyan-500',
  },
];

/**
 * z-indexの正規化（無限増加を防止）
 * @param windows ウィンドウの配列
 * @returns 正規化されたウィンドウ配列
 */
const normalizeZIndexesIfNeeded = (windows: WindowState[]) => {
  const maxZ = windows.reduce((max, w) => Math.max(max, w.zIndex), 0);

  // 閾値以下なら正規化不要
  if (maxZ <= Z_INDEX_NORMALIZATION_THRESHOLD) {
    return windows;
  }

  // z-indexでソートして1から再割り当て
  const sorted = [...windows].sort((a, b) => a.zIndex - b.zIndex);
  const orderMap = new Map(sorted.map((w, index) => [w.id, index + 1]));
  return windows.map((w) => ({ ...w, zIndex: orderMap.get(w.id) ?? w.zIndex }));
};

type DesktopDataSlice = Pick<DesktopState, 'apps' | 'isDarkMode' | 'isDockVisible' | 'windows' | 'splitMode' | 'splitScreenWindows'>;

const createSplitScreenWindows = (): DesktopDataSlice['splitScreenWindows'] => ({
  left: [],
  right: [],
  topLeft: [],
  topRight: [],
  bottomLeft: [],
  bottomRight: [],
});

const cloneDefaultApps = () => defaultApps.map((app) => ({ ...app }));

const createDesktopData = (): DesktopDataSlice => ({
  apps: cloneDefaultApps(),
  isDarkMode: false,
  isDockVisible: false,
  windows: [],
  splitMode: 1,
  splitScreenWindows: createSplitScreenWindows(),
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

      // アプリを追加
      addApp: (app) =>
        set((state) => ({
          apps: [...state.apps, app],
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
            return {
              windows: normalizeZIndexesIfNeeded(
                state.windows.map((w) =>
                  w.id === existingWindow.id
                    ? { ...w, zIndex: maxZ + 1, isMinimized: false }
                    : w
                )
              ),
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
          return { windows: normalizeZIndexesIfNeeded(windows) };
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
          return { windows: normalizeZIndexesIfNeeded(updatedWindows) };
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
            return {
              splitScreenWindows: {
                ...state.splitScreenWindows,
                [screenId]: normalizeZIndexesIfNeeded(
                  screenWindows.map((w) =>
                    w.id === existingWindow.id
                      ? { ...w, zIndex: maxZ + 1, isMinimized: false }
                      : w
                  )
                ),
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
              [screenId]: normalizeZIndexesIfNeeded(windows),
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
              [screenId]: normalizeZIndexesIfNeeded(updatedScreenWindows),
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
    }),
    {
      name: 'desktop-storage-v2', // localStorageのキー名（バージョンアップで強制初期化）
      version: 2, // ストレージバージョン
      storage: createJSONStorage(() => (typeof window !== 'undefined' && window.localStorage ? window.localStorage : memoryStorage)),
      // マイグレーション処理（将来のバージョンアップ時に使用）
      migrate: (persistedState: any, version: number) => {
        // v1からv2へのマイグレーション例
        if (version === 1) {
          return {
            ...persistedState,
            splitScreenWindows: createSplitScreenWindows(),
          };
        }

        return persistedState;
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
