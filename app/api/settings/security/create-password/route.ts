import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * パスワード作成APIエンドポイント（Googleログインユーザー向け）
 *
 * POST /api/settings/security/create-password
 *
 * 機能:
 * - Googleログインユーザーが初めてパスワードを設定
 * - パスワードの強度検証
 *
 * リクエストボディ:
 * {
 *   "password": string,  // 新しいパスワード（8文字以上）
 *   "confirmPassword": string  // 確認用パスワード
 * }
 *
 * レスポンス:
 * - 200: パスワード作成成功
 * - 400: バリデーションエラー
 * - 401: 認証エラー
 * - 403: パスワード既に設定済み
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
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // リクエストボディを取得
    const body = await request.json();
    const { password, confirmPassword } = body;

    // バリデーション
    if (!password || !confirmPassword) {
      return NextResponse.json(
        { error: 'パスワードと確認用パスワードを入力してください' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'パスワードが一致しません' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上で設定してください' },
        { status: 400 }
      );
    }

    // ユーザーの認証プロバイダーを確認
    const identities = user.identities || [];
    const providers = identities.map((identity: any) => identity.provider);
    const hasEmailProvider = providers.includes('email');

    // user_metadataのhas_passwordフラグもチェック
    const hasPasswordFromMetadata = user.user_metadata?.has_password === true;

    // 既にパスワードが設定されている場合はエラー
    if (hasEmailProvider || hasPasswordFromMetadata) {
      return NextResponse.json(
        { error: 'パスワードは既に設定されています' },
        { status: 403 }
      );
    }

    // Supabase Auth APIを使用してパスワードを設定
    // updateUserメソッドでパスワードを設定し、user_metadataにフラグを保存
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      password: password,
      data: {
        has_password: true,
      },
    });

    if (updateError) {
      console.error('パスワード作成エラー:', updateError);
      return NextResponse.json(
        { error: 'パスワードの作成に失敗しました' },
        { status: 500 }
      );
    }

    // セッションを明示的にリフレッシュして最新のuser_metadataを取得
    await supabase.auth.refreshSession();

    // 成功レスポンス
    return NextResponse.json({
      message: 'パスワードを作成しました',
    });
  } catch (error) {
    console.error('パスワード作成APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
