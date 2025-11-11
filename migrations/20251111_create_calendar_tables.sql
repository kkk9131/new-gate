-- カレンダーイベントテーブル作成SQL
-- Supabase Dashboard > SQL Editor で実行してください

-- ============================================
-- 1. eventsテーブル（メインイベント情報）
-- ============================================
CREATE TABLE events (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 関連情報
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- イベント基本情報
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),

  -- 日時情報
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN NOT NULL DEFAULT FALSE,
  timezone VARCHAR(50) DEFAULT 'Asia/Tokyo',

  -- カテゴリ・タグ
  category VARCHAR(100),
  tags TEXT[], -- PostgreSQL配列型でタグ保存

  -- 色設定（カレンダー表示用）
  color VARCHAR(7) DEFAULT '#3B82F6', -- HEX color code

  -- メタデータ
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 制約
  CHECK (end_time >= start_time)
);

-- ============================================
-- 2. event_recurrenceテーブル（繰り返しルール）
-- ============================================
CREATE TABLE event_recurrence (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 外部キー
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  -- 繰り返しルール（RRULE形式: RFC 5545準拠）
  frequency VARCHAR(20) NOT NULL, -- DAILY, WEEKLY, MONTHLY, YEARLY
  interval INTEGER NOT NULL DEFAULT 1, -- 間隔（毎日=1, 2日おき=2）
  count INTEGER, -- 繰り返し回数（NULLは無限）
  until_date TIMESTAMPTZ, -- 終了日（NULLは無限）

  -- 曜日指定（週次の場合）
  by_day VARCHAR(2)[], -- ['MO', 'WE', 'FR']等

  -- 月内の日指定（月次の場合）
  by_month_day INTEGER[], -- [1, 15, -1] 等（-1は月末）

  -- 除外日（特定日を繰り返しから除外）
  excluded_dates TIMESTAMPTZ[],

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 制約
  CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY')),
  CHECK (interval > 0),
  CHECK (count IS NULL OR count > 0)
);

-- ============================================
-- 3. event_remindersテーブル（リマインダー設定）
-- ============================================
CREATE TABLE event_reminders (
  -- 主キー
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 外部キー
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- リマインダー設定
  reminder_type VARCHAR(20) NOT NULL DEFAULT 'notification', -- notification, email
  minutes_before INTEGER NOT NULL DEFAULT 15, -- イベント何分前

  -- 実行状態
  is_sent BOOLEAN NOT NULL DEFAULT FALSE,
  sent_at TIMESTAMPTZ,

  -- タイムスタンプ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 制約
  CHECK (reminder_type IN ('notification', 'email')),
  CHECK (minutes_before >= 0)
);

-- ============================================
-- インデックス
-- ============================================

-- eventsテーブル
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_project_id ON events(project_id);
CREATE INDEX idx_events_start_time ON events(start_time DESC);
CREATE INDEX idx_events_end_time ON events(end_time DESC);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_tags ON events USING GIN(tags); -- 配列検索用

-- event_recurrenceテーブル
CREATE INDEX idx_event_recurrence_event_id ON event_recurrence(event_id);

-- event_remindersテーブル
CREATE INDEX idx_event_reminders_event_id ON event_reminders(event_id);
CREATE INDEX idx_event_reminders_user_id ON event_reminders(user_id);
CREATE INDEX idx_event_reminders_is_sent ON event_reminders(is_sent) WHERE is_sent = FALSE;

-- ============================================
-- 更新日時の自動更新トリガー
-- ============================================
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_recurrence_updated_at
  BEFORE UPDATE ON event_recurrence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_reminders_updated_at
  BEFORE UPDATE ON event_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- eventsテーブル
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
  ON events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
  ON events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
  ON events FOR DELETE
  USING (auth.uid() = user_id);

-- event_recurrenceテーブル
ALTER TABLE event_recurrence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view recurrence for their events"
  ON event_recurrence FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_recurrence.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create recurrence for their events"
  ON event_recurrence FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_recurrence.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recurrence for their events"
  ON event_recurrence FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_recurrence.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recurrence for their events"
  ON event_recurrence FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = event_recurrence.event_id
      AND events.user_id = auth.uid()
    )
  );

-- event_remindersテーブル
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminders"
  ON event_reminders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders"
  ON event_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders"
  ON event_reminders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders"
  ON event_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- サンプルデータ（開発用・オプション）
-- ============================================

-- サンプルイベント作成用のコメントアウト例
/*
INSERT INTO events (user_id, title, description, start_time, end_time, category, color, tags)
VALUES (
  auth.uid(),
  'プロジェクトミーティング',
  '月次進捗報告',
  '2025-11-15 10:00:00+09',
  '2025-11-15 11:00:00+09',
  'meeting',
  '#10B981',
  ARRAY['重要', 'プロジェクトA']
);
*/
