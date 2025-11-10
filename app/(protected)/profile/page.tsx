'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { RiArrowLeftLine, RiLockPasswordLine } from 'react-icons/ri';

/**
 * プロフィール編集ページ
 *
 * ユーザー情報の表示とパスワード変更機能を提供します。
 */
export default function ProfilePage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * パスワード変更処理
   */
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // バリデーション
    if (newPassword.length < 6) {
      setError('新しいパスワードは6文字以上で入力してください');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('新しいパスワードが一致しません');
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
      setSuccess('パスワードを変更しました');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('パスワード変更エラー:', err);
      setError('パスワードの変更に失敗しました。もう一度お試しください。');
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  // 作成日のフォーマット
  const createdDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '不明';

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

        {/* プロフィール情報 */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            プロフィール情報
          </h2>

          <div className="space-y-4">
            {/* メールアドレス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {user.email}
              </div>
            </div>

            {/* ユーザーID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ユーザーID
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-mono text-sm">
                {user.id}
              </div>
            </div>

            {/* 作成日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                アカウント作成日
              </label>
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                {createdDate}
              </div>
            </div>
          </div>
        </div>

        {/* パスワード変更 */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <RiLockPasswordLine className="w-6 h-6 text-accent-sand" />
            <h2 className="text-2xl font-bold text-gray-800">
              パスワード変更
            </h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-5">
            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* 成功メッセージ */}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                {success}
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

            {/* 変更ボタン */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent-sand text-ink font-semibold py-3 px-4 rounded-xl hover:bg-accent-sand/80 focus:outline-none focus:ring-2 focus:ring-accent-sand focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-panel"
            >
              {isLoading ? '変更中...' : 'パスワードを変更'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
