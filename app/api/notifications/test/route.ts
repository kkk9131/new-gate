import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/notifications/test
 * テスト用の通知を作成
 * 開発環境でのみ使用
 */
export async function POST() {
  try {
    const supabase = await createClient();

    // ユーザー認証確認
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // テスト通知を作成
    const testNotifications = [
      {
        user_id: user.id,
        type: 'system',
        title: 'システム通知のテスト',
        message: 'これはシステム通知のテストメッセージです。',
        read: false,
      },
      {
        user_id: user.id,
        type: 'project_update',
        title: 'プロジェクトが更新されました',
        message: '「新機能開発」のステータスが「進行中」に変更されました。',
        read: false,
        link_url: '/projects',
      },
      {
        user_id: user.id,
        type: 'revenue_alert',
        title: '売上目標達成',
        message: '今月の売上が目標の100%を達成しました！おめでとうございます。',
        read: false,
        link_url: '/revenue',
      },
    ];

    // ランダムに1つ選択
    const randomNotification =
      testNotifications[Math.floor(Math.random() * testNotifications.length)];

    const { data, error } = await supabase
      .from('notifications')
      .insert([randomNotification])
      .select()
      .single();

    if (error) {
      console.error('テスト通知作成エラー:', error);
      return NextResponse.json(
        { error: 'テスト通知の作成に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: data,
    });
  } catch (error) {
    console.error('テスト通知API エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
