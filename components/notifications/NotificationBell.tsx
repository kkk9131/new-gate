'use client';

import { useEffect, useRef, useState } from 'react';
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
  } = useNotificationStore();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);

  // Realtime購読を有効化
  useNotificationRealtime(userId);

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
  }, []);

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

  // 通知一覧を取得
  async function fetchNotifications() {
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
  }

  return (
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
  );
}
