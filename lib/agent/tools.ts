import { ToolDefinition } from '../llm/types';

export const TOOLS: Record<string, ToolDefinition[]> = {
    projects: [
        {
            name: 'create_project',
            description: '新しいプロジェクトを作成する',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'プロジェクト名' },
                    description: { type: 'string', description: 'プロジェクトの説明' },
                    status: { type: 'string', enum: ['active', 'archived', 'completed'] }
                },
                required: ['title']
            },
            meta: { appId: 'projects', preferredScreenId: 1, uiHint: '左画面でプロジェクト作成' }
        },
        {
            name: 'list_projects',
            description: 'プロジェクト一覧を取得する',
            parameters: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['active', 'archived', 'completed'] }
                }
            },
            meta: { appId: 'projects', preferredScreenId: 1, uiHint: '左画面で一覧表示' }
        }
    ],
    calendar: [
        {
            name: 'create_event',
            description: 'カレンダーにイベントを作成する',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'イベント名' },
                    start: { type: 'string', description: '開始日時 (ISO string)' },
                    end: { type: 'string', description: '終了日時 (ISO string)' },
                    description: { type: 'string', description: '詳細' }
                },
                required: ['title', 'start', 'end']
            },
            meta: { appId: 'calendar', preferredScreenId: 2, uiHint: '右画面で日付入力' }
        },
        {
            name: 'list_events',
            description: 'イベント一覧を取得する',
            parameters: {
                type: 'object',
                properties: {
                    start: { type: 'string', description: '範囲開始日時' },
                    end: { type: 'string', description: '範囲終了日時' }
                }
            },
            meta: { appId: 'calendar', preferredScreenId: 2 }
        }
    ],
    revenue: [
        {
            name: 'create_revenue',
            description: '売上データを登録する',
            parameters: {
                type: 'object',
                properties: {
                    amount: { type: 'number', description: '金額' },
                    date: { type: 'string', description: '日付 (ISO string)' },
                    category: { type: 'string', description: 'カテゴリ' },
                    description: { type: 'string', description: '説明' }
                },
                required: ['amount', 'date']
            },
            meta: { appId: 'revenue', preferredScreenId: 3 }
        }
    ],
    settings: [
        {
            name: 'update_setting',
            description: '設定を更新する',
            parameters: {
                type: 'object',
                properties: {
                    key: { type: 'string', description: '設定キー' },
                    value: { type: 'string', description: '設定値' }
                },
                required: ['key', 'value']
            },
            meta: { appId: 'settings', preferredScreenId: 4 }
        }
    ]
};

export function getToolsForApp(appId: string): ToolDefinition[] {
    return TOOLS[appId] || [];
}
