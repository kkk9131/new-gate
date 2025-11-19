import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuthForAPI } from '@/lib/auth/session';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

// バリデーションスキーマ
const updateRevenueSchema = z.object({
  project_id: z.string().uuid().optional(),
  amount: z.number().min(0, '金額は0以上で入力してください').optional(),
  tax_amount: z.number().min(0, '税額は0以上で入力してください').optional(),
  payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です（YYYY-MM-DD）').optional(),
  description: z.string().optional(),
  category: z.string().optional(),
});

/**
 * GET /api/revenues/[id]
 * 売上詳細取得
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
      .from('revenues')
      .select('*, projects(name)')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single();

    if (error) throw error;

    // データが存在しない場合は404
    if (!data) {
      return NextResponse.json(
        { error: { message: '売上データが見つかりません' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * PATCH /api/revenues/[id]
 * 売上更新
 *
 * リクエストボディ:
 * {
 *   project_id?: string,
 *   amount?: number,
 *   tax_amount?: number,
 *   payment_date?: string (YYYY-MM-DD),
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
    const validated = updateRevenueSchema.parse(body);

    // データ更新
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('revenues')
      .update(validated)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // データが存在しない場合は404
    if (!data) {
      return NextResponse.json(
        { error: { message: '売上データが見つかりません' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * DELETE /api/revenues/[id]
 * 売上削除（ソフトデリート）
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
      .from('revenues')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // データが存在しない場合は404
    if (!data) {
      return NextResponse.json(
        { error: { message: '売上データが見つかりません' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: '削除しました' });
  } catch (error) {
    return handleAPIError(error);
  }
}
