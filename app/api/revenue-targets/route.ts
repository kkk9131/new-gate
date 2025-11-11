import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuthForAPI } from '@/lib/auth/session';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

// バリデーションスキーマ
const createTargetSchema = z
  .object({
    project_id: z.string().uuid().optional(),
    target_amount: z.number().min(0, '目標金額は0以上で入力してください'),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です（YYYY-MM-DD）'),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です（YYYY-MM-DD）'),
    title: z.string().min(1, 'タイトルは必須です').max(255, 'タイトルは255文字以内で入力してください'),
    description: z.string().optional(),
  })
  .refine(
    (data) => {
      return new Date(data.end_date) >= new Date(data.start_date);
    },
    {
      message: '終了日は開始日以降の日付を指定してください',
      path: ['end_date'],
    }
  );

/**
 * GET /api/revenue-targets
 * 売上目標一覧取得
 *
 * クエリパラメータ:
 * - project_id: プロジェクトIDでフィルタ
 * - active: 有効な目標のみ（現在日が期間内）
 * - limit: 取得件数（デフォルト: 50）
 * - offset: オフセット（デフォルト: 0）
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const user = await requireAuthForAPI();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const active = searchParams.get('active') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // データ取得
    const supabase = await createClient();
    let query = supabase
      .from('revenue_targets')
      .select('*, projects(name)')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('start_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // プロジェクトIDフィルタ
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // 有効な目標のみフィルタ（現在日が期間内）
    if (active) {
      const today = new Date().toISOString().split('T')[0];
      query = query.lte('start_date', today).gte('end_date', today);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/revenue-targets
 * 売上目標登録
 *
 * リクエストボディ:
 * {
 *   project_id?: string,
 *   target_amount: number,
 *   start_date: string (YYYY-MM-DD),
 *   end_date: string (YYYY-MM-DD),
 *   title: string,
 *   description?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const user = await requireAuthForAPI();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // リクエストボディ取得
    const body = await request.json();

    // バリデーション
    const validated = createTargetSchema.parse(body);

    // データ挿入
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('revenue_targets')
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
