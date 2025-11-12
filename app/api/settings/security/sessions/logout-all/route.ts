import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * 全セッションからログアウトするAPI（現在のセッションを除く）
 * POST /api/settings/security/sessions/logout-all
 */
export async function POST() {
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

    // 現在のセッション以外をすべて削除
    const { data: deletedSessions, error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', user.id)
      .eq('is_current', false)
      .select();

    if (error) {
      console.error('全セッション削除エラー:', error);
      return NextResponse.json(
        { error: '全セッションのログアウトに失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '全デバイスからログアウトしました',
      logged_out_count: deletedSessions?.length || 0,
    });
  } catch (error) {
    console.error('全セッション削除エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
