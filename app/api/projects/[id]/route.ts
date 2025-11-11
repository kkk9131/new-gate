import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/session';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

// バリデーションスキーマ
const updateProjectSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(255, '名前は255文字以内で入力してください').optional(),
  description: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です（YYYY-MM-DD）').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です（YYYY-MM-DD）').optional(),
  notes: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
});

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
    const user = await requireAuth();

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
    const user = await requireAuth();

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
    const user = await requireAuth();

    // パラメータ取得
    const { id } = await params;

    // ソフトデリート
    const supabase = await createClient();
    const { error } = await supabase
      .from('projects')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ message: '削除しました' });
  } catch (error) {
    return handleAPIError(error);
  }
}
