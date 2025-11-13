import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * ユーザーの認証プロバイダー情報取得APIエンドポイント
 *
 * GET /api/settings/security/auth-provider
 *
 * 機能:
 * - ユーザーの認証プロバイダー（google, email等）を取得
 * - パスワードが設定されているかどうかを確認
 *
 * レスポンス:
 * - 200: プロバイダー情報
 *   {
 *     provider: 'google' | 'email',
 *     hasPassword: boolean
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
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // ユーザーの認証プロバイダーを確認
    // app_metadataのprovidersまたはidentitiesから取得
    const identities = user.identities || [];
    const providers = identities.map((identity: any) => identity.provider);

    // Googleプロバイダーがあるか確認
    const hasGoogleProvider = providers.includes('google');

    // メールプロバイダーがあるか確認（パスワードログイン）
    const hasEmailProvider = providers.includes('email');

    // プライマリプロバイダーを決定
    const primaryProvider = hasGoogleProvider ? 'google' : 'email';

    // パスワードが設定されているか確認
    // 1. user_metadataのhas_passwordフラグをチェック（優先）
    // 2. emailプロバイダーの存在をチェック（フォールバック）
    const hasPasswordFromMetadata = user.user_metadata?.has_password === true;
    const hasPassword = hasPasswordFromMetadata || hasEmailProvider;

    // Cache-Controlヘッダーを追加してブラウザキャッシュを無効化
    return NextResponse.json(
      {
        provider: primaryProvider,
        hasPassword,
        providers, // デバッグ用
        hasPasswordFromMetadata, // デバッグ用
      },
      {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error('認証プロバイダー取得APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
