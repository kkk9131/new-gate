ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS ui_language VARCHAR(5) DEFAULT 'ja';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Tokyo';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS date_format VARCHAR(20) DEFAULT 'YYYY/MM/DD';
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS time_format VARCHAR(10) DEFAULT '24h';

COMMENT ON COLUMN user_settings.ui_language IS 'UI language (ja: Japanese, en: English)';
COMMENT ON COLUMN user_settings.timezone IS 'User timezone (e.g. Asia/Tokyo, America/New_York)';
COMMENT ON COLUMN user_settings.date_format IS 'Date format (YYYY/MM/DD, MM/DD/YYYY, DD/MM/YYYY)';
COMMENT ON COLUMN user_settings.time_format IS 'Time format (24h: 24-hour, 12h: 12-hour)';
