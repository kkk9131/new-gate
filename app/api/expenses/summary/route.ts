import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuthForAPI } from '@/lib/auth/session';
import { handleAPIError } from '@/lib/utils/api-error';

/**
 * GET /api/expenses/summary
 * 経費集計
 *
 * クエリパラメータ:
 * - start_date: 開始日（YYYY-MM-DD）
 * - end_date: 終了日（YYYY-MM-DD）
 * - group_by: グループ化方法（'month' | 'project' | 'category'）
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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const groupBy = searchParams.get('group_by'); // 'month' | 'project' | 'category'

    // データ取得
    const supabase = await createClient();
    let query = supabase
      .from('expenses')
      .select('amount, tax_amount, expense_date, project_id, category, projects(name)')
      .eq('user_id', user.id)
      .eq('is_deleted', false);

    // 開始日フィルタ
    if (startDate) {
      query = query.gte('expense_date', startDate);
    }

    // 終了日フィルタ
    if (endDate) {
      query = query.lte('expense_date', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    // グループ化なしの場合は合計のみ返す
    if (!groupBy) {
      const total = data.reduce(
        (acc, item) => {
          acc.amount += item.amount || 0;
          acc.tax_amount += item.tax_amount || 0;
          acc.count += 1;
          return acc;
        },
        { amount: 0, tax_amount: 0, count: 0 }
      );

      return NextResponse.json({ data: total });
    }

    // 月別集計
    if (groupBy === 'month') {
      const monthly = data.reduce((acc, item) => {
        const month = item.expense_date.substring(0, 7); // YYYY-MM
        if (!acc[month]) {
          acc[month] = { amount: 0, tax_amount: 0, count: 0 };
        }
        acc[month].amount += item.amount || 0;
        acc[month].tax_amount += item.tax_amount || 0;
        acc[month].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; tax_amount: number; count: number }>);

      return NextResponse.json({ data: monthly });
    }

    // プロジェクト別集計
    if (groupBy === 'project') {
      const byProject = data.reduce((acc, item) => {
        const projectId = item.project_id || 'no_project';
        if (!acc[projectId]) {
          // projectsはSupabaseの型定義では配列だが、実際には単一のオブジェクトまたは配列
          const projectName = Array.isArray(item.projects)
            ? item.projects[0]?.name || '未割当'
            : (item.projects as any)?.name || '未割当';
          acc[projectId] = {
            project_name: projectName,
            amount: 0,
            tax_amount: 0,
            count: 0,
          };
        }
        acc[projectId].amount += item.amount || 0;
        acc[projectId].tax_amount += item.tax_amount || 0;
        acc[projectId].count += 1;
        return acc;
      }, {} as Record<string, { project_name: string; amount: number; tax_amount: number; count: 0 }>);

      return NextResponse.json({ data: byProject });
    }

    // カテゴリ別集計
    if (groupBy === 'category') {
      const byCategory = data.reduce((acc, item) => {
        const category = item.category || '未分類';
        if (!acc[category]) {
          acc[category] = { amount: 0, tax_amount: 0, count: 0 };
        }
        acc[category].amount += item.amount || 0;
        acc[category].tax_amount += item.tax_amount || 0;
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; tax_amount: number; count: number }>);

      return NextResponse.json({ data: byCategory });
    }

    // 不正なgroup_byパラメータ
    return NextResponse.json(
      { error: 'group_byパラメータは "month", "project", または "category" を指定してください' },
      { status: 400 }
    );
  } catch (error) {
    return handleAPIError(error);
  }
}
