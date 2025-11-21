import { router } from '../llm/router';
import { LLMProvider, Message } from '../llm/types';
import {
    AgentManagerDecision,
    Subtask,
    Assignment,
    LayoutMode,
    ToolDefinition
} from '../llm/types';
import { getToolsForApp } from './tools';

export class AgentManager {
    private plannerProvider: LLMProvider = 'openai';

    /**
   * ユーザーリクエストを分析し、実行計画を立てる
   */
    async plan(userRequest: string, apiKey?: string): Promise<AgentManagerDecision> {
        console.log('[AgentManager] Planning for:', userRequest);

        // 1. タスク分解
        const subtasks = await this.decomposeTask(userRequest, apiKey);
        console.log('[AgentManager] Decomposed subtasks:', subtasks);

        if (subtasks.length === 0) {
            throw new Error('Failed to decompose task');
        }

        // 2. レイアウト決定
        const layout = this.determineLayout(subtasks.length);
        console.log('[AgentManager] Layout:', layout);

        // 3. 各タスクにWorkerとScreenを割り当て
        const assignments = subtasks.map((task, index) => ({
            screenId: index + 1,
            subtask: task,
            appId: task.appId,
            suggestedWorker: this.selectWorker(task),
            tools: this.getToolsForApp(task.appId)
        }));

        // 4. 実行戦略決定
        const strategy = this.determineStrategy(subtasks);
        console.log('[AgentManager] Strategy:', strategy);

        return { layout, assignments, strategy };
    }

    /**
     * タスク分解ロジック
     */
    private async decomposeTask(request: string, apiKey?: string): Promise<Subtask[]> {
        const worker = router.getWorker(this.plannerProvider, apiKey);

        const prompt = `
あなたはタスク分解の専門家です。
ユーザーリクエストを実行可能なサブタスクに分解してください。

【利用可能なアプリ】
- projects: プロジェクト管理
- calendar: カレンダー管理
- revenue: 売上管理
- settings: 設定管理

【ユーザーリクエスト】
"${request}"

【出力形式】
JSON形式で回答してください:
{
  "subtasks": [
    {
      "id": "1",
      "description": "タスクの説明",
      "appId": "projects",
      "estimatedComplexity": "low",
      "dependencies": []
    }
  ]
}

【注意事項】
- 各タスクは単一のアプリで完結すること
- 依存関係がある場合はdependenciesに先行タスクのIDを指定
- 複雑度は low/medium/high で評価
`;

        const messages: Message[] = [
            { role: 'system', content: 'あなたはタスク分解の専門家です' },
            { role: 'user', content: prompt }
        ];

        try {
            const response = await worker.generate(messages, undefined, {
                temperature: 0,
                model: 'gpt-4o'
            });

            const result = this.parseJSON(response.content);
            return result.subtasks || [];
        } catch (e) {
            console.error('[AgentManager] Failed to decompose task:', e);
            // フォールバック: 単一タスクとして扱う
            return [{
                id: '1',
                description: request,
                appId: 'projects', // デフォルト
                estimatedComplexity: 'medium',
                dependencies: []
            }];
        }
    }

    /**
     * レイアウト決定ロジック
     */
    private determineLayout(taskCount: number): LayoutMode {
        if (taskCount === 1) return 'single';
        if (taskCount === 2) return 'split-2';
        if (taskCount === 3) return 'split-3';
        return 'split-4';
    }

    /**
     * Worker選択ロジック
     */
    private selectWorker(task: Subtask): LLMProvider {
        // 複雑度に応じてWorkerを選択
        switch (task.estimatedComplexity) {
            case 'high':
                return 'openai'; // GPT-4o (Coder)
            case 'medium':
                return 'claude'; // Claude (Analyst)
            case 'low':
            default:
                return 'gemini'; // Gemini Flash (Clerk)
        }
    }

    /**
     * 実行戦略決定
     */
    private determineStrategy(subtasks: Subtask[]): 'parallel' | 'sequential' {
        // 依存関係があればsequential、なければparallel
        const hasDependencies = subtasks.some(task => task.dependencies.length > 0);
        return hasDependencies ? 'sequential' : 'parallel';
    }

    /**
     * アプリごとの利用可能ツールを取得
     */
    private getToolsForApp(appId: string): ToolDefinition[] {
        return getToolsForApp(appId);
    }

    /**
     * JSON解析ヘルパー
     */
    private parseJSON(content: string): any {
        let cleaned = content.trim();

        // マークダウンコードブロックを除去
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        return JSON.parse(cleaned);
    }
}

// シングルトンインスタンス
export const agentManager = new AgentManager();
