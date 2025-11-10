import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/route';
import type { User } from '@supabase/supabase-js';

/**
 * API認証エラーレスポンス
 */
export const UNAUTHORIZED_RESPONSE = NextResponse.json(
  {
    error: {
      code: 'UNAUTHORIZED',
      message: '認証が必要です。ログインしてください。',
    },
  },
  { status: 401 }
);

/**
 * API認証禁止エラーレスポンス
 */
export const FORBIDDEN_RESPONSE = NextResponse.json(
  {
    error: {
      code: 'FORBIDDEN',
      message: 'この操作を実行する権限がありません。',
    },
  },
  { status: 403 }
);

/**
 * API Routeで認証チェックを実行
 *
 * Cookie経由でSupabaseセッションを検証し、ユーザー情報を返します。
 * 未認証の場合は401レスポンスを返します。
 *
 * 使用例:
 * ```typescript
 * export async function GET() {
 *   const user = await verifyApiAuth();
 *   if (!user) return UNAUTHORIZED_RESPONSE;
 *   // 認証済みの処理...
 * }
 * ```
 *
 * @returns ユーザー情報、または未認証の場合はnull
 */
export async function verifyApiAuth(): Promise<User | null> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('API認証エラー:', error?.message);
      return null;
    }

    return user;
  } catch (error) {
    console.error('API認証チェック失敗:', error);
    return null;
  }
}

/**
 * API Routeで認証を必須とする
 *
 * 未認証の場合は自動的に401レスポンスを返します。
 * 認証済みの場合はユーザー情報を返します。
 *
 * 使用例:
 * ```typescript
 * export async function GET() {
 *   const result = await requireApiAuth();
 *   if (result instanceof NextResponse) return result;
 *   const user = result;
 *   // 認証済みの処理...
 * }
 * ```
 *
 * @returns ユーザー情報、またはエラーレスポンス
 */
export async function requireApiAuth(): Promise<User | NextResponse> {
  const user = await verifyApiAuth();

  if (!user) {
    return UNAUTHORIZED_RESPONSE;
  }

  return user;
}

/**
 * リソースの所有権を確認
 *
 * ユーザーが特定のリソースにアクセスする権限があるかチェックします。
 *
 * @param user - 認証済みユーザー
 * @param resourceUserId - リソースの所有者のユーザーID
 * @returns 権限がある場合はtrue
 */
export function verifyResourceOwnership(
  user: User,
  resourceUserId: string
): boolean {
  return user.id === resourceUserId;
}

/**
 * リソース所有権を必須とする
 *
 * 権限がない場合は403レスポンスを返します。
 *
 * @param user - 認証済みユーザー
 * @param resourceUserId - リソースの所有者のユーザーID
 * @returns 成功の場合はnull、失敗の場合はエラーレスポンス
 */
export function requireResourceOwnership(
  user: User,
  resourceUserId: string
): null | NextResponse {
  if (!verifyResourceOwnership(user, resourceUserId)) {
    return FORBIDDEN_RESPONSE;
  }

  return null;
}
