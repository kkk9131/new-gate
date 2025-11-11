import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuthForAPI } from '@/lib/auth/session';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

// バリデーションスキーマ
const updateExpenseSchema = z.object({
  project_id: z.string().uuid().optional(),
  amount: z.number().min(0, '金額は0以上で入力してください').optional(),
  tax_amount: z.number().min(0, '税額は0以上で入力してください').optional(),
  expense_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です（YYYY-MM-DD）').optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

/**
 * GET /api/expenses/[id]
 * 経費詳細取得
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
      .from('expenses')
      .select('*, projects(name)')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;

    // データが存在しない場合は404
    if (!data) {
      return NextResponse.json(
        { error: { message: '経費データが見つかりません' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * PATCH /api/expenses/[id]
 * 経費更新
 *
 * リクエストボディ:
 * {
 *   project_id?: string,
 *   amount?: number,
 *   tax_amount?: number,
 *   expense_date?: string (YYYY-MM-DD),
 *   description?: string,
 *   category?: string
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
    const validated = updateExpenseSchema.parse(body);

    // データ更新
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('expenses')
      .update(validated)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // データが存在しない場合は404
    if (!data) {
      return NextResponse.json(
        { error: { message: '経費データが見つかりません' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * DELETE /api/expenses/[id]
 * 経費削除（ソフトデリート）
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
      .from('expenses')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // データが存在しない場合は404
    if (!data) {
      return NextResponse.json(
        { error: { message: '経費データが見つかりません' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: '削除しました' });
  } catch (error) {
    return handleAPIError(error);
  }
}
