'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

/**
 * サインアップページ
 *
 * メール+パスワードでの新規登録機能を提供します。
 * デスクトップUIと統一されたデザインで実装しています。
 */
export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * サインアップ処理
   */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // パスワード確認
    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      setIsLoading(false);
      return;
    }

    // パスワード強度チェック
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.user) {
        // サインアップ成功
        // メール確認が無効な場合は自動ログイン → デスクトップUIへ
        // メール確認が有効な場合はメッセージ表示
        if (data.session) {
          // 自動ログイン成功
          router.push('/');
          router.refresh();
        } else {
          // メール確認待ち
          alert('登録完了しました！メールを確認して認証を完了してください。');
          router.push('/login');
        }
      }
    } catch (err: any) {
      console.error('サインアップエラー:', err);

      if (err.message.includes('already registered')) {
        setError('このメールアドレスは既に登録されています');
      } else if (err.message.includes('Invalid email')) {
        setError('有効なメールアドレスを入力してください');
      } else {
        setError('登録に失敗しました。もう一度お試しください。');
      }
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
          <p className="text-gray-600">デスクトップOS風プラットフォーム</p>
        </div>

        {/* サインアップフォーム */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            新規登録
          </h2>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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

            {/* パスワード */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                パスワード（確認）
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

            {/* サインアップボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent-sand text-ink font-semibold py-3 px-4 rounded-xl hover:bg-accent-sand/80 focus:outline-none focus:ring-2 focus:ring-accent-sand focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-panel"
            >
              {isLoading ? '登録中...' : '新規登録'}
            </button>
          </form>

          {/* ログインリンク */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              既にアカウントをお持ちの方は{' '}
              <Link
                href="/login"
                className="text-accent-sand hover:text-accent-sand/80 font-semibold underline"
              >
                ログイン
              </Link>
            </p>
          </div>
        </div>

        {/* フッター */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>&copy; 2025 新時代SaaS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
