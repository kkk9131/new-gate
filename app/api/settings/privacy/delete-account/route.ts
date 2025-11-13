import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * アカウント削除APIエンドポイント
 *
 * POST /api/settings/privacy/delete-account
 *
 * 機能:
 * - パスワード検証
 * - 削除リクエストの作成（30日間の猶予期間）
 * - 削除実行日時の設定
 *
 * リクエストボディ:
 * {
 *   "password": string  // パスワード
 * }
 *
 * レスポンス:
 * - 200: 削除リクエスト作成成功
 * - 400: パスワード未入力
 * - 401: 認証エラーまたはパスワード不一致
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
    const { password } = body;

    // バリデーション
    if (!password) {
      return NextResponse.json(
        { error: 'パスワードを入力してください' },
        { status: 400 }
      );
    }

    // パスワード検証
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: session.user.email!,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'パスワードが正しくありません' },
        { status: 401 }
      );
    }

    // 削除実行日を計算（30日後）
    const scheduledDeletionAt = new Date();
    scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + 30);

    // アカウント削除リクエストを作成
    // account_deletion_requestsテーブルにレコードを挿入
    const { error: insertError } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: session.user.id,
        requested_at: new Date().toISOString(),
        scheduled_deletion_at: scheduledDeletionAt.toISOString(),
        status: 'pending',
      });

    if (insertError) {
      console.error('削除リクエスト作成エラー:', insertError);
      return NextResponse.json(
        { error: 'アカウント削除リクエストの作成に失敗しました' },
        { status: 500 }
      );
    }

    // 成功レスポンス
    return NextResponse.json({
      message: 'アカウント削除リクエストを送信しました',
      scheduled_deletion_at: scheduledDeletionAt.toISOString(),
    });
  } catch (error) {
    console.error('アカウント削除APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
