'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RiArrowLeftLine, RiNotificationLine, RiMailLine, RiGlobalLine, RiVolumeUpLine } from 'react-icons/ri';

/**
 * 通知設定の型定義
 */
interface NotificationSettings {
  // 通知方法
  notification_email: boolean;
  notification_browser: boolean;
  notification_in_app: boolean;
  notification_sound: boolean;

  // 通知カテゴリ
  notify_agent_task_success: boolean;
  notify_agent_task_failure: boolean;
  notify_security_alert: boolean;
  notify_platform_updates: boolean;
  notify_project_reminder: boolean;

  // 通知タイミング
  notification_timing: 'immediate' | 'batched' | 'business_hours';
  notification_batch_interval: number;
  notification_business_hours_start: string;
  notification_business_hours_end: string;
}

/**
 * 通知設定ページ
 *
 * ユーザーの通知設定を管理します。
 */
export default function NotificationsPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 通知設定を取得
   */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/notifications');

        if (!response.ok) {
          throw new Error('通知設定の取得に失敗しました');
        }

        const data = await response.json();
        setSettings(data);
      } catch (err: any) {
        console.error('通知設定取得エラー:', err);
        setError(err.message || '通知設定の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  /**
   * 通知設定を更新（楽観的更新）
   * UIを即座に反映し、バックグラウンドでAPIを呼び出す
   */
  const updateSettings = async (updates: Partial<NotificationSettings>) => {
    if (!settings) return;

    // 元の設定を保存（ロールバック用）
    const previousSettings = settings;

    // 先にローカル状態を更新（楽観的更新）
    setSettings({
      ...settings,
      ...updates,
    });

    setError(null);

    try {
      // バックグラウンドでAPI呼び出し
      const response = await fetch('/api/settings/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('通知設定の更新に失敗しました');
      }
    } catch (err: any) {
      console.error('通知設定更新エラー:', err);

      // エラー時は元の状態にロールバック
      setSettings(previousSettings);
      setError(err.message || '通知設定の更新に失敗しました');
    }
  };

  /**
   * デスクトップに戻る
   */
  const handleBack = () => {
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <p className="text-gray-600">通知設定の読み込みに失敗しました</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* 戻るボタン */}
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-ink hover:text-accent-sand transition-colors font-medium"
        >
          <RiArrowLeftLine className="w-5 h-5" />
          <span>デスクトップに戻る</span>
        </button>

        {/* 通知設定 */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <RiNotificationLine className="w-6 h-6 text-accent-sand" />
            <h2 className="text-2xl font-bold text-gray-800">
              通知設定
            </h2>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4"
            >
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* 通知方法 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                通知方法
              </h3>
              <div className="space-y-3">
                {/* メール通知 */}
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notification_email}
                    onChange={(e) =>
                      updateSettings({ notification_email: e.target.checked })
                    }
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <RiMailLine className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">メール通知</span>
                    <p className="text-sm text-gray-600">登録メールアドレスに通知を送信</p>
                  </div>
                </label>

                {/* ブラウザ通知 */}
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notification_browser}
                    onChange={(e) =>
                      updateSettings({ notification_browser: e.target.checked })
                    }
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <RiGlobalLine className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">ブラウザ通知</span>
                    <p className="text-sm text-gray-600">デスクトップ通知を表示</p>
                  </div>
                </label>

                {/* アプリ内通知 */}
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notification_in_app}
                    onChange={(e) =>
                      updateSettings({ notification_in_app: e.target.checked })
                    }
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <RiNotificationLine className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">アプリ内通知</span>
                    <p className="text-sm text-gray-600">通知バッジを表示</p>
                  </div>
                </label>

                {/* 通知音 */}
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notification_sound}
                    onChange={(e) =>
                      updateSettings({ notification_sound: e.target.checked })
                    }
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <RiVolumeUpLine className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">通知音</span>
                    <p className="text-sm text-gray-600">通知時に音を鳴らす</p>
                  </div>
                </label>
              </div>
            </div>

            {/* 通知カテゴリ */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                通知カテゴリ
              </h3>
              <div className="space-y-3">
                {/* エージェントタスク成功 */}
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_agent_task_success}
                    onChange={(e) =>
                      updateSettings({ notify_agent_task_success: e.target.checked })
                    }
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">エージェントタスク成功</span>
                    <p className="text-sm text-gray-600">タスクが正常に完了した時</p>
                  </div>
                </label>

                {/* エージェントタスク失敗 */}
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_agent_task_failure}
                    onChange={(e) =>
                      updateSettings({ notify_agent_task_failure: e.target.checked })
                    }
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">エージェントタスク失敗</span>
                    <p className="text-sm text-gray-600">タスクが失敗した時</p>
                  </div>
                </label>

                {/* セキュリティアラート */}
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_security_alert}
                    onChange={(e) =>
                      updateSettings({ notify_security_alert: e.target.checked })
                    }
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">セキュリティアラート</span>
                    <p className="text-sm text-gray-600">不審なログインや重要な変更</p>
                  </div>
                </label>

                {/* プラットフォーム更新 */}
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_platform_updates}
                    onChange={(e) =>
                      updateSettings({ notify_platform_updates: e.target.checked })
                    }
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">プラットフォーム更新</span>
                    <p className="text-sm text-gray-600">新機能やメンテナンス情報</p>
                  </div>
                </label>

                {/* プロジェクトリマインダー */}
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notify_project_reminder}
                    onChange={(e) =>
                      updateSettings({ notify_project_reminder: e.target.checked })
                    }
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-5 h-5 rounded cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">プロジェクトリマインダー</span>
                    <p className="text-sm text-gray-600">プロジェクト期限のリマインド</p>
                  </div>
                </label>
              </div>
            </div>

            {/* 通知タイミング */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                通知タイミング
              </h3>
              <div className="space-y-3">
                {/* 即時通知 */}
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="notification_timing"
                    value="immediate"
                    checked={settings.notification_timing === 'immediate'}
                    onChange={() => updateSettings({ notification_timing: 'immediate' })}
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">即時通知</span>
                    <p className="text-sm text-gray-600">イベント発生時すぐに通知</p>
                  </div>
                </label>

                {/* まとめて通知 */}
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="notification_timing"
                    value="batched"
                    checked={settings.notification_timing === 'batched'}
                    onChange={() => updateSettings({ notification_timing: 'batched' })}
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">まとめて通知</span>
                    <p className="text-sm text-gray-600">定期的にまとめて通知</p>
                  </div>
                </label>

                {/* 営業時間のみ通知 */}
                <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="notification_timing"
                    value="business_hours"
                    checked={settings.notification_timing === 'business_hours'}
                    onChange={() => updateSettings({ notification_timing: 'business_hours' })}
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">営業時間のみ通知</span>
                    <p className="text-sm text-gray-600">指定時間帯のみ通知（9:00-18:00）</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
