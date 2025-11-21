import { router } from '../../llm/router';
import { LLMProvider, Message, Subtask, ToolDefinition } from '../../llm/types';
import { ServerUIController } from './types';

export interface ScreenAgentConfig {
    screenId: number;
    subtask: Subtask;
    appId: string;
    workerProvider: LLMProvider;
    tools: ToolDefinition[];
}

export class ServerScreenAgent {
    private config: ScreenAgentConfig;
    private uiController: ServerUIController;
    private history: Message[] = [];

    constructor(config: ScreenAgentConfig, uiController: ServerUIController) {
        this.config = config;
        this.uiController = uiController;
    }

    async execute(apiKey?: string, userId?: string): Promise<string> {
        const { screenId, subtask, appId, workerProvider, tools } = this.config;

        console.log(`[ServerScreenAgent-${screenId}] Starting execution for task: ${subtask.description}`);

        // 1. UI Initialization
        this.uiController.updateStatus(screenId, 'initializing', 0);
        this.uiController.openApp(screenId, appId);

        // 2. Get Worker
        const worker = router.getWorker(workerProvider, apiKey);

        // 3. Build System Prompt
        const systemPrompt = `
You are an AI assistant in charge of Screen ${screenId}.
App: ${appId}
Task: ${subtask.description}

Use the following tools to complete the task.
${JSON.stringify(tools, null, 2)}

Report your progress at each step.
IMPORTANT: Always respond in Japanese.
`;

        this.history.push({ role: 'system', content: systemPrompt });
        this.history.push({ role: 'user', content: 'Please start the task.' });

        try {
            this.uiController.updateStatus(screenId, 'thinking', 10);
            this.uiController.log(screenId, `開始: ${subtask.description}`);

            // 4. Execute LLM
            let response = await worker.generate(this.history, tools, {
                temperature: 0.7
            });

            // Handle Tool Calls
            if (response.toolCalls && response.toolCalls.length > 0) {
                this.uiController.updateStatus(screenId, 'executing', 50);
                this.history.push({ role: 'assistant', content: response.content, toolCalls: response.toolCalls } as any);

                for (const call of response.toolCalls) {
                    this.uiController.log(screenId, `ツール実行: ${call.name}`);
                    try {
                        if (!userId) throw new Error('User ID is required for tool execution');

                        // Import dynamically to avoid circular dependency if any (though unlikely here)
                        const { executeTool } = await import('../tool-executor');
                        const result = await executeTool(call.name, call.arguments, userId, appId);

                        this.history.push({
                            role: 'tool',
                            tool_call_id: call.id,
                            name: call.name,
                            content: JSON.stringify(result)
                        });
                    } catch (e: any) {
                        this.history.push({
                            role: 'tool',
                            tool_call_id: call.id,
                            name: call.name,
                            content: JSON.stringify({ error: e.message })
                        });
                    }
                }

                // Call LLM again with tool results
                this.uiController.updateStatus(screenId, 'thinking', 80);
                response = await worker.generate(this.history, tools, { temperature: 0.7 });
            }

            const content = response.content;
            this.history.push({ role: 'assistant', content });

            console.log(`[ServerScreenAgent-${screenId}] Response:`, content);
            const isJson = content.trim().startsWith('{') || content.trim().startsWith('[');
            if (!isJson) {
                this.uiController.log(screenId, `応答: ${content.substring(0, 120)}...`);
            }

            this.uiController.updateStatus(screenId, 'completed', 100);
            this.uiController.log(screenId, '完了', 'info');
            return content;

        } catch (error: any) {
            console.error(`[ServerScreenAgent-${screenId}] Error:`, error);
            this.uiController.updateStatus(screenId, 'error');
            this.uiController.log(screenId, `エラー: ${error.message}`, 'error');
            throw error;
        }
    }
}
