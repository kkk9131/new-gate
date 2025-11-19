-- モックデータ削除用SQL

-- 依存関係のある順序でデータを削除
DELETE FROM plugin_reviews;
DELETE FROM plugin_installations;
DELETE FROM store_plugins;

-- 必要であればIDのシーケンスなどをリセット（UUIDなので通常は不要）
