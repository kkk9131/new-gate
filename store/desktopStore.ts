import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// アプリの型定義
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
}

// デフォルトのアプリ一覧
const defaultApps: App[] = [
  {
    id: 'projects',
    name: 'Projects',
    icon: 'RiFolder',
    color: 'text-blue-500',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: 'RiSettings',
    color: 'text-gray-500',
  },
  {
    id: 'revenue',
    name: 'Revenue',
    icon: 'RiMoneyDollar',
    color: 'text-green-500',
  },
  {
    id: 'store',
    name: 'Store',
    icon: 'RiStore',
    color: 'text-purple-500',
  },
  {
    id: 'agent',
    name: 'Agent',
    icon: 'RiRobot',
    color: 'text-orange-500',
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: 'RiDashboard',
    color: 'text-indigo-500',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: 'RiBarChart',
    color: 'text-pink-500',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: 'RiCalendar',
    color: 'text-red-500',
  },
];

// Zustandストアの作成（localStorage永続化対応）
export const useDesktopStore = create<DesktopState>()(
  persist(
    (set) => ({
      // 初期状態
      apps: defaultApps,
      isDarkMode: false,
      isDockVisible: false,
      windows: [],

      // ダークモード切り替え
      toggleDarkMode: () =>
        set((state) => {
          const newMode = !state.isDarkMode;
          // HTMLのクラスを切り替え（Tailwindのdark:用）
          if (typeof window !== 'undefined') {
            if (newMode) {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }
          return { isDarkMode: newMode };
        }),

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
              windows: state.windows.map((w) =>
                w.id === existingWindow.id
                  ? { ...w, zIndex: maxZ + 1, isMinimized: false }
                  : w
              ),
            };
          }

          // 新しいウィンドウを作成
          const app = state.apps.find((a) => a.id === appId);
          if (!app) return state;

          const windowId = `window-${appId}-${Date.now()}`;
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

          return { windows: [...state.windows, newWindow] };
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
          const maxZ = Math.max(...state.windows.map((w) => w.zIndex), 0);
          return {
            windows: state.windows.map((w) =>
              w.id === windowId ? { ...w, zIndex: maxZ + 1 } : w
            ),
          };
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
    }),
    {
      name: 'desktop-storage', // localStorageのキー名
    }
  )
);
