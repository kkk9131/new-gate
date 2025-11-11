'use client';

import { useNotificationStore } from '@/store/useNotificationStore';
import NotificationItem from './NotificationItem';

interface NotificationDropdownProps {
  onRefresh: () => void;
}

/**
 * 通知ドロップダウンメニュー
 */
export default function NotificationDropdown({
  onRefresh,
}: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAllAsRead,
    clearAll,
  } = useNotificationStore();

  // すべて既読にする処理
  async function handleMarkAllAsRead() {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('既読処理に失敗しました');
      }

      markAllAsRead();
    } catch (error) {
      console.error('既読処理エラー:', error);
    }
  }

  // すべて削除する処理
  async function handleClearAll() {
    if (!confirm('すべての通知を削除しますか？')) {
      return;
    }

    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('削除に失敗しました');
      }

      clearAll();
    } catch (error) {
      console.error('削除エラー:', error);
    }
  }

  return (
    <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50">
      {/* ヘッダー */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">通知</h3>
          {unreadCount > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              未読 {unreadCount} 件
            </span>
          )}
        </div>

        {/* アクションボタン */}
        {notifications.length > 0 && (
          <div className="flex gap-2 mt-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
              >
                すべて既読
              </button>
            )}
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium"
            >
              すべて削除
            </button>
            <button
              onClick={onRefresh}
              className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 font-medium ml-auto"
            >
              更新
            </button>
          </div>
        )}
      </div>

      {/* 通知一覧 */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          // ローディング表示
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400 mx-auto"></div>
            <p className="mt-2">読み込み中...</p>
          </div>
        ) : error ? (
          // エラー表示
          <div className="px-4 py-8 text-center text-red-600 dark:text-red-400">
            <p>{error}</p>
            <button
              onClick={onRefresh}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              再試行
            </button>
          </div>
        ) : notifications.length === 0 ? (
          // 通知なし表示
          <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p className="mt-2">通知はありません</p>
          </div>
        ) : (
          // 通知一覧表示
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
