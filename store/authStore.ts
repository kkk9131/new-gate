import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

/**
 * 認証状態の型定義
 */
interface AuthState {
  // 状態
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;

  // アクション
  setAuth: (payload: { user: User | null; session: Session | null }) => void;
  setLoading: (value: boolean) => void;
  setInitialized: (value: boolean) => void;
  clearAuth: () => void;
}

/**
 * 認証状態管理ストア
 *
 * ユーザーのログイン状態、セッション情報、ローディング状態を管理します。
 * サーバー側の認証情報を信頼し、localStorageには保存しません。
 *
 * 使用例:
 * ```typescript
 * const { user, isLoading, setAuth } = useAuthStore();
 *
 * // ログイン後
 * setAuth({ user: userData, session: sessionData });
 *
 * // ログアウト後
 * clearAuth();
 * ```
 */
export const useAuthStore = create<AuthState>()((set) => ({
  // 初期状態
  user: null,
  session: null,
  isLoading: true,
  isInitialized: false,

  // 認証情報を設定
  setAuth: ({ user, session }) => {
    set({
      user,
      session,
      isLoading: false,
      isInitialized: true,
    });
  },

  // ローディング状態を設定
  setLoading: (value) => {
    set({ isLoading: value });
  },

  // 初期化完了フラグを設定
  setInitialized: (value) => {
    set({ isInitialized: value });
  },

  // 認証情報をクリア
  clearAuth: () => {
    set({
      user: null,
      session: null,
      isLoading: false,
      isInitialized: true,
    });
  },
}));

/**
 * 認証状態のセレクター（パフォーマンス最適化用）
 */
export const selectUser = (state: AuthState) => state.user;
export const selectSession = (state: AuthState) => state.session;
export const selectIsLoading = (state: AuthState) => state.isLoading;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
export const selectIsAuthenticated = (state: AuthState) => !!state.user;
