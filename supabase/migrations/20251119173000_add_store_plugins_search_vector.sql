-- Enhance plugin search capability with a generated tsvector column
ALTER TABLE store_plugins
    ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, ''))
    ) STORED;

CREATE INDEX IF NOT EXISTS idx_store_plugins_search_vector
    ON store_plugins USING GIN (search_vector);
