import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuthForAPI } from '@/lib/auth/session';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

// バリデーションスキーマ
const createExpenseSchema = z.object({
  project_id: z.string().uuid().optional(),
  amount: z.number().min(0, '金額は0以上で入力してください'),
  tax_amount: z.number().min(0, '税額は0以上で入力してください').optional(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です（YYYY-MM-DD）'),
  description: z.string().optional(),
  category: z.string().optional(),
});

/**
 * GET /api/expenses
 * 経費一覧取得
 *
 * クエリパラメータ:
 * - project_id: プロジェクトIDでフィルタ
 * - start_date: 開始日（YYYY-MM-DD）
 * - end_date: 終了日（YYYY-MM-DD）
 * - category: カテゴリでフィルタ
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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // データ取得
    const supabase = await createClient();
    let query = supabase
      .from('expenses')
      .select('*, projects(name)')
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('expense_date', { ascending: false })
      .range(offset, offset + limit - 1);

    // プロジェクトIDフィルタ
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // 開始日フィルタ
    if (startDate) {
      query = query.gte('expense_date', startDate);
    }

    // 終了日フィルタ
    if (endDate) {
      query = query.lte('expense_date', endDate);
    }

    // カテゴリフィルタ
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/expenses
 * 経費登録
 *
 * リクエストボディ:
 * {
 *   project_id?: string,
 *   amount: number,
 *   tax_amount?: number,
 *   expense_date: string (YYYY-MM-DD),
 *   description?: string,
 *   category?: string
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
    const validated = createExpenseSchema.parse(body);

    const supabase = await createClient();

    // 税額自動計算（指定がない場合）
    if (validated.tax_amount === undefined) {
      // app_settingsからtax_rateを取得
      const { data: settings } = await supabase
        .from('app_settings')
        .select('tax_rate')
        .eq('user_id', user.id)
        .single();

      const taxRate = settings?.tax_rate || 10; // デフォルト10%
      validated.tax_amount = Math.floor(validated.amount * (taxRate / 100));
    }

    // データ挿入
    const { data, error } = await supabase
      .from('expenses')
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
