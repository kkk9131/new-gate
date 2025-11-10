'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * 認証プロバイダー
 *
 * サーバーサイドから取得したユーザー情報をクライアント側のストアに設定します。
 * また、セッション変更を監視してストアを更新します。
 */
export function AuthProvider({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    const supabase = createClient();

    // サーバーから渡されたユーザー情報をストアに設定
    setAuth({ user, session: null });

    // セッションを取得してストアを更新
    const timer = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setAuth({ user: session.user, session });
        }
      });
    }, 100);

    // セッション変更を監視
    let isInitialized = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // 初回の INITIAL_SESSION イベントは無視
      if (!isInitialized && event === 'INITIAL_SESSION') {
        isInitialized = true;
        return;
      }

      if (session?.user) {
        setAuth({ user: session.user, session });
      } else if (event === 'SIGNED_OUT') {
        clearAuth();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  return <>{children}</>;
}
