-- プロジェクトテーブルにorder（並び順）カラムを追加
-- ドラッグ&ドロップ機能で使用

-- トランザクション開始
BEGIN;

-- 1. display_order カラムを追加（デフォルト値: 0）
ALTER TABLE projects ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- 2. 既存データにorder値を設定（created_atの降順で連番）
WITH ordered_projects AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) - 1 AS order_num
  FROM projects
  WHERE is_deleted = FALSE
)
UPDATE projects
SET display_order = ordered_projects.order_num
FROM ordered_projects
WHERE projects.id = ordered_projects.id;

-- 3. インデックスを追加（user_idとdisplay_orderの複合インデックス）
CREATE INDEX IF NOT EXISTS idx_projects_user_display_order
  ON projects(user_id, display_order)
  WHERE is_deleted = FALSE;

-- 4. コメント追加
COMMENT ON COLUMN projects.display_order IS 'プロジェクト表示順序（ドラッグ&ドロップ用）';

-- トランザクションコミット
COMMIT;
