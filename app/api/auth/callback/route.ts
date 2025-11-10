import { NextRequest, NextResponse } from 'next/server';
import { createClientWithResponse } from '@/lib/supabase/route';

/**
 * OAuth/メール確認コールバックAPI
 *
 * Supabase Authからのリダイレクトを処理します。
 * - メール確認リンクのクリック後
 * - OAuth認証（Google等）のリダイレクト後
 *
 * 認証コードを検証し、セッションCookieを設定してから
 * デスクトップUIへリダイレクトします。
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // エラーがある場合はログインページへリダイレクト
  if (error) {
    console.error('認証エラー:', error, errorDescription);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // 認証コードがない場合
  if (!code) {
    console.error('認証コードがありません');
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=no_code`
    );
  }

  try {
    // Supabaseクライアントを作成（レスポンスと共にCookie設定）
    const { supabase, response } = await createClientWithResponse(request);

    // 認証コードをセッションに交換
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      throw exchangeError;
    }

    if (!data.session) {
      throw new Error('セッションの作成に失敗しました');
    }

    console.log('✅ セッション作成成功:', {
      userId: data.user.id,
      email: data.user.email,
      expiresAt: data.session.expires_at,
    });

    // 成功 → デスクトップUIへリダイレクト
    // クエリパラメータでセッション再読み込みを指示
    const redirectUrl = new URL('/', requestUrl.origin);
    redirectUrl.searchParams.set('session', 'reload');
    const redirectResponse = NextResponse.redirect(redirectUrl);

    // レスポンスのCookieをコピー
    response.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        ...cookie,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
    });

    return redirectResponse;
  } catch (err: any) {
    console.error('認証コード交換エラー:', err);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(err.message)}`
    );
  }
}
