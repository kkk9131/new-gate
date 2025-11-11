'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { Notification, NotificationType } from '@/types/notification';

interface NotificationItemProps {
  notification: Notification;
}

// 通知タイプの設定（色、ラベル）
const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  { color: string; label: string }
> = {
  project_update: { color: 'bg-blue-100 text-blue-600', label: 'プロジェクト' },
  revenue_alert: { color: 'bg-green-100 text-green-600', label: '売上' },
  system: { color: 'bg-gray-100 text-gray-600', label: 'システム' },
  plugin_update: { color: 'bg-purple-100 text-purple-600', label: 'プラグイン' },
  agent_complete: { color: 'bg-indigo-100 text-indigo-600', label: 'エージェント' },
  mention: { color: 'bg-yellow-100 text-yellow-600', label: 'メンション' },
  reminder: { color: 'bg-orange-100 text-orange-600', label: 'リマインダー' },
};

/**
 * 個別通知アイテムコンポーネント
 */
export default function NotificationItem({
  notification,
}: NotificationItemProps) {
  const router = useRouter();
  const { markAsRead, removeNotification, showToastError } = useNotificationStore();
  const [isDeleting, setIsDeleting] = useState(false);

  // 通知をクリックして既読にする
  async function handleClick() {
    if (notification.read) {
      // 既読の場合はリンク先へ遷移のみ
      if (notification.link_url) {
        router.push(notification.link_url);
      }
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ read: true }),
      });

      if (!response.ok) {
        throw new Error('既読処理に失敗しました');
      }

      markAsRead(notification.id);

      // リンク先があれば遷移
      if (notification.link_url) {
        router.push(notification.link_url);
      }
    } catch (error) {
      console.error('既読処理エラー:', error);
      showToastError('既読処理に失敗しました');
    }
  }

  // 通知を削除
  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation(); // クリックイベントの伝播を防ぐ
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('削除に失敗しました');
      }

      removeNotification(notification.id);
    } catch (error) {
      console.error('削除エラー:', error);
      showToastError('通知の削除に失敗しました');
      setIsDeleting(false);
    }
  }

  // 通知タイプの設定を取得（デフォルトはsystem）
  const typeConfig = NOTIFICATION_TYPE_CONFIG[notification.type] || NOTIFICATION_TYPE_CONFIG.system;

  return (
    <div
      onClick={handleClick}
      className={`
        px-4 py-3 cursor-pointer transition-colors duration-200 relative group
        ${notification.read ? 'bg-white dark:bg-gray-800' : 'bg-indigo-50 dark:bg-indigo-900/20'}
        hover:bg-gray-50 dark:hover:bg-gray-700
        ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* 通知タイプアイコン */}
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${typeConfig.color}`}
        >
          {typeConfig.label.charAt(0)}
        </div>

        {/* 通知内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              {/* タイトル */}
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {notification.title}
              </h4>
              {/* メッセージ */}
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {notification.message}
              </p>
              {/* タイムスタンプ */}
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: ja,
                })}
              </p>
            </div>

            {/* 削除ボタン */}
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400 transition-all duration-200"
              aria-label="削除"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* 未読インジケーター */}
      {!notification.read && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-indigo-600 dark:bg-indigo-400 rounded-r"></div>
      )}
    </div>
  );
}
