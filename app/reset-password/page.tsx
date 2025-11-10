'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AUTH_ERRORS, AUTH_SUCCESS } from '@/lib/constants/auth-errors';
import { RiLockPasswordLine } from 'react-icons/ri';

/**
 * パスワードリセットページ
 *
 * メールのリンクからアクセスし、新しいパスワードを設定します。
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  // セッション確認
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setIsValidSession(true);
      } else {
        setError('セッションが無効です。もう一度パスワードリセットをやり直してください。');
      }
    };

    checkSession();
  }, []);

  /**
   * パスワードリセット処理
   */
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // バリデーション
    if (newPassword.length < 6) {
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

      // パスワード更新
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      // 成功
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');

      // 3秒後にログインページへリダイレクト
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      console.error('パスワードリセットエラー:', err);
      setError(AUTH_ERRORS.RESET_PASSWORD_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ロゴエリア */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            新時代SaaS
          </h1>
          <p className="text-gray-600">新しいパスワードを設定</p>
        </div>

        {/* パスワードリセットフォーム */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <RiLockPasswordLine className="w-6 h-6 text-accent-sand" />
            <h2 className="text-2xl font-bold text-gray-800">
              パスワード設定
            </h2>
          </div>

          {!isValidSession && error ? (
            // セッション無効エラー
            <div>
              <div
                role="alert"
                aria-live="assertive"
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6"
              >
                {error}
              </div>
              <Link
                href="/forgot-password"
                className="block w-full text-center bg-accent-sand text-ink font-semibold py-3 px-4 rounded-xl hover:bg-accent-sand/80 transition-all shadow-soft hover:shadow-panel"
              >
                パスワードリセットをやり直す
              </Link>
            </div>
          ) : success ? (
            // 成功メッセージ
            <div>
              <div
                role="status"
                aria-live="polite"
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6"
              >
                {AUTH_SUCCESS.PASSWORD_RESET}
              </div>
              <p className="text-gray-600 text-sm mb-6">
                3秒後にログインページへ移動します...
              </p>
              <Link
                href="/login"
                className="block w-full text-center bg-accent-sand text-ink font-semibold py-3 px-4 rounded-xl hover:bg-accent-sand/80 transition-all shadow-soft hover:shadow-panel"
              >
                今すぐログインページへ
              </Link>
            </div>
          ) : (
            // パスワード入力フォーム
            <form onSubmit={handleResetPassword} className="space-y-5">
              <p className="text-gray-600 text-sm">
                新しいパスワードを入力してください。
              </p>

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

              {/* 新しいパスワード */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  新しいパスワード
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-sand focus:border-transparent transition-all"
                  placeholder="6文字以上で入力"
                  disabled={isLoading}
                />
                <p className="mt-1 text-xs text-gray-500">
                  ※ 6文字以上で入力してください
                </p>
              </div>

              {/* パスワード確認 */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  新しいパスワード（確認）
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-sand focus:border-transparent transition-all"
                  placeholder="もう一度入力"
                  disabled={isLoading}
                />
              </div>

              {/* 設定ボタン */}
              <button
                type="submit"
                disabled={isLoading || !isValidSession}
                className="w-full bg-accent-sand text-ink font-semibold py-3 px-4 rounded-xl hover:bg-accent-sand/80 focus:outline-none focus:ring-2 focus:ring-accent-sand focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-panel"
              >
                {isLoading ? '設定中...' : 'パスワードを設定'}
              </button>
            </form>
          )}
        </div>

        {/* フッター */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>&copy; 2025 新時代SaaS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
