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

    async execute(apiKey?: string): Promise<string> {
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
`;

        this.history.push({ role: 'system', content: systemPrompt });
        this.history.push({ role: 'user', content: 'Please start the task.' });

        try {
            this.uiController.updateStatus(screenId, 'thinking', 10);

            // 4. Execute LLM
            const response = await worker.generate(this.history, tools, {
                temperature: 0.7
            });

            const content = response.content;
            this.history.push({ role: 'assistant', content });

            console.log(`[ServerScreenAgent-${screenId}] Response:`, content);

            // 5. Simulate Tool Execution
            // In a real implementation, we would parse tool calls and execute them against the DB/API
            if (content.includes('create_project') || content.includes('create_event')) {
                this.uiController.updateStatus(screenId, 'executing', 50);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation delay
            }

            this.uiController.updateStatus(screenId, 'completed', 100);
            return content;

        } catch (error: any) {
            console.error(`[ServerScreenAgent-${screenId}] Error:`, error);
            this.uiController.updateStatus(screenId, 'error');
            throw error;
        }
    }
}
