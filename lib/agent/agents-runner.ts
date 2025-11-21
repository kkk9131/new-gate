import { Agent, Runner, tool } from '@openai/agents';
import { serverHybridOrchestrator } from './server/server-orchestrator';
import { AgentAction } from './server/types';
import { guardrailFinalOutput } from './guardrails';

/**
 * Agents SDK を使ったハイブリッドオーケストレータのラッパー。
 * 既存の ServerHybridOrchestrator を function ツールとして公開し、
 * Runner 経由で呼び出せるようにする。
 */

type RunContext = {
    dispatch?: (action: AgentAction) => void;
    apiKeys?: Record<string, string>;
    userId?: string;
};

// 既存のハイブリッド実行を呼び出す function ツール
const hybridExecTool = tool({
    name: 'run_hybrid_orchestrator',
    description: 'ユーザーリクエストをハイブリッドオーケストレーターで実行し、画面操作と検証を行う',
    parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
            request: { type: 'string', description: 'ユーザーからの自然言語リクエスト' },
            apiKeys: {
                type: 'object',
                additionalProperties: { type: 'string' },
                description: 'プロバイダー別のAPIキー'
            }
        },
        required: ['request']
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async execute(input, context?: { context?: RunContext }) {
        const dispatch = context?.context?.dispatch ?? (() => { /* no-op */ });
        const keysFromContext = context?.context?.apiKeys ?? {};
        const userId = context?.context?.userId;
        const mergedKeys = { ...(input.apiKeys || {}), ...keysFromContext };

        return serverHybridOrchestrator.execute(input.request, mergedKeys, dispatch, userId);
    }
});

// メインエージェント: 実質的にはツール呼び出しのハブ
const hybridAgent = new Agent({
    name: 'HybridOrchestratorAgent',
    instructions: [
        'あなたはユーザーの依頼を既存のハイブリッドオーケストレーターに委譲します。',
        '常に run_hybrid_orchestrator ツールを一度だけ呼び出してください。',
        'ユーザーの追加質問が無い限り、余計な説明を返さずツール結果を返します。',
        '常に日本語で応答してください。'
    ].join('\n'),
    tools: [hybridExecTool],
    model: 'gpt-4.1-mini'
});

// Runner インスタンス（シングルトン）
const runner = new Runner({ model: 'gpt-4.1-mini' });

export async function runWithAgentsSDK(
    userRequest: string,
    apiKeys: Record<string, string>,
    dispatch: (action: AgentAction) => void,
    userId?: string
): Promise<string> {
    // 追加情報をコンテキストで渡す
    const result = await runner.run(hybridAgent, userRequest, {
        context: { dispatch, apiKeys, userId }
    });

    const raw = typeof result.output === 'string'
        ? result.output
        : JSON.stringify(result.output, null, 2);

    // ガードレールで最終出力を検証
    return guardrailFinalOutput(raw);
}

export { runner as agentsRunner, hybridAgent };
