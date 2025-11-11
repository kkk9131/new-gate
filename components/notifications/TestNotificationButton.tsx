'use client';

import { useState } from 'react';

/**
 * テスト通知作成ボタン
 * 開発環境でのテスト用
 */
export default function TestNotificationButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function createTestNotification() {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('通知の作成に失敗しました');
      }

      await response.json();
      setMessage('✅ テスト通知を作成しました！');

      // 3秒後にメッセージを消す
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('エラー:', error);
      setMessage('❌ エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={createTestNotification}
        disabled={isLoading}
        className="
          px-4 py-2
          bg-indigo-600 hover:bg-indigo-700
          text-white font-medium rounded-lg
          shadow-lg hover:shadow-xl
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isLoading ? '作成中...' : '🔔 テスト通知を作成'}
      </button>

      {message && (
        <div className="mt-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
          {message}
        </div>
      )}
    </div>
  );
}
