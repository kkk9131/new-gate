import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { NotificationSettings, NotificationSettingsUpdate } from '@/types/notification-settings';

/**
 * GET /api/notification-settings
 * 通知設定を取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ユーザー認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 通知設定を取得
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 設定が存在しない場合はデフォルト設定を作成
    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: createError } = await supabase
        .from('notification_settings')
        .insert({
          user_id: user.id,
          enabled_types: ['system', 'project_update', 'revenue_alert', 'plugin_update', 'agent_complete', 'mention', 'reminder'],
          browser_notifications_enabled: false,
          sound_enabled: true,
          email_notifications_enabled: false,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return NextResponse.json({ settings: newSettings });
    }

    if (error) {
      throw error;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('通知設定取得エラー:', error);
    return NextResponse.json(
      { error: '通知設定の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notification-settings
 * 通知設定を更新
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // ユーザー認証チェック
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // リクエストボディを取得
    const body: NotificationSettingsUpdate = await request.json();

    // 通知設定を更新
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .update(body)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('通知設定更新エラー:', error);
    return NextResponse.json(
      { error: '通知設定の更新に失敗しました' },
      { status: 500 }
    );
  }
}
