import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * アカウント削除リクエスト状態確認APIエンドポイント
 *
 * GET /api/settings/privacy/deletion-status
 *
 * 機能:
 * - 現在のアカウント削除リクエストの状態を取得
 * - pending状態のリクエストがある場合、詳細情報を返す
 *
 * レスポンス:
 * - 200: 削除リクエスト情報
 *   {
 *     hasPendingDeletion: boolean,
 *     deletionRequest: {
 *       requested_at: string,
 *       scheduled_deletion_at: string,
 *       status: string
 *     } | null
 *   }
 * - 401: 認証エラー
 * - 500: サーバーエラー
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    // 認証確認
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // pending状態の削除リクエストを取得
    const { data: deletionRequest, error: fetchError } = await supabase
      .from('account_deletion_requests')
      .select('requested_at, scheduled_deletion_at, status')
      .eq('user_id', session.user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (fetchError) {
      console.error('削除リクエスト取得エラー:', fetchError);
      return NextResponse.json(
        { error: '削除リクエストの取得に失敗しました' },
        { status: 500 }
      );
    }

    // レスポンス
    return NextResponse.json({
      hasPendingDeletion: !!deletionRequest,
      deletionRequest: deletionRequest || null,
    });
  } catch (error) {
    console.error('削除状態確認APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
