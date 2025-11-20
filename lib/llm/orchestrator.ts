import { router } from './router';
import { Message, LLMProvider } from './types';
import { DECOMPOSITION_PROMPT } from './prompts';

interface Subtask {
    id: string;
    description: string;
    tool: string;
}

interface DecompositionResult {
    subtasks: Subtask[];
}

export class AgentOrchestrator {
    private plannerProvider: LLMProvider = 'openai'; // Planner uses a smart model

    async execute(userRequest: string, provider: LLMProvider = 'openai'): Promise<string> {
        // 1. Decompose the task
        const subtasks = await this.decompose(userRequest);
        console.log('Decomposed subtasks:', subtasks);

        if (subtasks.length === 0) {
            return "Could not understand the request.";
        }

        // 2. Execute subtasks in parallel
        const results = await Promise.all(
            subtasks.map(async (task) => {
                return this.executeSubtask(task, provider);
            })
        );

        // 3. Aggregate results (simple concatenation for now, or another LLM pass)
        return this.aggregateResults(userRequest, subtasks, results);
    }

    private async decompose(request: string): Promise<Subtask[]> {
        const worker = router.getWorker(this.plannerProvider);
        const messages: Message[] = [
            { role: 'system', content: DECOMPOSITION_PROMPT },
            { role: 'user', content: request }
        ];

        // Force JSON output if possible (or just parse)
        // Note: In a real app, we'd use response_format: { type: "json_object" } for OpenAI
        const response = await worker.generate(messages, undefined, {
            temperature: 0,
            model: 'gpt-4o' // Use smart model for planning
        });

        try {
            // Naive JSON parsing - assumes the model obeys nicely
            // Clean up markdown code blocks if present
            let content = response.content.trim();
            if (content.startsWith('```json')) {
                content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
            } else if (content.startsWith('```')) {
                content = content.replace(/^```\n/, '').replace(/\n```$/, '');
            }

            const result = JSON.parse(content) as DecompositionResult;
            return result.subtasks || [];
        } catch (e) {
            console.error('Failed to parse decomposition result:', e);
            // Fallback: treat as single task
            return [{ id: '1', description: request, tool: 'llm_chat' }];
        }
    }

    private async executeSubtask(task: Subtask, provider: LLMProvider): Promise<string> {
        console.log(`Executing subtask ${task.id}: ${task.description}`);
        const worker = router.getWorker(provider);
        const messages: Message[] = [
            { role: 'system', content: 'You are a helpful assistant. Execute the following task concisely.' },
            { role: 'user', content: task.description }
        ];

        try {
            const response = await worker.generate(messages);
            return `[Result for "${task.description}"]: ${response.content}`;
        } catch (e: any) {
            return `[Error in "${task.description}"]: ${e.message}`;
        }
    }

    private aggregateResults(originalRequest: string, subtasks: Subtask[], results: string[]): string {
        // For now, just join them. In future, use LLM to synthesize.
        return `Here are the results for your request:\n\n${results.join('\n\n')}`;
    }
}

export const orchestrator = new AgentOrchestrator();
