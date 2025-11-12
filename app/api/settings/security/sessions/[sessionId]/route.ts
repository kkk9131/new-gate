import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * 特定のセッションをログアウトするAPI
 * DELETE /api/settings/security/sessions/:sessionId
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const supabase = await createClient();
    const { sessionId } = await params;

    // 認証確認
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // セッションの所有者確認
    const { data: session, error: fetchError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !session) {
      return NextResponse.json(
        { error: 'セッションが見つかりません' },
        { status: 404 }
      );
    }

    // セッションを削除
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      console.error('セッション削除エラー:', error);
      return NextResponse.json(
        { error: 'セッションの削除に失敗しました' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'セッションをログアウトしました' });
  } catch (error) {
    console.error('セッション削除エラー:', error);
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}
