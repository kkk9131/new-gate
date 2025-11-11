import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuthForAPI } from '@/lib/auth/session';
import { handleAPIError } from '@/lib/utils/api-error';
import { z } from 'zod';

// バリデーションスキーマ（更新用）
const updateEventSchema = z.object({
  project_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1, 'タイトルは必須です').max(255).optional(),
  description: z.string().optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  start_time: z.string().datetime({ message: 'ISO 8601形式の日時が必要です' }).optional(),
  end_time: z.string().datetime({ message: 'ISO 8601形式の日時が必要です' }).optional(),
  all_day: z.boolean().optional(),
  timezone: z.string().optional(),
  category: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'HEX形式のカラーコードが必要です').optional(),
  // 繰り返し設定（オプション）
  recurrence: z.object({
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    interval: z.number().int().positive().default(1),
    count: z.number().int().positive().optional(),
    until_date: z.string().datetime().optional(),
    by_day: z.array(z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])).optional(),
    by_month_day: z.array(z.number().int().min(-31).max(31).refine(n => n !== 0)).optional(),
  }).optional().nullable(),
  // リマインダー設定（オプション）
  reminders: z.array(z.object({
    reminder_type: z.enum(['notification', 'email']).default('notification'),
    minutes_before: z.number().int().min(0).default(15),
  })).optional().nullable(),
});

/**
 * GET /api/events/[id]
 * 単一イベント取得
 *
 * 繰り返しルール、リマインダー、プロジェクト情報を含む完全なイベントデータを返します
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

    const { id } = await params;

    // イベント取得（繰り返し・リマインダー含む）
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        projects(name),
        recurrence:event_recurrence(*),
        reminders:event_reminders(*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'イベントが見つかりません' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * PATCH /api/events/[id]
 * イベント更新
 *
 * リクエストボディ:
 * {
 *   project_id?: string,
 *   title?: string,
 *   description?: string,
 *   location?: string,
 *   start_time?: string (ISO 8601),
 *   end_time?: string (ISO 8601),
 *   all_day?: boolean,
 *   timezone?: string,
 *   category?: string,
 *   tags?: string[],
 *   color?: string,
 *   recurrence?: { ... },
 *   reminders?: [ { ... } ]
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

    const { id } = await params;

    // リクエストボディ取得
    const body = await request.json();

    // バリデーション
    const validated = updateEventSchema.parse(body);

    // 時間整合性チェック（両方が指定されている場合のみ）
    if (validated.start_time && validated.end_time) {
      if (new Date(validated.end_time) < new Date(validated.start_time)) {
        return NextResponse.json(
          { error: '終了時刻は開始時刻より後である必要があります' },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    // イベントの存在確認と権限チェック
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'イベントが見つかりません' }, { status: 404 });
      }
      throw fetchError;
    }

    // イベント本体の更新（繰り返し・リマインダーは分離）
    const { recurrence, reminders, ...eventData } = validated;

    // イベント本体を更新
    const { error: eventError } = await supabase
      .from('events')
      .update(eventData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (eventError) throw eventError;

    // 繰り返しルール更新（指定がある場合）
    if (recurrence !== undefined) {
      if (recurrence === null) {
        // 繰り返しルールを削除
        const { error: deleteRecurrenceError } = await supabase
          .from('event_recurrence')
          .delete()
          .eq('event_id', id);

        if (deleteRecurrenceError) throw deleteRecurrenceError;
      } else {
        // 既存の繰り返しルールがあるかチェック
        const { data: existingRecurrence } = await supabase
          .from('event_recurrence')
          .select('id')
          .eq('event_id', id)
          .single();

        if (existingRecurrence) {
          // 更新
          const { error: updateRecurrenceError } = await supabase
            .from('event_recurrence')
            .update(recurrence)
            .eq('event_id', id);

          if (updateRecurrenceError) throw updateRecurrenceError;
        } else {
          // 新規作成
          const { error: insertRecurrenceError } = await supabase
            .from('event_recurrence')
            .insert({
              event_id: id,
              ...recurrence,
            });

          if (insertRecurrenceError) throw insertRecurrenceError;
        }
      }
    }

    // リマインダー更新（指定がある場合）
    if (reminders !== undefined) {
      // 既存のリマインダーを削除
      const { error: deleteRemindersError } = await supabase
        .from('event_reminders')
        .delete()
        .eq('event_id', id);

      if (deleteRemindersError) throw deleteRemindersError;

      // 新しいリマインダーを作成
      if (reminders && reminders.length > 0) {
        const reminderRecords = reminders.map(reminder => ({
          event_id: id,
          user_id: user.id,
          ...reminder,
        }));

        const { error: insertRemindersError } = await supabase
          .from('event_reminders')
          .insert(reminderRecords);

        if (insertRemindersError) throw insertRemindersError;
      }
    }

    // 完全なデータを再取得
    const { data: updatedEvent, error: fetchUpdatedError } = await supabase
      .from('events')
      .select(`
        *,
        projects(name),
        recurrence:event_recurrence(*),
        reminders:event_reminders(*)
      `)
      .eq('id', id)
      .single();

    if (fetchUpdatedError) throw fetchUpdatedError;

    return NextResponse.json({ data: updatedEvent });
  } catch (error) {
    return handleAPIError(error);
  }
}

/**
 * DELETE /api/events/[id]
 * イベント削除（ソフトデリート）
 *
 * is_deleted フラグをtrueに設定して論理削除します
 * 繰り返しルールとリマインダーは外部キー制約により自動的に削除されます
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

    const { id } = await params;

    const supabase = await createClient();

    // イベントの存在確認と権限チェック
    const { data: existingEvent, error: fetchError } = await supabase
      .from('events')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('is_deleted', false)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'イベントが見つかりません' }, { status: 404 });
      }
      throw fetchError;
    }

    // ソフトデリート
    const { error: deleteError } = await supabase
      .from('events')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ message: 'イベントを削除しました' });
  } catch (error) {
    return handleAPIError(error);
  }
}
