import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * アクティブセッション一覧を取得するAPI
 * GET /api/settings/security/sessions
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

    // アクティブセッション一覧を取得
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('last_activity_at', { ascending: false });

    if (error) {
      console.error('セッション取得エラー:', error);
      return NextResponse.json(
        { error: 'セッションの取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessions: sessions || [] });
  } catch (error) {
    console.error('セッション取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
