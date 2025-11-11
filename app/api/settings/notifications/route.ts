import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuthForAPI } from '@/lib/auth/session';

/**
 * 通知設定の型定義
 */
interface NotificationSettings {
  // 通知方法
  notification_email: boolean;
  notification_browser: boolean;
  notification_in_app: boolean;
  notification_sound: boolean;

  // 通知カテゴリ
  notify_agent_task_success: boolean;
  notify_agent_task_failure: boolean;
  notify_security_alert: boolean;
  notify_platform_updates: boolean;
  notify_project_reminder: boolean;

  // 通知タイミング
  notification_timing: 'immediate' | 'batched' | 'business_hours';
  notification_batch_interval: number;
  notification_business_hours_start: string;
  notification_business_hours_end: string;
}

/**
 * GET /api/settings/notifications
 *
 * 現在のユーザーの通知設定を取得します。
 * 設定が存在しない場合はデフォルト値で新規作成します。
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await requireAuthForAPI();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    // 既存の設定を取得
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select(`
        notification_email,
        notification_browser,
        notification_in_app,
        notification_sound,
        notify_agent_task_success,
        notify_agent_task_failure,
        notify_security_alert,
        notify_platform_updates,
        notify_project_reminder,
        notification_timing,
        notification_batch_interval,
        notification_business_hours_start,
        notification_business_hours_end
      `)
      .eq('user_id', user.id)
      .single();

    // 設定が存在しない場合はデフォルト値で作成
    if (error && error.code === 'PGRST116') {
      const defaultSettings: NotificationSettings = {
        notification_email: true,
        notification_browser: true,
        notification_in_app: true,
        notification_sound: true,
        notify_agent_task_success: true,
        notify_agent_task_failure: true,
        notify_security_alert: true,
        notify_platform_updates: false,
        notify_project_reminder: true,
        notification_timing: 'immediate',
        notification_batch_interval: 60,
        notification_business_hours_start: '09:00',
        notification_business_hours_end: '18:00',
      };

      const { data: newSettings, error: createError } = await supabase
        .from('user_settings')
        .insert([
          {
            user_id: user.id,
            ...defaultSettings,
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('通知設定の作成エラー:', createError);
        return NextResponse.json(
          { error: '通知設定の作成に失敗しました' },
          { status: 500 }
        );
      }

      return NextResponse.json(defaultSettings, { status: 200 });
    }

    if (error) {
      console.error('通知設定の取得エラー:', error);
      return NextResponse.json(
        { error: '通知設定の取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(settings, { status: 200 });
  } catch (error) {
    console.error('通知設定API予期しないエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/settings/notifications
 *
 * 現在のユーザーの通知設定を更新します。
 * 部分的な更新が可能で、送信されたフィールドのみが更新されます。
 */
export async function PATCH(request: NextRequest) {
  try {
    // 認証チェック
    const user = await requireAuthForAPI();
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      );
    }

    // リクエストボディを取得
    const body = await request.json();

    // バリデーション: 許可されたフィールドのみを抽出
    const allowedFields: (keyof NotificationSettings)[] = [
      'notification_email',
      'notification_browser',
      'notification_in_app',
      'notification_sound',
      'notify_agent_task_success',
      'notify_agent_task_failure',
      'notify_security_alert',
      'notify_platform_updates',
      'notify_project_reminder',
      'notification_timing',
      'notification_batch_interval',
      'notification_business_hours_start',
      'notification_business_hours_end',
    ];

    const updates: Partial<NotificationSettings> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // 更新するフィールドが空の場合
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '更新するフィールドがありません' },
        { status: 400 }
      );
    }

    // バリデーション: notification_timingの値チェック
    if (
      updates.notification_timing &&
      !['immediate', 'batched', 'business_hours'].includes(
        updates.notification_timing
      )
    ) {
      return NextResponse.json(
        { error: 'notification_timingの値が不正です' },
        { status: 400 }
      );
    }

    // バリデーション: notification_batch_intervalの範囲チェック
    if (
      updates.notification_batch_interval !== undefined &&
      (updates.notification_batch_interval < 1 ||
        updates.notification_batch_interval > 1440)
    ) {
      return NextResponse.json(
        { error: 'notification_batch_intervalは1〜1440の範囲で指定してください' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 設定を更新
    const { data: updatedSettings, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      // 設定が存在しない場合は新規作成
      if (error.code === 'PGRST116') {
        const { data: newSettings, error: createError } = await supabase
          .from('user_settings')
          .insert([
            {
              user_id: user.id,
              ...updates,
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error('通知設定の作成エラー:', createError);
          return NextResponse.json(
            { error: '通知設定の作成に失敗しました' },
            { status: 500 }
          );
        }

        return NextResponse.json(
          {
            message: '通知設定を更新しました',
            settings: newSettings,
          },
          { status: 200 }
        );
      }

      console.error('通知設定の更新エラー:', error);
      return NextResponse.json(
        { error: '通知設定の更新に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: '通知設定を更新しました',
        settings: updatedSettings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('通知設定API予期しないエラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
