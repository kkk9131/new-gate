'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { AUTH_ERRORS, AUTH_SUCCESS } from '@/lib/constants/auth-errors';
import { RiArrowLeftLine, RiLockPasswordLine } from 'react-icons/ri';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { useLanguageSettings } from '@/lib/hooks/useLanguageSettings';
import { formatDate } from '@/lib/utils/dateFormat';

/**
 * プロフィール編集ページ
 *
 * ユーザー情報の表示とパスワード変更機能を提供します。
 */
export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { t } = useTranslation();
  const { settings: languageSettings } = useLanguageSettings();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 認証プロバイダー情報
  const [authProvider, setAuthProvider] = useState<'google' | 'email'>('email');
  const [hasPassword, setHasPassword] = useState(true);
  const [isLoadingProvider, setIsLoadingProvider] = useState(true);

  // パスワード作成用（Googleユーザー向け）
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createPassword, setCreatePassword] = useState('');
  const [confirmCreatePassword, setConfirmCreatePassword] = useState('');
  const [isCreatingPassword, setIsCreatingPassword] = useState(false);

  /**
   * 認証プロバイダー情報を取得
   */
  const fetchAuthProvider = async () => {
    try {
      // タイムスタンプ付きクエリパラメータでキャッシュを完全に回避
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/settings/security/auth-provider?t=${timestamp}`, {
        cache: 'no-store', // キャッシュを無効化して常に最新データを取得
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      if (!response.ok) throw new Error('認証プロバイダー情報の取得に失敗しました');
      const data = await response.json();
      setAuthProvider(data.provider);
      setHasPassword(data.hasPassword);
    } catch (err: any) {
      console.error('認証プロバイダー情報取得エラー:', err);
      // エラーが発生してもデフォルト値で続行
    } finally {
      setIsLoadingProvider(false);
    }
  };

  /**
   * 初回マウント時に認証プロバイダー情報を取得
   */
  useEffect(() => {
    fetchAuthProvider();
  }, []);

  /**
   * パスワードを作成（Googleユーザー向け）
   */
  const handleCreatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // バリデーション
    if (!createPassword || !confirmCreatePassword) {
      setError(t.security.newPasswordRequired);
      return;
    }

    if (createPassword !== confirmCreatePassword) {
      setError(t.security.passwordsDoNotMatch);
      return;
    }

    if (createPassword.length < 8) {
      setError(t.security.passwordTooShort);
      return;
    }

    setIsCreatingPassword(true);

    try {
      const response = await fetch('/api/settings/security/create-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: createPassword,
          confirmPassword: confirmCreatePassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t.security.createPasswordError);
      }

      setSuccess(t.security.passwordCreated);
      setCreatePassword('');
      setConfirmCreatePassword('');
      setShowCreatePassword(false);

      // 認証プロバイダー情報を再取得してhasPasswordを更新
      await fetchAuthProvider();
    } catch (err: any) {
      console.error('パスワード作成エラー:', err);
      setError(err.message || t.security.createPasswordError);
    } finally {
      setIsCreatingPassword(false);
    }
  };

  /**
   * パスワード変更処理
   */
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // バリデーション
    if (!currentPassword) {
      setError(AUTH_ERRORS.CURRENT_PASSWORD_REQUIRED);
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError(AUTH_ERRORS.PASSWORD_TOO_SHORT);
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(AUTH_ERRORS.PASSWORD_MISMATCH);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // 現在のパスワードで再認証（セキュリティ対策）
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: currentPassword,
      });

      if (verifyError) {
        setError(AUTH_ERRORS.CURRENT_PASSWORD_INVALID);
        setIsLoading(false);
        return;
      }

      // パスワード更新
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // 成功
      setSuccess(AUTH_SUCCESS.PASSWORD_CHANGED);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('パスワード変更エラー:', err);
      setError(AUTH_ERRORS.PASSWORD_UPDATE_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * デスクトップに戻る
   */
  const handleBack = () => {
    router.push('/');
  };

  if (!user || isLoadingProvider) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <p className="text-gray-600">{t.common.loading}</p>
      </div>
    );
  }

  // 作成日のフォーマット（ユーザーの言語設定に従う）
  const createdDate = user.created_at
    ? formatDate(new Date(user.created_at), languageSettings)
    : t.profile.unknownDate;

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
          <span>{t.common.backToDesktop}</span>
        </button>

        {/* プロフィール情報 */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {t.profile.title}
          </h2>

          <div className="space-y-4">
            {/* メールアドレス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.profile.email}
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {user.email}
              </div>
            </div>

            {/* ユーザーID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.profile.userId}
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-mono text-sm">
                {user.id}
              </div>
            </div>

            {/* 作成日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.profile.accountCreated}
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {createdDate}
              </div>
            </div>
          </div>
        </div>

        {/* パスワード作成（Googleユーザー向け） */}
        {authProvider === 'google' && !hasPassword && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-6">
              <RiLockPasswordLine className="w-6 h-6 text-accent-sand" />
              <h2 className="text-2xl font-bold text-gray-800">
                {t.security.createPassword}
              </h2>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              {t.security.createPasswordDesc}
            </p>

            {!showCreatePassword ? (
              <button
                type="button"
                onClick={() => setShowCreatePassword(true)}
                className="w-full bg-accent-sand text-ink font-semibold py-3 px-4 rounded-xl hover:bg-accent-sand/80 focus:outline-none focus:ring-2 focus:ring-accent-sand focus:ring-offset-2 transition-all shadow-soft hover:shadow-panel"
              >
                {t.security.createPassword}
              </button>
            ) : (
              <form onSubmit={handleCreatePassword} className="space-y-5">
                {/* エラーメッセージ */}
                {error && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {error}
                  </div>
                )}

                {/* 成功メッセージ */}
                {success && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
                  >
                    {success}
                  </div>
                )}

                {/* 新しいパスワード */}
                <div>
                  <label
                    htmlFor="createPassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t.security.newPassword}
                  </label>
                  <input
                    id="createPassword"
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-sand focus:border-transparent transition-all"
                    placeholder={t.security.newPasswordPlaceholder}
                    disabled={isCreatingPassword}
                  />
                </div>

                {/* パスワード確認 */}
                <div>
                  <label
                    htmlFor="confirmCreatePassword"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {t.security.confirmNewPassword}
                  </label>
                  <input
                    id="confirmCreatePassword"
                    type="password"
                    value={confirmCreatePassword}
                    onChange={(e) => setConfirmCreatePassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-sand focus:border-transparent transition-all"
                    placeholder={t.security.confirmPasswordPlaceholder}
                    disabled={isCreatingPassword}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {t.security.passwordMinLength}
                  </p>
                </div>

                {/* ボタン */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreatePassword(false);
                      setCreatePassword('');
                      setConfirmCreatePassword('');
                      setError(null);
                    }}
                    disabled={isCreatingPassword}
                    className="flex-1 bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingPassword}
                    className="flex-1 bg-accent-sand text-ink font-semibold py-3 px-4 rounded-xl hover:bg-accent-sand/80 focus:outline-none focus:ring-2 focus:ring-accent-sand focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-panel"
                  >
                    {isCreatingPassword ? t.security.creating : t.security.createPassword}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* パスワード変更（既存ユーザー） */}
        {hasPassword && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <RiLockPasswordLine className="w-6 h-6 text-accent-sand" />
            <h2 className="text-2xl font-bold text-gray-800">
              {t.profile.passwordChange}
            </h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-5">
            {/* エラーメッセージ */}
            {error && (
              <div
                role="alert"
                aria-live="assertive"
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </div>
            )}

            {/* 成功メッセージ */}
            {success && (
              <div
                role="status"
                aria-live="polite"
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
              >
                {success}
              </div>
            )}

            {/* 現在のパスワード */}
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t.profile.currentPassword}
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-sand focus:border-transparent transition-all"
                placeholder={t.profile.currentPasswordPlaceholder}
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t.profile.securityNote}
              </p>
            </div>

            {/* 新しいパスワード */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t.profile.newPassword}
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-sand focus:border-transparent transition-all"
                placeholder={t.profile.newPasswordPlaceholder}
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                {t.profile.passwordMinLength}
              </p>
            </div>

            {/* パスワード確認 */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t.profile.confirmPassword}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-sand focus:border-transparent transition-all"
                placeholder={t.profile.confirmPasswordPlaceholder}
                disabled={isLoading}
              />
            </div>

            {/* 変更ボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent-sand text-ink font-semibold py-3 px-4 rounded-xl hover:bg-accent-sand/80 focus:outline-none focus:ring-2 focus:ring-accent-sand focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-panel"
            >
              {isLoading ? t.profile.changing : t.profile.changePassword}
            </button>
          </form>
        </div>
        )}
      </div>
    </div>
  );
}
