import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * アカウント削除キャンセルAPIエンドポイント
 *
 * POST /api/settings/privacy/cancel-deletion
 *
 * 機能:
 * - 猶予期間中のアカウント削除リクエストをキャンセル
 * - status を 'cancelled' に更新
 * - cancelled_at を現在日時に設定
 *
 * リクエストボディ:
 * {
 *   "reason": string (optional)  // キャンセル理由
 * }
 *
 * レスポンス:
 * - 200: キャンセル成功
 * - 401: 認証エラー
 * - 404: 削除リクエストが見つからない
 * - 500: サーバーエラー
 */
export async function POST(request: NextRequest) {
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

    // リクエストボディを取得
    const body = await request.json();
    const { reason } = body;

    // pending状態の削除リクエストを取得
    const { data: deletionRequest, error: fetchError } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !deletionRequest) {
      return NextResponse.json(
        { error: '有効な削除リクエストが見つかりません' },
        { status: 404 }
      );
    }

    // 削除リクエストをキャンセル
    const { error: updateError } = await supabase
      .from('account_deletion_requests')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || null,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', deletionRequest.id);

    if (updateError) {
      console.error('削除リクエストキャンセルエラー:', updateError);
      return NextResponse.json(
        { error: '削除リクエストのキャンセルに失敗しました' },
        { status: 500 }
      );
    }

    // 成功レスポンス
    return NextResponse.json({
      message: 'アカウント削除リクエストをキャンセルしました',
      cancelled_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('削除キャンセルAPIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
