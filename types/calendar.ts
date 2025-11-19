/**
 * カレンダーイベントの型定義
 */
export interface CalendarEvent {
  id: string;
  project_id: string | null;
  user_id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_time: string; // ISO 8601形式
  end_time: string; // ISO 8601形式
  all_day: boolean;
  timezone: string;
  category: string | null;
  tags: string[] | null;
  color: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // JOIN結果
  projects?: {
    name: string;
  } | null;
  recurrence?: EventRecurrence | null;
  reminders?: EventReminder[];
}

/**
 * イベント繰り返しルールの型定義
 */
export interface EventRecurrence {
  id: string;
  event_id: string;
  frequency: RecurrenceFrequency;
  interval: number;
  count: number | null;
  until_date: string | null;
  by_day: DayOfWeek[] | null;
  by_month_day: number[] | null;
  excluded_dates: string[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * 繰り返し頻度
 */
export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/**
 * 曜日（ISO形式）
 */
export type DayOfWeek = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

/**
 * リマインダーの型定義
 */
export interface EventReminder {
  id: string;
  event_id: string;
  user_id: string;
  reminder_type: ReminderType;
  minutes_before: number;
  is_sent: boolean;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * リマインダータイプ
 */
export type ReminderType = 'notification' | 'email';

/**
 * カレンダービュータイプ
 */
export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

/**
 * イベント作成フォームデータ
 */
export interface EventFormData {
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  project_id?: string;
  category?: string;
  tags?: string[];
  color?: string;
  recurrence?: RecurrenceFormData;
  reminders?: ReminderFormData[];
}

/**
 * 繰り返し設定フォームデータ
 */
export interface RecurrenceFormData {
  frequency: RecurrenceFrequency;
  interval: number;
  count?: number;
  until_date?: string;
  by_day?: DayOfWeek[];
  by_month_day?: number[];
}

/**
 * リマインダー設定フォームデータ
 */
export interface ReminderFormData {
  reminder_type: ReminderType;
  minutes_before: number;
}

/**
 * イベントフィルター条件
 */
export interface EventFilters {
  start_date?: string;
  end_date?: string;
  project_id?: string;
  category?: string;
  tags?: string[];
  search?: string;
}

/**
 * react-big-calendar用のイベント型
 */
export interface BigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: CalendarEvent; // 元のイベントデータ
}

/**
 * カレンダー設定
 */
export interface CalendarSettings {
  default_view: CalendarView;
  week_starts_on: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=日曜, 1=月曜
  time_format: '12h' | '24h';
  timezone: string;
  default_event_duration: number; // 分単位
  default_reminder_minutes: number;
}

/**
 * イベントカテゴリー（プリセット）
 */
export const EVENT_CATEGORIES = [
  { value: 'meeting', label: '会議', color: '#3B82F6' },
  { value: 'task', label: 'タスク', color: '#10B981' },
  { value: 'deadline', label: '締切', color: '#EF4444' },
  { value: 'personal', label: '個人', color: '#8B5CF6' },
  { value: 'holiday', label: '休日', color: '#F59E0B' },
  { value: 'other', label: 'その他', color: '#6B7280' },
] as const;

/**
 * リマインダー時間プリセット
 */
export const REMINDER_PRESETS = [
  { value: 0, label: 'イベント開始時' },
  { value: 5, label: '5分前' },
  { value: 15, label: '15分前' },
  { value: 30, label: '30分前' },
  { value: 60, label: '1時間前' },
  { value: 1440, label: '1日前' },
  { value: 10080, label: '1週間前' },
] as const;
