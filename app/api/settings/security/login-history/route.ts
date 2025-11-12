import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * ログイン履歴を取得するAPI
 * GET /api/settings/security/login-history
 *
 * クエリパラメータ:
 * - limit: 取得件数（デフォルト: 50）
 * - offset: オフセット（デフォルト: 0）
 * - status: フィルター（success | failed）
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // クエリパラメータを取得
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status'); // success | failed

    // 認証確認
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // クエリビルダー
    let query = supabase
      .from('login_history')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('login_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // ステータスフィルター
    if (status && (status === 'success' || status === 'failed')) {
      query = query.eq('status', status);
    }

    // ログイン履歴を取得
    const { data: history, error, count } = await query;

    if (error) {
      console.error('ログイン履歴取得エラー:', error);
      return NextResponse.json(
        { error: 'ログイン履歴の取得に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      history: history || [],
      total: count || 0,
    });
  } catch (error) {
    console.error('ログイン履歴取得エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
