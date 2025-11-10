'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/store/authStore';

/**
 * 認証状態リスナーコンポーネント
 *
 * Supabaseの認証状態変化を監視し、Zustandストアを更新します。
 * ルートレイアウトに配置して、アプリ全体で認証状態を同期します。
 *
 * 主な機能:
 * - onAuthStateChange でセッション変化を監視
 * - ログイン/ログアウト時にZustandを自動更新
 * - ページリロード時に既存セッションを復元
 */
export function AuthListener() {
  const { setAuth, clearAuth, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    // 初期セッションの取得
    const initializeAuth = async () => {
      setLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setAuth({
          user: session.user,
          session,
        });
      } else {
        clearAuth();
      }

      setInitialized(true);
      setLoading(false);
    };

    initializeAuth();

    // 認証状態変化の監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setAuth({
          user: session.user,
          session,
        });
      } else {
        clearAuth();
      }
    });

    // クリーンアップ
    return () => {
      subscription.unsubscribe();
    };
  }, [setAuth, clearAuth, setLoading, setInitialized]);

  // このコンポーネントはUIを表示しない
  return null;
}
