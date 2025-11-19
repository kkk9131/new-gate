import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

/**
 * サーバーサイドで現在のユーザー情報を取得
 *
 * Server ComponentやServer Actionから呼び出します。
 * 未認証の場合はnullを返します。
 *
 * @returns ユーザー情報、または未認証の場合はnull
 */
export async function getUserOnServer(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * 認証を必須とするページで使用
 *
 * 未認証の場合は自動的に/loginページにリダイレクトします。
 * 認証済みの場合はユーザー情報を返します。
 *
 * @returns ユーザー情報
 * @throws リダイレクト（未認証時）
 */
export async function requireAuth(): Promise<User> {
  const user = await getUserOnServer();

  if (!user) {
    redirect('/login');
  }

  return user;
}

/**
 * API Routes用の認証チェック
 *
 * 未認証の場合はnullを返します（リダイレクトしません）。
 * 認証済みの場合はユーザー情報を返します。
 *
 * API Routesでは redirect() が使えないため、この関数を使用します。
 * 未認証時は呼び出し側で適切なエラーレスポンスを返す必要があります。
 *
 * @returns ユーザー情報、または未認証の場合はnull
 */
export async function requireAuthForAPI(): Promise<User | null> {
  return await getUserOnServer();
}

/**
 * ログアウト処理
 *
 * セッションを削除し、/loginページにリダイレクトします。
 * Server Actionから呼び出します。
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();

  await supabase.auth.signOut();
  redirect('/login');
}

/**
 * セッションの有効期限を確認
 *
 * @returns セッションが有効な場合はtrue
 */
export async function isSessionValid(): Promise<boolean> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return false;
  }

  // セッションの有効期限をチェック（Unix timestamp: 秒単位）
  const expiresAt = session.expires_at;
  const now = Math.floor(Date.now() / 1000);

  return expiresAt ? expiresAt > now : false;
}
