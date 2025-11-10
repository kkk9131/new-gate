'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AUTH_ERRORS, AUTH_SUCCESS } from '@/lib/constants/auth-errors';
import { RiArrowLeftLine, RiMailLine } from 'react-icons/ri';

/**
 * パスワードリセット申請ページ
 *
 * メールアドレスを入力して、パスワードリセット用のメールを送信します。
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * パスワードリセットメール送信処理
   */
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    // バリデーション
    if (!email) {
      setError(AUTH_ERRORS.EMAIL_REQUIRED);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      // パスワードリセットメールを送信
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        throw resetError;
      }

      // 成功
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      console.error('パスワードリセットメール送信エラー:', err);
      setError(AUTH_ERRORS.RESET_EMAIL_FAILED);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 戻るリンク */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-ink hover:text-accent-sand transition-colors font-medium mb-6"
        >
          <RiArrowLeftLine className="w-5 h-5" />
          <span>ログインに戻る</span>
        </Link>

        {/* ロゴエリア */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            新時代SaaS
          </h1>
          <p className="text-gray-600">パスワードをリセット</p>
        </div>

        {/* リセット申請フォーム */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <RiMailLine className="w-6 h-6 text-accent-sand" />
            <h2 className="text-2xl font-bold text-gray-800">
              パスワードリセット
            </h2>
          </div>

          {success ? (
            // 送信成功メッセージ
            <div>
              <div
                role="status"
                aria-live="polite"
                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-6"
              >
                {AUTH_SUCCESS.RESET_EMAIL_SENT}
              </div>
              <p className="text-gray-600 text-sm mb-6">
                メール内のリンクをクリックして、新しいパスワードを設定してください。
              </p>
              <Link
                href="/login"
                className="block w-full text-center bg-accent-sand text-ink font-semibold py-3 px-4 rounded-xl hover:bg-accent-sand/80 transition-all shadow-soft hover:shadow-panel"
              >
                ログインページへ戻る
              </Link>
            </div>
          ) : (
            // メールアドレス入力フォーム
            <form onSubmit={handleResetRequest} className="space-y-5">
              <p className="text-gray-600 text-sm">
                登録したメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
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

              {/* メールアドレス */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  メールアドレス
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-sand focus:border-transparent transition-all"
                  placeholder="example@example.com"
                  disabled={isLoading}
                />
              </div>

              {/* 送信ボタン */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent-sand text-ink font-semibold py-3 px-4 rounded-xl hover:bg-accent-sand/80 focus:outline-none focus:ring-2 focus:ring-accent-sand focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-panel"
              >
                {isLoading ? '送信中...' : 'リセットメールを送信'}
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
