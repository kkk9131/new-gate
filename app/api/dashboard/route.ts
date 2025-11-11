import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuthForAPI } from '@/lib/auth/session';
import { handleAPIError } from '@/lib/utils/api-error';

/**
 * GET /api/dashboard
 * ダッシュボード用集計データ取得
 *
 * クエリパラメータ:
 * - start_date: 開始日（YYYY-MM-DD）
 * - end_date: 終了日（YYYY-MM-DD）
 * - project_id: プロジェクトIDでフィルタ（オプション）
 *
 * レスポンス:
 * {
 *   summary: {
 *     total_revenue: 合計売上,
 *     total_expense: 合計経費,
 *     gross_profit: 粗利,
 *     gross_profit_rate: 粗利率（%）
 *   },
 *   target: {
 *     target_amount: 目標金額,
 *     achievement_rate: 達成率（%）,
 *     remaining: 目標までの残額,
 *     target_period: { start_date, end_date, title }
 *   },
 *   monthly: {
 *     [YYYY-MM]: {
 *       revenue: 売上,
 *       expense: 経費,
 *       gross_profit: 粗利
 *     }
 *   }
 * }
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
    const projectId = searchParams.get('project_id');

    const supabase = await createClient();

    // 売上データ取得
    let revenueQuery = supabase
      .from('revenues')
      .select('amount, tax_amount, revenue_date')
      .eq('user_id', user.id)
      .eq('is_deleted', false);

    if (startDate) revenueQuery = revenueQuery.gte('revenue_date', startDate);
    if (endDate) revenueQuery = revenueQuery.lte('revenue_date', endDate);
    if (projectId) revenueQuery = revenueQuery.eq('project_id', projectId);

    const { data: revenues, error: revenueError } = await revenueQuery;
    if (revenueError) throw revenueError;

    // 経費データ取得
    let expenseQuery = supabase
      .from('expenses')
      .select('amount, tax_amount, expense_date')
      .eq('user_id', user.id)
      .eq('is_deleted', false);

    if (startDate) expenseQuery = expenseQuery.gte('expense_date', startDate);
    if (endDate) expenseQuery = expenseQuery.lte('expense_date', endDate);
    if (projectId) expenseQuery = expenseQuery.eq('project_id', projectId);

    const { data: expenses, error: expenseError } = await expenseQuery;
    if (expenseError) throw expenseError;

    // 合計計算
    const totalRevenue = revenues.reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const grossProfit = totalRevenue - totalExpense;
    const grossProfitRate = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // 月次集計
    const monthlyData: Record<
      string,
      { revenue: number; expense: number; gross_profit: number }
    > = {};

    revenues.forEach((r) => {
      const month = r.revenue_date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expense: 0, gross_profit: 0 };
      }
      monthlyData[month].revenue += r.amount || 0;
    });

    expenses.forEach((e) => {
      const month = e.expense_date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expense: 0, gross_profit: 0 };
      }
      monthlyData[month].expense += e.amount || 0;
    });

    // 各月の粗利を計算
    Object.keys(monthlyData).forEach((month) => {
      monthlyData[month].gross_profit =
        monthlyData[month].revenue - monthlyData[month].expense;
    });

    // 目標データ取得（期間内の目標を取得）
    let targetQuery = supabase
      .from('revenue_targets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_deleted', false);

    if (projectId) targetQuery = targetQuery.eq('project_id', projectId);
    if (startDate && endDate) {
      // 指定期間と重複する目標を取得
      targetQuery = targetQuery
        .lte('start_date', endDate)
        .gte('end_date', startDate);
    } else if (startDate) {
      targetQuery = targetQuery.gte('end_date', startDate);
    } else if (endDate) {
      targetQuery = targetQuery.lte('start_date', endDate);
    }

    const { data: targets, error: targetError } = await targetQuery.order(
      'start_date',
      { ascending: false }
    );
    if (targetError) throw targetError;

    // 目標データの整形（最新の目標を使用）
    const targetInfo = targets && targets.length > 0
      ? {
          target_amount: targets[0].target_amount,
          achievement_rate: targets[0].target_amount > 0
            ? (totalRevenue / targets[0].target_amount) * 100
            : 0,
          remaining: Math.max(0, targets[0].target_amount - totalRevenue),
          target_period: {
            start_date: targets[0].start_date,
            end_date: targets[0].end_date,
            title: targets[0].title,
          },
        }
      : null;

    // レスポンス
    return NextResponse.json({
      data: {
        summary: {
          total_revenue: totalRevenue,
          total_expense: totalExpense,
          gross_profit: grossProfit,
          gross_profit_rate: Math.round(grossProfitRate * 10) / 10, // 小数点第1位まで
        },
        target: targetInfo,
        monthly: monthlyData,
      },
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
