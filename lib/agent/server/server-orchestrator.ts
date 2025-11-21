import { agentManager } from '../manager';
import { ServerScreenAgent } from './server-screen-agent';
import { ServerUIControllerImpl } from './server-ui-controller';
import { checkAgent } from '../check-agent';
import { AgentManagerDecision, LLMProvider } from '../../llm/types';
import { AgentAction } from './types';

export class ServerHybridOrchestrator {
    /**
     * Execute user request and stream actions/results
     */
    async execute(
        userRequest: string,
        apiKeys: Record<string, string>,
        dispatch: (action: AgentAction) => void
    ): Promise<string> {
        console.log('[ServerHybridOrchestrator] Starting execution for:', userRequest);
        const uiController = new ServerUIControllerImpl(dispatch);

        const resolvedApiKeys: Record<string, string> = { ...apiKeys };

        const envFallbacks: Partial<Record<LLMProvider, string | undefined>> = {
            openai: process.env.OPENAI_API_KEY,
            gemini: process.env.GEMINI_API_KEY,
            claude: process.env.CLAUDE_API_KEY,
        };

        (Object.keys(envFallbacks) as LLMProvider[]).forEach((provider) => {
            if (!resolvedApiKeys[provider] && envFallbacks[provider]) {
                resolvedApiKeys[provider] = envFallbacks[provider] as string;
            }
        });

        if (!resolvedApiKeys.openai) {
            throw new Error('OpenAI APIキーが設定されていません。Settingsアプリで登録するか、ENVにOPENAI_API_KEYを設定してください。');
        }

        try {
            // 1. Agent Manager Planning
            const decision: AgentManagerDecision = await agentManager.plan(userRequest, resolvedApiKeys['openai']);

            // 2. Apply Layout
            const layoutMap: Record<string, 1 | 2 | 3 | 4> = {
                'single': 1,
                'split-2': 2,
                'split-3': 3,
                'split-4': 4
            };
            uiController.setLayout(layoutMap[decision.layout]);

            // 3. Initialize Screen subAgents
            const agents = decision.assignments.map(assignment => {
                const preferredProvider = assignment.suggestedWorker;
                const providerWithKey = resolvedApiKeys[preferredProvider]
                    ? preferredProvider
                    : 'openai';

                if (!resolvedApiKeys[providerWithKey]) {
                    throw new Error(`APIキーが存在しないため、プロバイダー「${preferredProvider}」を利用できません。OPENAI_API_KEYを設定してください。`);
                }

                return new ServerScreenAgent({
                    screenId: assignment.screenId,
                    subtask: assignment.subtask,
                    appId: assignment.appId,
                    workerProvider: providerWithKey,
                    tools: assignment.tools
                }, uiController);
            });

            // 4. Execute Strategy
            let results: { screenId: number; appId: string; result: string }[] = [];

            if (decision.strategy === 'parallel') {
                results = await this.executeParallel(agents, resolvedApiKeys);
            } else {
                results = await this.executeSequential(agents, resolvedApiKeys);
            }

            // 5. Check Agent Verification
            const verification = await checkAgent.verify(userRequest, results, resolvedApiKeys['openai']);

            // 6. Final Report
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
            console.error('[ServerHybridOrchestrator] Execution failed:', error);
            return `エラーが発生しました: ${error.message}`;
        }
    }

    private async executeParallel(agents: ServerScreenAgent[], apiKeys: Record<string, string>): Promise<{ screenId: number; appId: string; result: string }[]> {
        console.log('[ServerHybridOrchestrator] Executing in parallel...');
        const results = await Promise.all(agents.map(async agent => {
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

    private async executeSequential(agents: ServerScreenAgent[], apiKeys: Record<string, string>): Promise<{ screenId: number; appId: string; result: string }[]> {
        console.log('[ServerHybridOrchestrator] Executing sequentially...');
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

export const serverHybridOrchestrator = new ServerHybridOrchestrator();
