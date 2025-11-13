import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/**
 * パスワード変更APIエンドポイント
 *
 * POST /api/settings/security/change-password
 *
 * 機能:
 * - 現在のパスワードを検証
 * - 新しいパスワードに変更
 *
 * リクエストボディ:
 * {
 *   "currentPassword": string,  // 現在のパスワード
 *   "newPassword": string,  // 新しいパスワード（8文字以上）
 *   "confirmPassword": string  // 確認用パスワード
 * }
 *
 * レスポンス:
 * - 200: パスワード変更成功
 * - 400: バリデーションエラー
 * - 401: 認証エラーまたは現在のパスワード不一致
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
    const { currentPassword, newPassword, confirmPassword } = body;

    // バリデーション
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'すべてのパスワードフィールドを入力してください' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: '新しいパスワードが一致しません' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'パスワードは8文字以上で設定してください' },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: '新しいパスワードは現在のパスワードと異なるものを設定してください' },
        { status: 400 }
      );
    }

    // 現在のパスワードを検証
    if (!user.email) {
      return NextResponse.json(
        { error: 'メールアドレスが見つかりません' },
        { status: 400 }
      );
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: '現在のパスワードが正しくありません' },
        { status: 401 }
      );
    }

    // パスワードを変更
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('パスワード変更エラー:', updateError);
      return NextResponse.json(
        { error: 'パスワードの変更に失敗しました' },
        { status: 500 }
      );
    }

    // 成功レスポンス
    return NextResponse.json({
      message: 'パスワードを変更しました',
    });
  } catch (error) {
    console.error('パスワード変更APIエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
