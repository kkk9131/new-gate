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
        const toolMap = new Map<string, ToolDefinition>(tools.map((t) => [t.name, t]));
        let hadError = false;
        const errorMessages: string[] = [];

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

                    // 入力必須チェック
                    const def = toolMap.get(call.name);
                    const required = def?.meta?.requiredInputs ?? (def as any)?.parameters?.required ?? [];
                    const missing = (required as string[]).filter((key) => {
                        const v = (call.arguments || {})[key];
                        return v === undefined || v === null || v === '';
                    });
                    if (missing.length > 0) {
                        const message = { error: `required inputs missing: ${missing.join(', ')}` };
                        hadError = true;
                        errorMessages.push(message.error);
                        this.history.push({
                            role: 'tool',
                            tool_call_id: call.id,
                            name: call.name,
                            content: JSON.stringify(message)
                        });
                        this.uiController.log(screenId, `入力不足: ${missing.join(', ')}`, 'warn');
                        continue;
                    }

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

                        // ツール実行結果が失敗を示す場合はエラー扱い
                        if (result && result.success === false) {
                            hadError = true;
                            const msg = result.message || `tool ${call.name} failed`;
                            errorMessages.push(msg);
                            this.uiController.log(screenId, `エラー: ${msg}`, 'error');
                        }
                    } catch (e: any) {
                        hadError = true;
                        errorMessages.push(e.message);
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

            if (hadError) {
                const summary = errorMessages.join('; ');
                this.uiController.updateStatus(screenId, 'error');
                this.uiController.log(screenId, `未完了: ${summary}`, 'error');
                return JSON.stringify({
                    success: false,
                    message: 'タスクは完了していません。入力不足またはツールエラーが発生しました。',
                    errors: errorMessages,
                    partial: content
                });
            }

            // 完了表示は出さず、idle に戻す
            this.uiController.updateStatus(screenId, 'idle', 0);
            return content;

        } catch (error: any) {
            console.error(`[ServerScreenAgent-${screenId}] Error:`, error);
            this.uiController.updateStatus(screenId, 'error');
            this.uiController.log(screenId, `エラー: ${error.message}`, 'error');
            throw error;
        }
    }
}
