-- Add tools_definition column to store_plugins table
ALTER TABLE store_plugins
ADD COLUMN tools_definition JSONB DEFAULT '[]';

-- Comment on column
COMMENT ON COLUMN store_plugins.tools_definition IS 'Definition of tools provided by the plugin (ai-tools.json content)';
