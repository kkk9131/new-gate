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
        dispatch: (action: AgentAction) => void,
        userId?: string
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
            const decision: AgentManagerDecision = await agentManager.plan(userRequest, resolvedApiKeys['openai'], userId);

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

            const strategy = this.resolveStrategy(decision.assignments);
            if (strategy === 'parallel') {
                results = await this.executeParallel(agents, resolvedApiKeys, userId);
            } else {
                results = await this.executeSequential(agents, resolvedApiKeys, userId);
            }



            // 5. Check Agent Verification
            const verification = await checkAgent.verify(userRequest, results, resolvedApiKeys['openai']);

            // 6. Final Report
            let report = verification.report || '';
            if (!verification.success && verification.issues.length > 0) {
                report += `\n⚠️ 問題:\n${verification.issues.map(i => `- ${i}`).join('\n')}`;
            }
            if (verification.suggestions.length > 0) {
                report += `\n💡 改善提案:\n${verification.suggestions.map(s => `- ${s}`).join('\n')}`;
            }

            // 全ウィンドウクローズ（完了後の後片付け）
            uiController.closeAll();

            return report;

        } catch (error: any) {
            console.error('[ServerHybridOrchestrator] Execution failed:', error);
            return `エラーが発生しました: ${error.message}`;
        }
    }

    private async executeParallel(agents: ServerScreenAgent[], apiKeys: Record<string, string>, userId?: string): Promise<{ screenId: number; appId: string; result: string }[]> {
        console.log('[ServerHybridOrchestrator] Executing in parallel...');
        const results = await Promise.all(agents.map(async agent => {
            const provider = (agent as any).config.workerProvider;
            const result = await agent.execute(apiKeys[provider], userId);
            return {
                screenId: (agent as any).config.screenId,
                appId: (agent as any).config.appId,
                result
            };
        }));
        return results;
    }

    private async executeSequential(agents: ServerScreenAgent[], apiKeys: Record<string, string>, userId?: string): Promise<{ screenId: number; appId: string; result: string }[]> {
        console.log('[ServerHybridOrchestrator] Executing sequentially...');
        const results = [];
        for (const agent of agents) {
            const provider = (agent as any).config.workerProvider;
            const result = await agent.execute(apiKeys[provider], userId);
            results.push({
                screenId: (agent as any).config.screenId,
                appId: (agent as any).config.appId,
                result
            });
        }
        return results;
    }

    /**
     * 戦略決定ロジック（Runner側に近い層で実施）
     * 依存関係がひとつでもあれば順次、それ以外は並列
     */
    private resolveStrategy(assignments: AgentManagerDecision['assignments']): 'parallel' | 'sequential' {
        const hasDependencies = assignments.some(a => a.subtask.dependencies.length > 0);
        return hasDependencies ? 'sequential' : 'parallel';
    }
}

export const serverHybridOrchestrator = new ServerHybridOrchestrator();
