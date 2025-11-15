import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuthForAPI } from '@/lib/auth/session';
import { handleAPIError } from '@/lib/utils/api-error';
import { createEventSchema } from '@/lib/validators/events';

/**
 * GET /api/events
 * イベント一覧取得
 *
 * クエリパラメータ:
 * - project_id: プロジェクトIDでフィルタ
 * - start_date: 開始日（ISO 8601）
 * - end_date: 終了日（ISO 8601）
 * - category: カテゴリでフィルタ
 * - tags: タグでフィルタ（カンマ区切り）
 * - search: タイトル・説明文検索
 * - limit: 取得件数（デフォルト: 100）
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
    const tagsParam = searchParams.get('tags');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // データ取得（繰り返し・リマインダー含む）
    const supabase = await createClient();
    let query = supabase
      .from('events')
      .select(`
        *,
        projects(name),
        recurrence:event_recurrence(*),
        reminders:event_reminders(*)
      `)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .order('start_time', { ascending: false })
      .range(offset, offset + limit - 1);

    // プロジェクトIDフィルタ
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // 開始日フィルタ
    if (startDate) {
      query = query.gte('start_time', startDate);
    }

    // 終了日フィルタ
    if (endDate) {
      query = query.lte('end_time', endDate);
    }

    // カテゴリフィルタ
    if (category) {
      query = query.eq('category', category);
    }

    // タグフィルタ（配列のいずれかに一致）
    if (tagsParam) {
      const tags = tagsParam.split(',').map(t => t.trim());
      query = query.overlaps('tags', tags);
    }

    // 検索（タイトル・説明文）
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * POST /api/events
 * イベント作成
 *
 * リクエストボディ:
 * {
 *   project_id?: string,
 *   title: string,
 *   description?: string,
 *   location?: string,
 *   start_time: string (ISO 8601),
 *   end_time: string (ISO 8601),
 *   all_day?: boolean,
 *   timezone?: string,
 *   category?: string,
 *   tags?: string[],
 *   color?: string,
 *   recurrence?: { ... },
 *   reminders?: [ { ... } ]
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
    const validated = createEventSchema.parse(body);

    // 時間整合性チェック
    if (new Date(validated.end_time) < new Date(validated.start_time)) {
      return NextResponse.json(
        { error: '終了時刻は開始時刻より後である必要があります' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // イベント作成（繰り返し・リマインダーは分離）
    const { recurrence, reminders, ...eventData } = validated;

    // イベント本体を挿入
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        ...eventData,
        user_id: user.id,
      })
      .select()
      .single();

    if (eventError) throw eventError;

    // 繰り返しルール作成
    if (recurrence) {
      const { error: recurrenceError } = await supabase
        .from('event_recurrence')
        .insert({
          event_id: event.id,
          ...recurrence,
        });

      if (recurrenceError) throw recurrenceError;
    }

    // リマインダー作成
    if (reminders && reminders.length > 0) {
      const reminderRecords = reminders.map(reminder => ({
        event_id: event.id,
        user_id: user.id,
        ...reminder,
      }));

      const { error: remindersError } = await supabase
        .from('event_reminders')
        .insert(reminderRecords);

      if (remindersError) throw remindersError;
    }

    // 完全なデータを再取得
    const { data: completeEvent, error: fetchError } = await supabase
      .from('events')
      .select(`
        *,
        projects(name),
        recurrence:event_recurrence(*),
        reminders:event_reminders(*)
      `)
      .eq('id', event.id)
      .single();

    if (fetchError) throw fetchError;

    return NextResponse.json({ data: completeEvent }, { status: 201 });
  } catch (error) {
    return handleAPIError(error);
  }
}
