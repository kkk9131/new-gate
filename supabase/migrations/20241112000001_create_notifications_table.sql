-- 通知テーブルの作成
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('project_update', 'revenue_alert', 'system', 'plugin_update', 'agent_complete', 'mention', 'reminder')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  color TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- colorカラムが存在しない場合は追加（既存テーブル対応）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'notifications'
    AND column_name = 'color'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN color TEXT;
  END IF;
END $$;

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);

-- RLSポリシーの有効化
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ポリシー: ユーザーは自分の通知のみ閲覧可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'notifications'
    AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications"
      ON public.notifications
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ポリシー: ユーザーは自分の通知を更新可能（既読フラグなど）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'notifications'
    AND policyname = 'Users can update their own notifications'
  ) THEN
    CREATE POLICY "Users can update their own notifications"
      ON public.notifications
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ポリシー: ユーザーは自分の通知を削除可能
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'notifications'
    AND policyname = 'Users can delete their own notifications'
  ) THEN
    CREATE POLICY "Users can delete their own notifications"
      ON public.notifications
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ポリシー: システムは全ユーザーの通知を作成可能（サービスロールのみ）
-- 注: この操作はサーバーサイドからのみ実行されます
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'notifications'
    AND policyname = 'Service role can insert notifications'
  ) THEN
    CREATE POLICY "Service role can insert notifications"
      ON public.notifications
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- updated_atの自動更新トリガー
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- コメント
COMMENT ON TABLE public.notifications IS 'ユーザー通知テーブル';
COMMENT ON COLUMN public.notifications.type IS '通知タイプ: project_update, revenue_alert, system, plugin_update, agent_complete, mention, reminder';
COMMENT ON COLUMN public.notifications.title IS '通知タイトル';
COMMENT ON COLUMN public.notifications.message IS '通知メッセージ本文';
COMMENT ON COLUMN public.notifications.link_url IS '通知に関連するURLへのリンク（オプション）';
COMMENT ON COLUMN public.notifications.read IS '既読フラグ';
COMMENT ON COLUMN public.notifications.color IS '通知の色（UIでの表示用）';
COMMENT ON COLUMN public.notifications.project_id IS '関連するプロジェクトID（オプション）';
