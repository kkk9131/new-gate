import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * セッションタイムアウト設定を更新するAPI
 * PATCH /api/settings/security/session-timeout
 *
 * リクエストボディ:
 * {
 *   "session_timeout_minutes": number (30 | 60 | 180 | 360 | 1440 | null)
 * }
 */
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { session_timeout_minutes } = body;

    // 認証確認
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // バリデーション: 許可された値のみ受け付ける
    const allowedValues = [30, 60, 180, 360, 1440, null];
    if (!allowedValues.includes(session_timeout_minutes)) {
      return NextResponse.json(
        { error: '無効なタイムアウト値です' },
        { status: 400 }
      );
    }

    // user_settingsを更新（存在しない場合はINSERT）
    const { data: updateData, error: updateError, count } = await supabase
      .from('user_settings')
      .update({ session_timeout_minutes })
      .eq('user_id', user.id)
      .select();

    // 更新された行がない場合は、user_settings行が存在しない可能性がある
    if (!updateError && (!updateData || updateData.length === 0)) {
      const { data: insertData, error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          session_timeout_minutes,
        })
        .select();

      if (insertError) {
        console.error('[PATCH] INSERT失敗:', insertError);
        return NextResponse.json(
          { error: 'セッションタイムアウト設定の作成に失敗しました' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'セッションタイムアウト設定を作成しました',
        session_timeout_minutes,
      });
    }

    if (updateError) {
      console.error('[PATCH] UPDATE失敗:', updateError);
      return NextResponse.json(
        { error: 'セッションタイムアウト設定の更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'セッションタイムアウト設定を更新しました',
      session_timeout_minutes,
    });
  } catch (error) {
    console.error('セッションタイムアウト設定更新エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 現在のセッションタイムアウト設定を取得するAPI
 * GET /api/settings/security/session-timeout
 */
export async function GET() {
  try {
    const supabase = await createClient();

    // 認証確認
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // user_settingsから設定を取得
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('session_timeout_minutes')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // user_settings行が存在しない場合（PGRST116エラー）はデフォルト値を返す
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          session_timeout_minutes: 60,
        });
      }

      console.error('[GET] セッションタイムアウト設定取得エラー:', error);
      return NextResponse.json(
        { error: 'セッションタイムアウト設定の取得に失敗しました' },
        { status: 500 }
      );
    }

    // settingsがundefinedの場合のみデフォルト値60を返す
    // nullはユーザーが選択した「無効」の有効な値なので、そのまま返す
    const timeoutValue = settings?.session_timeout_minutes !== undefined
      ? settings.session_timeout_minutes
      : 60;

    return NextResponse.json({
      session_timeout_minutes: timeoutValue,
    });
  } catch (error) {
    console.error('セッションタイムアウト設定取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
