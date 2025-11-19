'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  RiArrowLeftLine,
  RiLockLine,
  RiComputerLine,
  RiSmartphoneLine,
  RiGlobalLine,
  RiTimeLine,
  RiDownloadLine,
  RiLogoutBoxLine,
} from 'react-icons/ri';
import { useLanguageSettings } from '@/lib/hooks/useLanguageSettings';
import { formatDateTime } from '@/lib/utils/dateFormat';
import { useTranslation } from '@/lib/hooks/useTranslation';

/**
 * セッション情報の型定義
 */
interface UserSession {
  id: string;
  device_name: string | null;
  browser_name: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  login_at: string;
  last_activity_at: string;
  is_current: boolean;
}

/**
 * ログイン履歴の型定義
 */
interface LoginHistory {
  id: string;
  login_at: string;
  ip_address: string | null;
  country: string | null;
  city: string | null;
  device_name: string | null;
  browser_name: string | null;
  status: 'success' | 'failed';
  failure_reason: string | null;
}

/**
 * セキュリティ設定ページ
 *
 * アクティブセッション管理、ログイン履歴、セッション有効期間設定を提供します。
 */
export default function SecurityPage() {
  const router = useRouter();

  // 言語設定を取得
  const { settings: languageSettings, isLoading: isLoadingLanguage } = useLanguageSettings();
  const { t } = useTranslation();

  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [sessionTimeout, setSessionTimeout] = useState<number | null>(60);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * データを取得
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // アクティブセッション取得
        const sessionsRes = await fetch('/api/settings/security/sessions');
        if (!sessionsRes.ok) throw new Error('セッションの取得に失敗しました');
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions || []);

        // ログイン履歴取得
        const historyRes = await fetch('/api/settings/security/login-history');
        if (!historyRes.ok) throw new Error('ログイン履歴の取得に失敗しました');
        const historyData = await historyRes.json();
        setLoginHistory(historyData.history || []);

        // セッションタイムアウト設定取得
        const timeoutRes = await fetch('/api/settings/security/session-timeout');
        if (!timeoutRes.ok) throw new Error('セッションタイムアウト設定の取得に失敗しました');
        const timeoutData = await timeoutRes.json();
        setSessionTimeout(timeoutData.session_timeout_minutes);
      } catch (err: any) {
        console.error('データ取得エラー:', err);
        setError(err.message || 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  /**
   * 個別セッションをログアウト
   */
  const handleLogoutSession = async (sessionId: string) => {
    if (!confirm(t.security.logoutSessionConfirm)) return;

    try {
      const response = await fetch(`/api/settings/security/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('セッションのログアウトに失敗しました');

      // セッション一覧を更新
      setSessions(sessions.filter((s) => s.id !== sessionId));
    } catch (err: any) {
      console.error('セッションログアウトエラー:', err);
      setError(err.message || 'セッションのログアウトに失敗しました');
    }
  };

  /**
   * 全セッションからログアウト
   */
  const handleLogoutAllSessions = async () => {
    if (!confirm(t.security.logoutAllConfirm)) return;

    try {
      const response = await fetch('/api/settings/security/sessions/logout-all', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('全セッションのログアウトに失敗しました');

      // セッション一覧を更新（現在のセッションのみ残す）
      setSessions(sessions.filter((s) => s.is_current));
    } catch (err: any) {
      console.error('全セッションログアウトエラー:', err);
      setError(err.message || '全セッションのログアウトに失敗しました');
    }
  };

  /**
   * セッションタイムアウト設定を更新
   */
  const handleUpdateSessionTimeout = async (minutes: number | null) => {
    try {
      const response = await fetch('/api/settings/security/session-timeout', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_timeout_minutes: minutes }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'セッションタイムアウト設定の更新に失敗しました');

      setSessionTimeout(minutes);
      setError(null);
    } catch (err: any) {
      console.error('セッションタイムアウト設定更新エラー:', err);
      setError(err.message || 'セッションタイムアウト設定の更新に失敗しました');
    }
  };

  /**
   * ログイン履歴をCSVエクスポート
   */
  const handleExportHistory = () => {
    // CSVヘッダー（ユーザーの言語設定に従う）
    const headers = [
      languageSettings.ui_language === 'ja' ? 'ログイン日時' : 'Login Date',
      languageSettings.ui_language === 'ja' ? 'IPアドレス' : 'IP Address',
      languageSettings.ui_language === 'ja' ? '国' : 'Country',
      languageSettings.ui_language === 'ja' ? '都市' : 'City',
      languageSettings.ui_language === 'ja' ? 'デバイス' : 'Device',
      languageSettings.ui_language === 'ja' ? 'ブラウザ' : 'Browser',
      languageSettings.ui_language === 'ja' ? 'ステータス' : 'Status',
      languageSettings.ui_language === 'ja' ? '失敗理由' : 'Failure Reason',
    ];

    // CSVボディ（ユーザーの日付フォーマット設定に従う）
    const rows = loginHistory.map((entry) => [
      formatDateTime(entry.login_at, languageSettings),
      entry.ip_address || '-',
      entry.country || '-',
      entry.city || '-',
      entry.device_name || '-',
      entry.browser_name || '-',
      entry.status === 'success' ? t.security.success : t.security.failed,
      entry.failure_reason || '-',
    ]);

    // CSV文字列を生成
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    // BOMを追加（Excelで文字化けしないように）
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // ダウンロード（ファイル名もユーザーの日付フォーマットに従う）
    const link = document.createElement('a');
    link.href = url;
    link.download = `login_history_${formatDateTime(new Date(), languageSettings).replace(/[/:]/g, '-').replace(/\s/g, '_')}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  /**
   * デスクトップに戻る
   */
  const handleBack = () => {
    router.push('/');
  };

  /**
   * ログイン履歴をフィルタリング
   */
  const filteredHistory =
    historyFilter === 'all'
      ? loginHistory
      : loginHistory.filter((entry) => entry.status === historyFilter);

  if (isLoading || isLoadingLanguage) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center p-4">
        <p className="text-cloud">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* 戻るボタン */}
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-ink hover:text-accent-sand transition-colors font-medium"
        >
          <RiArrowLeftLine className="w-5 h-5" />
          <span>{t.common.backToDesktop}</span>
        </button>

        {/* セキュリティ設定 */}
        <div className="bg-surface rounded-2xl shadow-panel p-8">
          <div className="flex items-center gap-2 mb-6">
            <RiLockLine className="w-6 h-6 text-accent-sand" />
            <h2 className="text-2xl font-bold text-ink">{t.security.title}</h2>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4"
            >
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* アクティブセッション */}
            <div>
              <h3 className="text-lg font-semibold text-ink mb-4">{t.security.activeSessions}</h3>
              <div className="space-y-3">
                {sessions.length === 0 ? (
                  <p className="text-cloud text-sm">{t.security.noActiveSessions}</p>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 bg-surface-strong rounded-xl flex items-start gap-4"
                    >
                      {/* デバイスアイコン */}
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cloud/20 text-ink flex-shrink-0">
                        {session.device_name?.toLowerCase().includes('iphone') ||
                        session.device_name?.toLowerCase().includes('android') ? (
                          <RiSmartphoneLine className="w-5 h-5" />
                        ) : (
                          <RiComputerLine className="w-5 h-5" />
                        )}
                      </div>

                      {/* セッション情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-ink">
                            {session.device_name || t.security.unknownDevice} -{' '}
                            {session.browser_name || t.security.unknownBrowser}
                          </span>
                          {session.is_current && (
                            <span className="px-2 py-0.5 bg-accent-sand/20 text-accent-sand text-xs font-medium rounded">
                              {t.security.currentDevice}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-cloud space-y-0.5">
                          <div className="flex items-center gap-2">
                            <RiGlobalLine className="w-3.5 h-3.5" />
                            <span>{t.security.ipAddress}: {session.ip_address || t.security.unknown}</span>
                          </div>
                          <div>
                            {session.city && session.country
                              ? `${session.city}, ${session.country}`
                              : t.security.locationUnknown}
                          </div>
                          <div className="flex items-center gap-2">
                            <RiTimeLine className="w-3.5 h-3.5" />
                            <span>
                              {t.security.lastAccess}:{' '}
                              {formatDateTime(session.last_activity_at, languageSettings)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ログアウトボタン */}
                      {!session.is_current && (
                        <button
                          type="button"
                          onClick={() => handleLogoutSession(session.id)}
                          className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                        >
                          <RiLogoutBoxLine className="w-4 h-4" />
                          <span>{t.security.logout}</span>
                        </button>
                      )}
                    </div>
                  ))
                )}

                {/* 全デバイスからログアウトボタン */}
                {sessions.filter((s) => !s.is_current).length > 0 && (
                  <button
                    type="button"
                    onClick={handleLogoutAllSessions}
                    className="w-full px-4 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors"
                  >
                    {t.security.logoutAll}
                  </button>
                )}
              </div>
            </div>

            {/* ログイン履歴 */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-ink">{t.security.loginHistory}</h3>
                {loginHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportHistory}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-sand/10 text-accent-sand hover:bg-accent-sand/20 rounded-lg text-sm font-medium transition-colors"
                  >
                    <RiDownloadLine className="w-4 h-4" />
                    <span>{t.security.exportCSV}</span>
                  </button>
                )}
              </div>

              {/* フィルター */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setHistoryFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    historyFilter === 'all'
                      ? 'bg-accent-sand text-surface'
                      : 'bg-surface-strong text-cloud hover:bg-mist'
                  }`}
                >
                  {t.security.all}
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('success')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    historyFilter === 'success'
                      ? 'bg-accent-sand text-surface'
                      : 'bg-surface-strong text-cloud hover:bg-mist'
                  }`}
                >
                  {t.security.success}
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryFilter('failed')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    historyFilter === 'failed'
                      ? 'bg-accent-sand text-surface'
                      : 'bg-surface-strong text-cloud hover:bg-mist'
                  }`}
                >
                  {t.security.failed}
                </button>
              </div>

              {/* ログイン履歴一覧 */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredHistory.length === 0 ? (
                  <p className="text-cloud text-sm">{t.security.noLoginHistory}</p>
                ) : (
                  filteredHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 bg-surface-strong rounded-lg text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-ink">
                          {formatDateTime(entry.login_at, languageSettings)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            entry.status === 'success'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {entry.status === 'success' ? t.security.success : t.security.failed}
                        </span>
                      </div>
                      <div className="text-cloud space-y-0.5">
                        <div>
                          {entry.ip_address || t.security.unknownIP} |{' '}
                          {entry.device_name || t.security.unknownDevice} -{' '}
                          {entry.browser_name || t.security.unknownBrowser}
                        </div>
                        <div>
                          {entry.city && entry.country
                            ? `${entry.city}, ${entry.country}`
                            : t.security.locationUnknown}
                        </div>
                        {entry.status === 'failed' && entry.failure_reason && (
                          <div className="text-red-500">{t.security.reason}: {entry.failure_reason}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 自動ログアウト設定 */}
            <div>
              <h3 className="text-lg font-semibold text-ink mb-4">{t.security.autoLogout}</h3>
              <div className="space-y-2">
                {[
                  { label: t.security.minutes30, value: 30 },
                  { label: t.security.hour1, value: 60 },
                  { label: t.security.hours3, value: 180 },
                  { label: t.security.hours6, value: 360 },
                  { label: t.security.hours24, value: 1440 },
                  { label: t.security.disabled, value: null },
                ].map((option) => (
                  <label
                    key={option.value ?? 'null'}
                    className="flex items-center gap-3 p-3 bg-surface-strong rounded-xl hover:bg-mist transition-colors cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="session_timeout"
                      checked={sessionTimeout === option.value}
                      onChange={() => handleUpdateSessionTimeout(option.value)}
                      style={{ accentColor: 'rgb(213 196 170)' }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-ink">{option.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-sm text-cloud mt-2">
                {t.security.autoLogoutDesc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
