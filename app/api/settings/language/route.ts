import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * 言語設定を取得するAPI
 * GET /api/settings/language
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

    // user_settingsから言語設定を取得
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select('ui_language, timezone, date_format, time_format')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = レコードが見つからない（初回アクセス時）
      console.error('言語設定取得エラー:', error);
      return NextResponse.json(
        { error: '言語設定の取得に失敗しました' },
        { status: 500 }
      );
    }

    // データが存在しない場合はデフォルト値を返す
    if (!settings) {
      return NextResponse.json({
        ui_language: 'ja',
        timezone: 'Asia/Tokyo',
        date_format: 'YYYY/MM/DD',
        time_format: '24h',
      });
    }

    return NextResponse.json({
      ui_language: settings.ui_language || 'ja',
      timezone: settings.timezone || 'Asia/Tokyo',
      date_format: settings.date_format || 'YYYY/MM/DD',
      time_format: settings.time_format || '24h',
    });
  } catch (error) {
    console.error('言語設定取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * 言語設定を更新するAPI
 * PATCH /api/settings/language
 */
export async function PATCH(request: Request) {
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

    // リクエストボディを取得
    const body = await request.json();
    const { ui_language, timezone, date_format, time_format } = body;

    // バリデーション：ui_language
    if (ui_language !== undefined && !['ja', 'en'].includes(ui_language)) {
      return NextResponse.json(
        { error: '無効な言語コードです（ja, enのみ許可）' },
        { status: 400 }
      );
    }

    // バリデーション：date_format
    if (
      date_format !== undefined &&
      !['YYYY/MM/DD', 'MM/DD/YYYY', 'DD/MM/YYYY'].includes(date_format)
    ) {
      return NextResponse.json(
        { error: '無効な日付フォーマットです' },
        { status: 400 }
      );
    }

    // バリデーション：time_format
    if (time_format !== undefined && !['24h', '12h'].includes(time_format)) {
      return NextResponse.json(
        { error: '無効な時刻フォーマットです' },
        { status: 400 }
      );
    }

    // 更新するデータを準備（undefinedではなくnull判定を使う）
    const updateData: {
      ui_language?: string;
      timezone?: string;
      date_format?: string;
      time_format?: string;
    } = {};

    if (ui_language !== undefined) updateData.ui_language = ui_language;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (date_format !== undefined) updateData.date_format = date_format;
    if (time_format !== undefined) updateData.time_format = time_format;

    // まずUPDATE試行
    const { data: updatedSettings, error: updateError } = await supabase
      .from('user_settings')
      .update(updateData)
      .eq('user_id', user.id)
      .select('ui_language, timezone, date_format, time_format')
      .single();

    // UPDATEが成功した場合
    if (!updateError) {
      return NextResponse.json({
        message: '言語設定を更新しました',
        settings: updatedSettings,
      });
    }

    // レコードが存在しない場合（PGRST116エラー）はINSERT
    if (updateError.code === 'PGRST116') {
      const { data: insertedSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          ...updateData,
        })
        .select('ui_language, timezone, date_format, time_format')
        .single();

      if (insertError) {
        console.error('言語設定INSERT失敗:', insertError);
        return NextResponse.json(
          { error: '言語設定の作成に失敗しました' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: '言語設定を作成しました',
        settings: insertedSettings,
      });
    }

    // その他のエラー
    console.error('言語設定UPDATE失敗:', updateError);
    return NextResponse.json(
      { error: '言語設定の更新に失敗しました' },
      { status: 500 }
    );
  } catch (error) {
    console.error('言語設定更新エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
