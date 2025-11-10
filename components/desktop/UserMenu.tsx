'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import { RiUserLine, RiLogoutBoxLine, RiArrowDownSLine } from 'react-icons/ri';

/**
 * ユーザーメニューコンポーネント
 *
 * ヘッダー右側に表示されるユーザー情報とドロップダウンメニュー
 * - ユーザーアイコン+名前の表示
 * - クリックでメニュー展開
 * - プロフィール編集/ログアウト
 */
export function UserMenu() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // ログアウト処理
  const handleLogout = async () => {
    console.log('🔴 ログアウトボタンがクリックされました');
    try {
      const supabase = createClient();
      console.log('🔴 Supabaseクライアント作成');
      await supabase.auth.signOut();
      console.log('🔴 ログアウト成功');
      clearAuth();
      console.log('🔴 Auth状態クリア');
      setIsOpen(false);
      router.push('/login');
      console.log('🔴 /loginにリダイレクト');
      router.refresh();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  };

  // プロフィール編集画面へ遷移
  const handleProfile = () => {
    console.log('🟢 プロフィール編集ボタンがクリックされました');
    setIsOpen(false);
    console.log('🟢 メニューを閉じました');
    router.push('/profile');
    console.log('🟢 /profileにリダイレクト');
  };

  if (!user) return null;

  // ユーザー名の取得（メールアドレスから@の前を使用）
  const displayName = user.email?.split('@')[0] || 'ユーザー';
  const initial = user.email?.[0].toUpperCase() || 'U';

  return (
    <div className="relative" ref={menuRef}>
      {/* ユーザーボタン */}
      <button
        type="button"
        onClick={() => {
          console.log('🔵 ユーザーメニューボタンがクリックされました。現在の状態:', isOpen);
          setIsOpen(!isOpen);
        }}
        className="
          flex items-center gap-2 px-2 py-2
          bg-surface border border-white/40
          hover:bg-cloud/20
          rounded-xl
          transition-colors duration-200
          shadow-soft hover:shadow-panel
        "
        aria-label="ユーザーメニュー"
        aria-expanded={isOpen}
      >
        {/* アイコン */}
        <div className="w-8 h-8 rounded-full bg-accent-sand flex items-center justify-center">
          <span className="text-ink text-sm font-semibold">
            {initial}
          </span>
        </div>

        {/* ユーザー名（デスクトップのみ表示） */}
        <span className="hidden sm:block text-sm text-ink font-medium">
          {displayName}
        </span>

        {/* ドロップダウンアイコン */}
        <RiArrowDownSLine
          className={`
            w-5 h-5 text-ink
            transition-transform duration-200
            ${isOpen ? 'rotate-180' : ''}
          `}
        />
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div
          className="
            absolute right-0 mt-2 w-56
            bg-surface/95 backdrop-blur-xl
            rounded-xl shadow-panel
            border border-white/40
            py-2
            z-[100]
          "
        >
          {/* ユーザー情報表示 */}
          <div className="px-4 py-3 border-b border-white/40">
            <p className="text-sm font-medium text-ink">
              {displayName}
            </p>
            <p className="text-xs text-ink/60 truncate">
              {user.email}
            </p>
          </div>

          {/* メニュー項目 */}
          <div className="py-1">
            {/* プロフィール編集 */}
            <button
              type="button"
              onClick={handleProfile}
              className="
                w-full flex items-center gap-3 px-4 py-2
                text-sm text-ink
                hover:bg-cloud/20
                transition-colors duration-150
              "
            >
              <RiUserLine className="w-5 h-5 text-accent-sand" />
              <span>プロフィール編集</span>
            </button>

            {/* ログアウト */}
            <button
              type="button"
              onClick={handleLogout}
              className="
                w-full flex items-center gap-3 px-4 py-2
                text-sm text-red-600
                hover:bg-red-50
                transition-colors duration-150
              "
            >
              <RiLogoutBoxLine className="w-5 h-5" />
              <span>ログアウト</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
