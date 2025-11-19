'use client';

import { useState, useEffect, useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

/**
 * ブラウザ通知の許可をリクエストするプロンプト
 */
export default function BrowserNotificationPrompt() {
  const isNotificationSupported = useMemo(
    () => typeof window !== 'undefined' && 'Notification' in window,
    []
  );

  const getInitialPermission = () => {
    if (!isNotificationSupported) return 'default';
    return Notification.permission;
  };

  const getInitialDismissed = () => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('notification_prompt_dismissed') === 'true';
  };

  const [permission, setPermission] = useState<NotificationPermission>(getInitialPermission);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(getInitialDismissed);

  useEffect(() => {
    if (!isNotificationSupported) {
      return;
    }

    if (isDismissed || permission !== 'default') {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [isNotificationSupported, isDismissed, permission]);

  // 通知許可をリクエスト
  async function requestPermission() {
    if (!isNotificationSupported) {
      console.warn('ブラウザが通知をサポートしていません');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        // テスト通知を表示
        new Notification('通知が有効になりました', {
          body: '新しい通知をリアルタイムで受け取れます',
          icon: '/favicon.ico',
        });

        // プロンプトを閉じる
        setIsVisible(false);
      } else if (result === 'denied') {
        // 拒否された場合もプロンプトを閉じる
        setIsVisible(false);
      }
    } catch (error) {
      console.error('通知許可リクエストエラー:', error);
    }
  }

  // プロンプトを閉じる
  function dismissPrompt() {
    setIsVisible(false);
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('notification_prompt_dismissed', 'true');
    }
  }

  // 表示しない条件
  if (!isNotificationSupported || !isVisible || isDismissed || permission !== 'default') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 animate-slide-up">
      {/* 閉じるボタン */}
      <button
        onClick={dismissPrompt}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        aria-label="閉じる"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>

      {/* アイコンとタイトル */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
          <svg
            className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
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
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            通知を有効にしますか？
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            重要な更新をリアルタイムで受け取れます
          </p>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex gap-2">
        <button
          onClick={requestPermission}
          className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          有効にする
        </button>
        <button
          onClick={dismissPrompt}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200"
        >
          後で
        </button>
      </div>
    </div>
  );
}
