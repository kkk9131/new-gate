import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/session';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

// バリデーションスキーマ
const createProjectSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(255, '名前は255文字以内で入力してください'),
  description: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です（YYYY-MM-DD）'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です（YYYY-MM-DD）').optional(),
  notes: z.string().optional(),
  status: z.enum(['planning', 'active', 'completed', 'on_hold']).optional(),
});

/**
 * GET /api/projects
 * プロジェクト一覧取得
 *
 * クエリパラメータ:
 * - status: プロジェクトステータスでフィルタ（active/completed/on_hold）
 * - limit: 取得件数（デフォルト: 50）
 * - offset: オフセット（デフォルト: 0）
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await requireAuth();

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // データ取得
    const supabase = await createClient();
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // ステータスフィルタ
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/projects
 * プロジェクト作成
 *
 * リクエストボディ:
 * {
 *   name: string,
 *   description?: string,
 *   start_date: string (YYYY-MM-DD),
 *   end_date?: string (YYYY-MM-DD),
 *   notes?: string,
 *   status?: 'planning' | 'active' | 'completed' | 'on_hold'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await requireAuth();

    // リクエストボディ取得
    const body = await request.json();

    // バリデーション
    const validated = createProjectSchema.parse(body);

    // データ挿入
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .insert({
        ...validated,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
