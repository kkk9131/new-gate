import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/session';
import { handleAPIError } from '@/lib/utils/api-error';

/**
 * POST /api/projects/[id]/duplicate
 * プロジェクト複製
 *
 * 既存プロジェクトのデータをコピーして新規プロジェクトを作成
 * プロジェクト名には「（コピー）」が付与される
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const user = await requireAuth();

    // パラメータ取得
    const { id } = await params;

    const supabase = await createClient();

    // 元のプロジェクトを取得
    const { data: originalProject, error: fetchError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single();

    if (fetchError) throw fetchError;

    if (!originalProject) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: 'プロジェクトが見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // 新規プロジェクトデータを作成（id, created_at, updated_atを除外）
    const { id: _, created_at, updated_at, ...projectData } = originalProject;

    // 名前に「（コピー）」を追加
    const duplicatedProject = {
      ...projectData,
      name: `${originalProject.name}（コピー）`,
      // ステータスは進行中に設定
      status: 'active' as const,
    };

    // 新規プロジェクトを挿入
    const { data: newProject, error: insertError } = await supabase
      .from('projects')
      .insert(duplicatedProject)
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ data: newProject }, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
