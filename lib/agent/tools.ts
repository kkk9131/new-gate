import { ToolDefinition } from '../llm/types';

export const TOOLS: Record<string, ToolDefinition[]> = {
    projects: [
        {
            name: 'create_project',
            description: '新しいプロジェクトを作成する',
            parameters: {
                type: 'object',
                properties: {
                    title: { type: 'string', description: 'プロジェクト名' }
                },
                required: ['title'],
                additionalProperties: false
            },
            meta: {
                appId: 'projects',
                preferredScreenId: 1,
                uiHint: '左画面でプロジェクト作成',
                requiredInputs: ['title'],
                sideEffects: ['creates_project'],
                riskLevel: 'low'
            }
        },
        {
            name: 'list_projects',
            description: 'プロジェクト一覧を取得する',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            meta: {
                appId: 'projects',
                preferredScreenId: 1,
                uiHint: '左画面で一覧表示',
                riskLevel: 'low'
            }
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
                    end: { type: 'string', description: '終了日時 (ISO string)' }
                },
                required: ['title', 'start', 'end'],
                additionalProperties: false
            },
            meta: {
                appId: 'calendar',
                preferredScreenId: 2,
                uiHint: '右画面で日付入力',
                requiredInputs: ['title', 'start', 'end'],
                sideEffects: ['creates_event'],
                riskLevel: 'medium'
            }
        },
        {
            name: 'list_events',
            description: 'イベント一覧を取得する',
            parameters: {
                type: 'object',
                properties: {},
                required: [],
                additionalProperties: false
            },
            meta: {
                appId: 'calendar',
                preferredScreenId: 2,
                riskLevel: 'low'
            }
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
                    date: { type: 'string', description: '日付 (ISO string)' }
                },
                required: ['amount', 'date'],
                additionalProperties: false
            },
            meta: {
                appId: 'revenue',
                preferredScreenId: 3,
                requiredInputs: ['amount', 'date'],
                sideEffects: ['creates_revenue_entry'],
                riskLevel: 'medium'
            }
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
                required: ['key', 'value'],
                additionalProperties: false
            },
            meta: {
                appId: 'settings',
                preferredScreenId: 4,
                requiredInputs: ['key', 'value'],
                sideEffects: ['updates_setting'],
                riskLevel: 'medium'
            }
        }
    ]
};

export function getToolsForApp(appId: string): ToolDefinition[] {
    return TOOLS[appId] || [];
}
