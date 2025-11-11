'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useNotificationRealtime } from '@/hooks/useNotificationRealtime';
import { createClient } from '@/lib/supabase/client';
import NotificationDropdown from './NotificationDropdown';

/**
 * 通知ベルアイコンコンポーネント
 * ヘッダーに表示される通知アイコンと未読数バッジ
 */
export default function NotificationBell() {
  const {
    unreadCount,
    isDropdownOpen,
    toggleDropdown,
    setDropdownOpen,
    setNotifications,
    setLoading,
    setError,
    toastError,
    clearToastError,
  } = useNotificationStore();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Realtime購読を有効化
  useNotificationRealtime(userId);

  // 通知一覧を取得
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/notifications');

      if (!response.ok) {
        throw new Error('通知の取得に失敗しました');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('通知取得エラー:', error);
      setError('通知の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setNotifications]);

  // 初回マウント時にユーザーIDを取得して通知を取得
  useEffect(() => {
    async function initialize() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        await fetchNotifications();
      }
    }

    initialize();
  }, [fetchNotifications]);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, setDropdownOpen]);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* ベルアイコンボタン */}
        <button
          onClick={toggleDropdown}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
          aria-label="通知"
        >
          {/* 未読がある場合は塗りつぶしアイコン、なければ輪郭アイコン */}
          {unreadCount > 0 ? (
            <BellIconSolid className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          ) : (
            <BellIcon className="h-6 w-6" />
          )}

          {/* 未読数バッジ */}
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* ドロップダウンメニュー */}
        {isDropdownOpen && (
          <NotificationDropdown onRefresh={fetchNotifications} />
        )}
      </div>

      {/* エラートースト */}
      {toastError && (
        <div className="fixed top-4 right-4 z-50 max-w-sm animate-slide-in-right">
          <div className="bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="flex-1">{toastError}</span>
            <button
              onClick={clearToastError}
              className="text-white hover:text-gray-200 transition-colors"
              aria-label="閉じる"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  );
}
