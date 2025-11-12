-- user_settingsテーブルのINSERTポリシーを追加
-- 既存のポリシーを確認して、存在しない場合のみ作成

-- ポリシー: ユーザーは自分の設定を作成可能
DO $$
BEGIN
  -- 既存のINSERTポリシーを削除（存在する場合）
  DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;

  -- 新しいポリシーを作成
  CREATE POLICY "Users can insert their own settings"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'ポリシー作成でエラーが発生しましたが、続行します: %', SQLERRM;
END $$;

-- ポリシー: ユーザーは自分の設定を閲覧可能（既に存在するか確認）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_settings'
    AND policyname = 'Users can view their own settings'
  ) THEN
    CREATE POLICY "Users can view their own settings"
      ON public.user_settings
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ポリシー: ユーザーは自分の設定を更新可能（既に存在するか確認）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'user_settings'
    AND policyname = 'Users can update their own settings'
  ) THEN
    CREATE POLICY "Users can update their own settings"
      ON public.user_settings
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- コメント
COMMENT ON POLICY "Users can insert their own settings" ON public.user_settings IS 'ユーザーは自分の設定レコードを作成できる';
