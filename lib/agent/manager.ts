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
import { loadTools } from './tool-loader';

export class AgentManager {
    private plannerProvider: LLMProvider = 'openai';

    /**
   * ユーザーリクエストを分析し、実行計画を立てる
   */
    /**
   * ユーザーリクエストを分析し、実行計画を立てる
   */
    async plan(userRequest: string, apiKey?: string, userId?: string): Promise<AgentManagerDecision> {
        console.log('[AgentManager] Planning for:', userRequest);

        // 0. @app 指定を抽出
        const { cleanedRequest, preferredApp } = this.extractPreferredApp(userRequest);
        const inferredApp = preferredApp ?? this.inferAppFromText(cleanedRequest);
        const forceSingleApp = Boolean(inferredApp);

        // 1. タスク分解（可能な限り少なく）
        const subtasks = forceSingleApp
            ? [{
                id: '1',
                description: cleanedRequest,
                appId: inferredApp!,
                estimatedComplexity: 'low' as const,
                dependencies: []
            }]
            : await this.decomposeTask(cleanedRequest, apiKey, preferredApp); // preferredAppを渡す
        console.log('[AgentManager] Decomposed subtasks:', subtasks);

        if (subtasks.length === 0) {
            throw new Error('Failed to decompose task');
        }

        // 2. 各タスクのツールを取得し、スクリーン割当を計算
        let assignments = await Promise.all(subtasks.map(async (task, index) => {
            const tools = await this.getToolsForApp(task.appId, userId);
            return {
                screenId: this.resolveScreenId(tools, index),
                subtask: task,
                appId: task.appId,
                suggestedWorker: this.selectWorker(task),
                tools
            };
        }));

        // 単一アプリにまたがらない場合は1画面に統合
        const distinctApps = Array.from(new Set(assignments.map(a => a.appId)));
        if (distinctApps.length === 1 && assignments.length > 1) {
            assignments = [{
                screenId: assignments[0].screenId,
                subtask: {
                    id: '1',
                    description: cleanedRequest,
                    appId: distinctApps[0],
                    estimatedComplexity: 'low' as const,
                    dependencies: []
                },
                appId: distinctApps[0],
                suggestedWorker: 'openai',
                tools: assignments[0].tools
            }];
        }

        // 3. レイアウト決定（preferredScreenId を考慮）
        const maxPreferred = Math.max(
            assignments.length,
            ...assignments.map((a) => a.screenId)
        );
        const layout = this.determineLayout(assignments.length, maxPreferred);
        console.log('[AgentManager] Layout:', layout);

        // 4. 実行戦略決定
        const strategy = this.determineStrategy(subtasks);
        console.log('[AgentManager] Strategy:', strategy);

        return { layout, assignments, strategy };
    }

    /**
     * タスク分解ロジック
     */
    private async decomposeTask(request: string, apiKey?: string, preferredApp?: string): Promise<Subtask[]> {
        const worker = router.getWorker(this.plannerProvider, apiKey);

        const prompt = `
あなたは「Router/Planner」役です。ユーザー依頼を最小数のサブタスクに分解し、各タスクを単一アプリで完結させてください。以下の原則に従います。

【利用可能なアプリ】
- projects: プロジェクト管理
- calendar: カレンダー管理
- revenue: 売上管理
${preferredApp ? `\n【優先アプリ】\n- ${preferredApp}\n` : ''}

【指示のベストプラクティス】
- 既存リソース活用: 依頼に関連しそうな既存プロジェクト/予定/売上を優先利用し、無ければ新規作成か確認手順を明示。
- タスク細分化: 不要な分割は避けつつ、必要なら依存関係を明示して分割（最小ステップで完了させる）。
- 明確なアクション: 各サブタスクは「何を・どのアプリで・どの操作で」行うかを一文で示す。
- エッジケース: 情報不足が予想される場合、description に仮置き値や確認手順を書く（例: 日付未指定→今日、数値不明→0 など）。

【ユーザーリクエスト】
"${request}"

【出力形式】
JSON だけで返してください:
{
  "subtasks": [
    {
      "id": "1",
      "description": "タスクの説明（明確なアクションと前提を含む）",
      "appId": "projects",
      "estimatedComplexity": "low",
      "dependencies": []
    }
  ]
}

【制約】
- 各サブタスクは単一アプリで完結すること。
- dependencies には先行タスクの id のみを列挙する。
- estimatedComplexity は low/medium/high のいずれか。
- 依頼全体が単一アプリで済む場合は subtasks を 1 件にする。
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
                estimatedComplexity: 'medium' as const,
                dependencies: []
            }];
        }
    }

    /**
     * レイアウト決定ロジック
     */
    private determineLayout(taskCount: number, maxScreenId?: number): LayoutMode {
        const n = Math.max(taskCount, maxScreenId ?? 0);
        if (n <= 1) return 'single';
        if (n === 2) return 'split-2';
        if (n === 3) return 'split-3';
        return 'split-4';
    }

    /**
     * Worker選択ロジック
     */
    private selectWorker(task: Subtask): LLMProvider {
        // ツール実行互換性と安定性を優先して OpenAI に固定
        return 'openai';
    }

    /**
     * 実行戦略決定
     */
    private determineStrategy(subtasks: Subtask[]): 'parallel' | 'sequential' {
        // 戦略決定は Runner 側で最終決定するため、ここではデフォルトを返す
        return subtasks.some(task => task.dependencies.length > 0) ? 'sequential' : 'parallel';
    }

    /**
     * アプリごとの利用可能ツールを取得
     */
    private async getToolsForApp(appId: string, userId?: string): Promise<ToolDefinition[]> {
        return loadTools({ appId, userId, includeSamples: true });
    }

    /**
     * screenId を決定する（ツールの meta.preferredScreenId を優先）
     */
    private resolveScreenId(tools: ToolDefinition[], index: number): number {
        const preferred = tools.find(t => t.meta?.preferredScreenId)?.meta?.preferredScreenId;
        return preferred ?? (index + 1);
    }

    /**
     * 短い依頼からアプリを推定
     */
    private inferAppFromText(text: string): string | undefined {
        const t = text.toLowerCase();
        if (t.includes('プロジェクト') || t.includes('project')) return 'projects';
        if (t.includes('カレンダー') || t.includes('calendar') || t.includes('予定')) return 'calendar';
        if (t.includes('売上') || t.includes('revenue')) return 'revenue';
        // settings removed
        return undefined;
    }

    /**
     * @appId をパースし、リクエストから除去
     */
    private extractPreferredApp(text: string): { cleanedRequest: string; preferredApp?: string } {
        const appIds = ['projects', 'calendar', 'revenue'];
        const match = text.match(/@([a-zA-Z]+)/);
        if (match && appIds.includes(match[1])) {
            const cleaned = text.replace(`@${match[1]}`, '').trim();
            return { cleanedRequest: cleaned, preferredApp: match[1] };
        }
        return { cleanedRequest: text };
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
