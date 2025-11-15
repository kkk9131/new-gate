import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuthForAPI } from '@/lib/auth/session';
import { handleAPIError } from '@/lib/utils/api-error';
import { updateProjectSchema } from '@/lib/validators/projects';

/**
 * GET /api/projects/[id]
 * プロジェクト詳細取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const user = await requireAuthForAPI();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // パラメータ取得
    const { id } = await params;

    // データ取得
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;

    // データが存在しない場合は404
    if (!data) {
      return NextResponse.json(
        { error: { message: 'プロジェクトが見つかりません' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * PATCH /api/projects/[id]
 * プロジェクト更新
 *
 * リクエストボディ:
 * {
 *   name?: string,
 *   description?: string,
 *   start_date?: string (YYYY-MM-DD),
 *   end_date?: string (YYYY-MM-DD),
 *   notes?: string,
 *   status?: 'planning' | 'active' | 'completed' | 'on_hold'
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const user = await requireAuthForAPI();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // パラメータ取得
    const { id } = await params;

    // リクエストボディ取得
    const body = await request.json();

    // バリデーション
    const validated = updateProjectSchema.parse(body);

    // データ更新
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .update(validated)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // データが存在しない場合は404
    if (!data) {
      return NextResponse.json(
        { error: { message: 'プロジェクトが見つかりません' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * DELETE /api/projects/[id]
 * プロジェクト削除（ソフトデリート）
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const user = await requireAuthForAPI();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // パラメータ取得
    const { id } = await params;

    // ソフトデリート
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // データが存在しない場合は404
    if (!data) {
      return NextResponse.json(
        { error: { message: 'プロジェクトが見つかりません' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: '削除しました' });
  } catch (error) {
    return handleAPIError(error);
  }
}
