'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RiShieldLine, RiAlertLine, RiDeleteBinLine, RiArrowLeftLine } from 'react-icons/ri';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * プライバシー設定ページ
 *
 * アカウント削除機能を提供します：
 * - 二段階確認ダイアログ
 * - パスワード再入力
 * - 削除内容の説明
 * - 30日間の削除猶予期間
 */
export default function PrivacyPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const supabase = createClientComponentClient();

  // ダイアログ表示状態
  const [showFirstDialog, setShowFirstDialog] = useState(false);
  const [showSecondDialog, setShowSecondDialog] = useState(false);

  // フォーム入力状態
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // 削除リクエスト状態
  const [hasPendingDeletion, setHasPendingDeletion] = useState(false);
  const [deletionRequest, setDeletionRequest] = useState<{
    requested_at: string;
    scheduled_deletion_at: string;
    status: string;
  } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  /**
   * 削除リクエストの状態を読み込む
   */
  useEffect(() => {
    const fetchDeletionStatus = async () => {
      try {
        const response = await fetch('/api/settings/privacy/deletion-status');
        if (response.ok) {
          const data = await response.json();
          setHasPendingDeletion(data.hasPendingDeletion);
          setDeletionRequest(data.deletionRequest);
        }
      } catch (error) {
        console.error('削除状態の取得エラー:', error);
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchDeletionStatus();
  }, []);

  /**
   * 削除リクエストをキャンセル
   */
  const handleCancelDeletion = async () => {
    if (!confirm(t.privacy.cancelDeletionConfirm)) {
      return;
    }

    setIsCancelling(true);
    setError('');

    try {
      const response = await fetch('/api/settings/privacy/cancel-deletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t.privacy.cancelError);
      }

      alert(t.privacy.cancelSuccess);
      setHasPendingDeletion(false);
      setDeletionRequest(null);
    } catch (err) {
      console.error('削除キャンセルエラー:', err);
      setError(err instanceof Error ? err.message : t.privacy.cancelError);
    } finally {
      setIsCancelling(false);
    }
  };

  /**
   * 第一確認ダイアログを開く
   */
  const handleOpenFirstDialog = () => {
    setShowFirstDialog(true);
    setError('');
  };

  /**
   * 第一確認ダイアログを閉じる
   */
  const handleCloseFirstDialog = () => {
    setShowFirstDialog(false);
    setError('');
  };

  /**
   * 第二確認ダイアログに進む
   */
  const handleProceedToSecondDialog = () => {
    setShowFirstDialog(false);
    setShowSecondDialog(true);
    setPassword('');
    setConfirmText('');
    setError('');
  };

  /**
   * 第二確認ダイアログを閉じる
   */
  const handleCloseSecondDialog = () => {
    setShowSecondDialog(false);
    setPassword('');
    setConfirmText('');
    setError('');
  };

  /**
   * アカウント削除を実行
   */
  const handleDeleteAccount = async () => {
    // バリデーション
    if (!password) {
      setError(t.privacy.passwordRequired);
      return;
    }

    if (confirmText !== t.privacy.deleteConfirmText) {
      setError(t.privacy.confirmTextRequired);
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      // アカウント削除APIを呼び出し
      const response = await fetch('/api/settings/privacy/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t.privacy.deleteError);
      }

      // 成功: 状態を更新
      const result = await response.json();
      setHasPendingDeletion(true);
      setDeletionRequest({
        requested_at: new Date().toISOString(),
        scheduled_deletion_at: result.scheduled_deletion_at,
        status: 'pending',
      });

      // ダイアログを閉じる
      setShowSecondDialog(false);
      setPassword('');
      setConfirmText('');

      // 成功メッセージを表示
      alert(t.privacy.deleteSuccess);
    } catch (err) {
      console.error('アカウント削除エラー:', err);
      setError(err instanceof Error ? err.message : t.privacy.deleteError);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
          {/* 戻るボタン */}
          <button
            type="button"
            onClick={() => router.push('/')}
            className="mb-4 flex items-center gap-2 text-ink hover:text-accent-sand transition-colors font-medium"
          >
            <RiArrowLeftLine className="w-5 h-5" />
            <span>{t.common.backToDesktop}</span>
          </button>

          {/* プライバシー設定 */}
          <div className="bg-surface rounded-2xl shadow-panel p-8">
            <div className="flex items-center gap-2 mb-6">
              <RiShieldLine className="w-6 h-6 text-accent-sand" />
              <h2 className="text-2xl font-bold text-ink">{t.privacy.title}</h2>
            </div>

            <div className="space-y-6">

            {/* 削除リクエスト進行中の警告 */}
            {hasPendingDeletion && deletionRequest && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <RiAlertLine className="w-6 h-6 text-blue-500" />
                  <h3 className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {t.privacy.pendingDeletionTitle}
                  </h3>
                </div>

                <div className="space-y-4">
                  <p className="text-blue-700 dark:text-blue-300">
                    {t.privacy.pendingDeletionMessage}
                  </p>

                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-cloud">{t.privacy.scheduledDeletionDate}:</span>
                        <span className="font-semibold text-ink">
                          {format(new Date(deletionRequest.scheduled_deletion_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCancelDeletion}
                    disabled={isCancelling}
                    className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors font-medium disabled:opacity-50"
                  >
                    {isCancelling ? t.privacy.cancelling : t.privacy.cancelDeletion}
                  </button>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 危険な操作セクション */}
            <div className="border-2 border-red-500/30 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <RiAlertLine className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-red-500">{t.privacy.dangerZone}</h3>
              </div>

              {/* アカウント削除 */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <RiDeleteBinLine className="w-6 h-6 text-ink flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg text-ink mb-2">
                      {t.privacy.accountDeletion}
                    </h4>
                    <p className="text-sm text-cloud mb-4">
                      {t.privacy.accountDeletionDesc}
                    </p>

                    {/* 警告メッセージ */}
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
                      <p className="text-sm text-red-700 dark:text-red-300">
                        ⚠️ {t.privacy.deleteAccountWarning}
                      </p>
                    </div>

                    <button
                      onClick={handleOpenFirstDialog}
                      disabled={hasPendingDeletion || isLoadingStatus}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t.privacy.deleteAccount}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* 第一確認ダイアログ */}
        {showFirstDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* ダイアログヘッダー */}
            <div className="flex items-center gap-3 mb-4">
              <RiAlertLine className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-ink">{t.privacy.confirmDeletion}</h2>
            </div>

            {/* 削除されるデータの説明 */}
            <div className="space-y-4 mb-6">
              <p className="text-ink">{t.privacy.whatWillBeDeleted}</p>
              <ul className="space-y-2 text-cloud">
                <li className="flex items-center gap-2">
                  <span className="text-red-500">•</span> {t.privacy.allProjects}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">•</span> {t.privacy.allRevenues}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">•</span> {t.privacy.allEvents}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">•</span> {t.privacy.allSettings}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-500">•</span> {t.privacy.allSessions}
                </li>
              </ul>

              {/* 猶予期間の説明 */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <h3 className="font-semibold text-ink mb-2">{t.privacy.gracePeriod}</h3>
                <p className="text-sm text-cloud">{t.privacy.gracePeriodDesc}</p>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCloseFirstDialog}
                className="px-4 py-2 bg-cloud/20 hover:bg-cloud/30 text-ink rounded-xl transition-colors"
              >
                {t.privacy.cancel}
              </button>
              <button
                onClick={handleProceedToSecondDialog}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
              >
                次へ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 第二確認ダイアログ（パスワード入力） */}
      {showSecondDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-2xl p-6 max-w-md w-full shadow-2xl">
            {/* ダイアログヘッダー */}
            <div className="flex items-center gap-3 mb-4">
              <RiShieldLine className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-bold text-ink">{t.privacy.confirmDeletion}</h2>
            </div>

            <p className="text-cloud mb-6">{t.privacy.confirmDeletionDesc}</p>

            {/* フォーム */}
            <div className="space-y-4 mb-6">
              {/* パスワード入力 */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  {t.privacy.enterPassword}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t.privacy.passwordPlaceholder}
                  className="w-full px-4 py-2 bg-cloud/10 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sand text-ink"
                  disabled={isDeleting}
                />
              </div>

              {/* 確認テキスト入力 */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  {t.privacy.typeDelete}
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={t.privacy.typeDeletePlaceholder}
                  className="w-full px-4 py-2 bg-cloud/10 border border-white/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-sand text-ink"
                  disabled={isDeleting}
                />
              </div>

              {/* エラーメッセージ */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}
            </div>

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                onClick={handleCloseSecondDialog}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-cloud/20 hover:bg-cloud/30 text-ink rounded-xl transition-colors disabled:opacity-50"
              >
                {t.privacy.cancel}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors disabled:opacity-50"
              >
                {isDeleting ? t.privacy.deleting : t.privacy.confirmDelete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
