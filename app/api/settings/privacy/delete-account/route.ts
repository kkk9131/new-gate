import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// 定数定義
const DELETION_GRACE_PERIOD_DAYS = 30;

/**
 * アカウント削除APIエンドポイント
 *
 * POST /api/settings/privacy/delete-account
 *
 * 機能:
 * - パスワード検証（パスワード設定済みユーザーのみ）
 * - Googleユーザー向けのパスワード未設定チェック
 * - 重複削除リクエストの防止
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
 * - 400: パスワード未入力またはGoogleユーザーでパスワード未設定
 * - 401: 認証エラーまたはパスワード不一致
 * - 409: 既存の削除リクエストが存在
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

    // ユーザーの認証プロバイダーとパスワード設定状況を確認
    const identities = session.user.identities || [];
    const hasPassword = session.user.user_metadata?.has_password === true;

    // Googleユーザーでパスワード未設定の場合はエラー
    if (!hasPassword) {
      return NextResponse.json(
        { error: 'アカウント削除にはパスワードの設定が必要です。プロフィールページからパスワードを作成してください。' },
        { status: 400 }
      );
    }

    // 既存のpending削除リクエストを確認
    const { data: existingRequest } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'pending')
      .single();

    if (existingRequest) {
      return NextResponse.json(
        {
          error: '既に削除リクエストが進行中です',
          scheduled_deletion_at: existingRequest.scheduled_deletion_at,
        },
        { status: 409 } // Conflict
      );
    }

    // パスワード検証（一時的なクライアントを使用）
    const tempCookieStore = await cookies();
    const tempSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return tempCookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              tempCookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error: signInError } = await tempSupabase.auth.signInWithPassword({
      email: session.user.email!,
      password,
    });

    // パスワード検証後、すぐにサインアウトしてセッションをクリーンアップ
    if (!signInError) {
      await tempSupabase.auth.signOut();
    }

    if (signInError) {
      return NextResponse.json(
        { error: 'パスワードが正しくありません' },
        { status: 401 }
      );
    }

    // 削除実行日を計算（定数を使用）
    const scheduledDeletionAt = new Date();
    scheduledDeletionAt.setDate(scheduledDeletionAt.getDate() + DELETION_GRACE_PERIOD_DAYS);

    // アカウント削除リクエストを作成
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
