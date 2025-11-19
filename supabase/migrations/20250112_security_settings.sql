-- セキュリティ設定マイグレーション

-- ========================================
-- 1. user_sessionsテーブル作成
-- ========================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_name TEXT,
  browser_name TEXT,
  ip_address INET,
  country TEXT,
  city TEXT,
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS user_sessions_expires_at_idx ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS user_sessions_session_token_idx ON user_sessions(session_token);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own sessions" ON user_sessions;
CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sessions" ON user_sessions;
CREATE POLICY "Users can delete their own sessions"
  ON user_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON user_sessions;
CREATE POLICY "Users can insert their own sessions"
  ON user_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sessions" ON user_sessions;
CREATE POLICY "Users can update their own sessions"
  ON user_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

COMMENT ON TABLE user_sessions IS 'User active sessions';
COMMENT ON COLUMN user_sessions.device_name IS 'Device name';
COMMENT ON COLUMN user_sessions.browser_name IS 'Browser name';
COMMENT ON COLUMN user_sessions.is_current IS 'Is current session';

-- ========================================
-- 2. login_historyテーブル作成
-- ========================================
CREATE TABLE IF NOT EXISTS login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  country TEXT,
  city TEXT,
  device_name TEXT,
  browser_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS login_history_user_id_idx ON login_history(user_id);
CREATE INDEX IF NOT EXISTS login_history_login_at_idx ON login_history(login_at);
CREATE INDEX IF NOT EXISTS login_history_status_idx ON login_history(status);

ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own login history" ON login_history;
CREATE POLICY "Users can view their own login history"
  ON login_history
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert login history" ON login_history;
CREATE POLICY "Service role can insert login history"
  ON login_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

COMMENT ON TABLE login_history IS 'User login history';
COMMENT ON COLUMN login_history.status IS 'Login status: success or failed';
COMMENT ON COLUMN login_history.failure_reason IS 'Login failure reason';

-- ========================================
-- 3. user_settingsテーブルにsession_timeout_minutes追加
-- ========================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_settings') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_settings'
      AND column_name = 'session_timeout_minutes'
    ) THEN
      ALTER TABLE user_settings
      ADD COLUMN session_timeout_minutes INTEGER DEFAULT 60;

      COMMENT ON COLUMN user_settings.session_timeout_minutes IS 'Session timeout in minutes';
    END IF;
  END IF;
END $$;

-- ========================================
-- 4. 期限切れセッションを自動削除する関数
-- ========================================
CREATE OR REPLACE FUNCTION delete_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION delete_expired_sessions IS 'Delete expired sessions';
