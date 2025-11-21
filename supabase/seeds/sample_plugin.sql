-- Insert Sample Plugin
INSERT INTO store_plugins (
    plugin_id,
    name,
    description,
    author_name,
    category,
    latest_version,
    is_published,
    tools_definition
) VALUES (
    'com.example.todo',
    'Advanced Todo List',
    'A powerful todo list plugin with AI capabilities.',
    'Demo Developer',
    'Productivity',
    '1.0.0',
    true,
    '[
        {
            "name": "add_todo",
            "description": "Add a new todo item",
            "parameters": {
                "type": "object",
                "properties": {
                    "task": { "type": "string", "description": "The task description" },
                    "priority": { "type": "string", "enum": ["high", "medium", "low"] }
                },
                "required": ["task"]
            },
            "meta": { "appId": "com.example.todo", "uiHint": "Add to todo list" }
        },
        {
            "name": "get_todos",
            "description": "Get all todo items",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": { "type": "string", "enum": ["pending", "completed"] }
                }
            },
            "meta": { "appId": "com.example.todo" }
        }
    ]'::jsonb
) ON CONFLICT (plugin_id) DO UPDATE SET
    tools_definition = EXCLUDED.tools_definition,
    is_published = true;
