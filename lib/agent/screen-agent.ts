import { router } from '../llm/router';
import { LLMProvider, Message, Subtask, ToolDefinition } from '../llm/types';
import { uiController } from './ui-controller';

export interface ScreenAgentConfig {
    screenId: number;
    subtask: Subtask;
    appId: string;
    workerProvider: LLMProvider;
    tools: ToolDefinition[];
}

export class ScreenSubAgent {
    private config: ScreenAgentConfig;
    private history: Message[] = [];

    constructor(config: ScreenAgentConfig) {
        this.config = config;
    }

    /**
     * エージェントを実行する
     */
    async execute(apiKey?: string): Promise<string> {
        const { screenId, subtask, appId, workerProvider, tools } = this.config;

        console.log(`[ScreenAgent-${screenId}] Starting execution for task: ${subtask.description}`);

        // 1. UI初期化
        uiController.updateStatus(screenId, 'initializing', 0);
        uiController.openApp(screenId, appId);

        // 2. Worker取得
        const worker = router.getWorker(workerProvider, apiKey);

        // 3. システムプロンプト構築
        const systemPrompt = `
あなたは Screen ${screenId} を担当するAIアシスタントです。
担当アプリ: ${appId}
タスク: ${subtask.description}

以下のツールを使用してタスクを遂行してください。
${JSON.stringify(tools, null, 2)}

各ステップで進捗状況を報告してください。
`;

        this.history.push({ role: 'system', content: systemPrompt });
        this.history.push({ role: 'user', content: 'タスクを開始してください。' });

        try {
            uiController.updateStatus(screenId, 'thinking', 10);

            // 4. LLM実行 (簡易実装: 1往復のみ)
            // 実際にはReActループやツール実行ループが必要
            const response = await worker.generate(this.history, tools, {
                temperature: 0.7
            });

            const content = response.content;
            this.history.push({ role: 'assistant', content });

            console.log(`[ScreenAgent-${screenId}] Response:`, content);

            // 5. ツール実行のシミュレーション
            // 実際にはresponse.toolCallsを解析して実行する
            if (content.includes('create_project') || content.includes('create_event')) {
                uiController.updateStatus(screenId, 'executing', 50);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 実行待ちシミュレーション
            }

            uiController.updateStatus(screenId, 'completed', 100);
            return content;

        } catch (error: any) {
            console.error(`[ScreenAgent-${screenId}] Error:`, error);
            uiController.updateStatus(screenId, 'error');
            throw error;
        }
    }
}
