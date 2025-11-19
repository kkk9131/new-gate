-- プロジェクトテーブルのスキーマ更新
-- 予算フィールドを削除し、備考フィールドを追加
-- ステータスに「企画」を追加

-- トランザクション開始（すべての変更をアトミックに実行）
BEGIN;

-- 1. ステータス制約を削除
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- 2. budget と actual_cost カラムを削除
ALTER TABLE projects DROP COLUMN IF EXISTS budget;
ALTER TABLE projects DROP COLUMN IF EXISTS actual_cost;

-- 3. notes (備考) カラムを追加
ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT;

-- 4. 新しいステータス制約を追加（planning, active, completed, on_hold）
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('planning', 'active', 'completed', 'on_hold'));

-- 5. 既存データのステータスを更新（activeのままでOK）
-- 必要に応じて手動で変更してください

-- 6. コメント追加
COMMENT ON COLUMN projects.notes IS '備考・メモ';
COMMENT ON COLUMN projects.status IS 'プロジェクトステータス: planning(企画), active(進行中), completed(完了), on_hold(保留)';

-- トランザクションコミット（すべての変更を確定）
COMMIT;
