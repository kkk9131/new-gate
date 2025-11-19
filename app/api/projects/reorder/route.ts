import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuthForAPI } from '@/lib/auth/session';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

/**
 * プロジェクト並び順更新のバリデーションスキーマ
 */
const reorderSchema = z.object({
  projectIds: z.array(z.string().uuid()).min(1, 'プロジェクトIDは1つ以上必要です'),
});

/**
 * PATCH /api/projects/reorder
 * プロジェクトの並び順を一括更新
 *
 * リクエストボディ:
 * {
 *   projectIds: string[] // 新しい順序のプロジェクトID配列
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    // 認証チェック
    const user = await requireAuthForAPI();

    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // リクエストボディ取得
    const body = await request.json();

    // バリデーション
    const { projectIds } = reorderSchema.parse(body);

    const supabase = await createClient();

    // 各プロジェクトのdisplay_orderを更新
    const updates = projectIds.map((id, index) => ({
      id,
      display_order: index,
    }));

    // トランザクション的に一括更新（Promise.all使用）
    const updatePromises = updates.map(({ id, display_order }) =>
      supabase
        .from('projects')
        .update({ display_order })
        .eq('id', id)
        .eq('user_id', user.id) // 自分のプロジェクトのみ更新
        .eq('is_deleted', false)
    );

    const results = await Promise.all(updatePromises);

    // エラーチェック
    const errors = results.filter((result) => result.error);
    if (errors.length > 0) {
      throw errors[0].error;
    }

    return NextResponse.json({
      message: '並び順を更新しました',
      updated: projectIds.length,
    });
  } catch (error) {
    return handleAPIError(error);
  }
}
