import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * user_metadataのhas_passwordフラグを修正するAPIエンドポイント
 *
 * POST /api/settings/security/fix-password-metadata
 *
 * 既にパスワードが設定されているのにhas_passwordフラグがfalseの場合に使用
 */
export async function POST() {
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

    console.log('🔧 [API] fix-password-metadata - 修正前:', {
      userId: user.id,
      'user.user_metadata (before)': user.user_metadata,
      has_password_flag: user.user_metadata?.has_password,
    });

    // user_metadataを更新してhas_passwordフラグをtrueに設定
    const { data: updateData, error: updateError } = await supabase.auth.updateUser({
      data: {
        ...user.user_metadata,
        has_password: true,
      },
    });

    if (updateError) {
      console.error('❌ [API] fix-password-metadata - 更新エラー:', updateError);
      return NextResponse.json(
        { error: 'メタデータの更新に失敗しました' },
        { status: 500 }
      );
    }

    console.log('✅ [API] fix-password-metadata - 修正成功:', {
      'user.user_metadata (after)': updateData.user?.user_metadata,
      has_password_flag: updateData.user?.user_metadata?.has_password,
    });

    // セッションをリフレッシュ
    const { error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) {
      console.error('⚠️ [API] fix-password-metadata - セッションリフレッシュエラー:', refreshError);
    }

    return NextResponse.json({
      message: 'has_passwordフラグを更新しました',
      hasPassword: true,
    });
  } catch (error) {
    console.error('❌ [API] fix-password-metadata - エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
