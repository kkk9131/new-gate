import { runWithAgentsSDK } from './agents-runner';
import { AgentAction } from './server/types';

export class HybridOrchestrator {
    /**
     * 互換API: 元の HybridOrchestrator.execute を Agents SDK Runner 経由で実行。
     * UI 連携が不要な場合は dispatch を no-op にする。
     */
    async execute(userRequest: string, apiKeys: Record<string, string> = {}, sessionId?: string): Promise<string> {
        const noop = (_action: AgentAction) => { /* noop */ };
        return runWithAgentsSDK(userRequest, apiKeys, noop, undefined, sessionId);
    }
}

// シングルトンインスタンス
export const hybridOrchestrator = new HybridOrchestrator();
