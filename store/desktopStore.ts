import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// アプリの型定義
export interface App {
  id: string;
  name: string;
  icon: string; // アイコンのコンポーネント名（例: 'RiFolder', 'RiSettings'）
  color: string; // アイコンの色
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
    }),
    {
      name: 'desktop-storage', // localStorageのキー名
    }
  )
);
