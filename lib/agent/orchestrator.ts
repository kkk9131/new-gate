import { agentManager } from './manager';
import { ScreenSubAgent } from './screen-agent';
import { uiController } from './ui-controller';
import { checkAgent } from './check-agent';
import { AgentManagerDecision } from '../llm/types';

export class HybridOrchestrator {
    /**
     * ユーザーリクエストを実行する
     */
    async execute(userRequest: string, apiKeys: Record<string, string> = {}): Promise<string> {
        console.log('[HybridOrchestrator] Starting execution for:', userRequest);

        try {
            // 1. Agent Managerによる計画策定 (OpenAIキーを使用)
            const decision: AgentManagerDecision = await agentManager.plan(userRequest, apiKeys['openai']);

            // 2. UIレイアウトの適用
            const layoutMap: Record<string, 1 | 2 | 3 | 4> = {
                'single': 1,
                'split-2': 2,
                'split-3': 3,
                'split-4': 4
            };
            uiController.setLayout(layoutMap[decision.layout]);

            // 3. Screen subAgentsの初期化
            const agents = decision.assignments.map(assignment => {
                return new ScreenSubAgent({
                    screenId: assignment.screenId,
                    subtask: assignment.subtask,
                    appId: assignment.appId,
                    workerProvider: assignment.suggestedWorker,
                    tools: assignment.tools
                });
            });

            // 4. 実行戦略に基づく実行
            let results: { screenId: number; appId: string; result: string }[] = [];

            if (decision.strategy === 'parallel') {
                results = await this.executeParallel(agents, apiKeys);
            } else {
                results = await this.executeSequential(agents, apiKeys);
            }

            // 5. Check Agentによる検証 (OpenAIキーを使用)
            const verification = await checkAgent.verify(userRequest, results, apiKeys['openai']);

            // 6. 完了報告
            let report = `タスクが完了しました。\n\n`;
            report += `【実行結果】\n${verification.report}\n\n`;

            if (!verification.success) {
                report += `⚠️ 以下の問題が検出されました:\n${verification.issues.map(i => `- ${i}`).join('\n')}\n\n`;
            }

            if (verification.suggestions.length > 0) {
                report += `💡 改善提案:\n${verification.suggestions.map(s => `- ${s}`).join('\n')}`;
            }

            return report;

        } catch (error: any) {
            console.error('[HybridOrchestrator] Execution failed:', error);
            return `エラーが発生しました: ${error.message}`;
        }
    }

    /**
     * 並列実行
     */
    private async executeParallel(agents: ScreenSubAgent[], apiKeys: Record<string, string>): Promise<{ screenId: number; appId: string; result: string }[]> {
        console.log('[HybridOrchestrator] Executing in parallel...');
        const results = await Promise.all(agents.map(async agent => {
            // 各エージェントに必要なAPIキーを渡す
            const provider = (agent as any).config.workerProvider;
            const result = await agent.execute(apiKeys[provider]);
            return {
                screenId: (agent as any).config.screenId,
                appId: (agent as any).config.appId,
                result
            };
        }));
        return results;
    }

    /**
     * 順次実行
     */
    private async executeSequential(agents: ScreenSubAgent[], apiKeys: Record<string, string>): Promise<{ screenId: number; appId: string; result: string }[]> {
        console.log('[HybridOrchestrator] Executing sequentially...');
        const results = [];
        for (const agent of agents) {
            const provider = (agent as any).config.workerProvider;
            const result = await agent.execute(apiKeys[provider]);
            results.push({
                screenId: (agent as any).config.screenId,
                appId: (agent as any).config.appId,
                result
            });
        }
        return results;
    }
}

// シングルトンインスタンス
export const hybridOrchestrator = new HybridOrchestrator();
