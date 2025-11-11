import { create } from 'zustand';
import type { Notification, NotificationStats } from '@/types/notification';

/**
 * 通知管理用Zustandストア
 */

interface NotificationState {
  // 通知一覧
  notifications: Notification[];

  // 未読通知数
  unreadCount: number;

  // ドロップダウンの開閉状態
  isDropdownOpen: boolean;

  // ローディング状態
  isLoading: boolean;

  // エラー状態
  error: string | null;

  // 一時的なエラートースト表示用
  toastError: string | null;
}

interface NotificationActions {
  // 通知一覧を設定
  setNotifications: (notifications: Notification[]) => void;

  // 通知を追加（Realtime経由で新しい通知が来た時）
  addNotification: (notification: Notification) => void;

  // 通知を既読にする
  markAsRead: (notificationId: string) => void;

  // すべての通知を既読にする
  markAllAsRead: () => void;

  // 通知を削除
  removeNotification: (notificationId: string) => void;

  // すべての通知を削除
  clearAll: () => void;

  // ドロップダウンを開く/閉じる
  toggleDropdown: () => void;
  setDropdownOpen: (isOpen: boolean) => void;

  // ローディング状態を設定
  setLoading: (isLoading: boolean) => void;

  // エラー状態を設定
  setError: (error: string | null) => void;

  // トーストエラーを設定（3秒後に自動消去）
  showToastError: (error: string) => void;
  clearToastError: () => void;

  // 未読通知数を更新
  updateUnreadCount: () => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // 初期状態
  notifications: [],
  unreadCount: 0,
  isDropdownOpen: false,
  isLoading: false,
  error: null,
  toastError: null,

  // 通知一覧を設定
  setNotifications: (notifications) => {
    set({ notifications });
    get().updateUnreadCount();
  },

  // 通知を追加（新しい通知が来た時）
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
    }));
    get().updateUnreadCount();
  },

  // 通知を既読にする
  markAsRead: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      ),
    }));
    get().updateUnreadCount();
  },

  // すべての通知を既読にする
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    }));
    get().updateUnreadCount();
  },

  // 通知を削除
  removeNotification: (notificationId) => {
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== notificationId
      ),
    }));
    get().updateUnreadCount();
  },

  // すべての通知を削除
  clearAll: () => {
    set({ notifications: [] });
    get().updateUnreadCount();
  },

  // ドロップダウンを開く/閉じる
  toggleDropdown: () => {
    set((state) => ({ isDropdownOpen: !state.isDropdownOpen }));
  },

  setDropdownOpen: (isOpen) => {
    set({ isDropdownOpen: isOpen });
  },

  // ローディング状態を設定
  setLoading: (isLoading) => {
    set({ isLoading });
  },

  // エラー状態を設定
  setError: (error) => {
    set({ error });
  },

  // トーストエラーを表示（3秒後に自動消去）
  showToastError: (error) => {
    set({ toastError: error });
    setTimeout(() => {
      set({ toastError: null });
    }, 3000);
  },

  clearToastError: () => {
    set({ toastError: null });
  },

  // 未読通知数を更新
  updateUnreadCount: () => {
    const { notifications } = get();
    const unreadCount = notifications.filter((n) => !n.read).length;
    set({ unreadCount });
  },
}));
