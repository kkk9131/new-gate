import { LLMWorker, LLMProvider } from './types';
import { OpenAIWorker } from './workers/openai';
import { GeminiWorker } from './workers/gemini';
import { ClaudeWorker } from './workers/claude';

export class LLMRouter {
    private workers: Map<LLMProvider, LLMWorker>;

    constructor() {
        this.workers = new Map();
    }

    getWorker(provider: LLMProvider = 'openai', apiKey?: string): LLMWorker {
        // If an API key is provided, always create a new worker instance to ensure the key is used
        if (apiKey) {
            switch (provider) {
                case 'openai':
                    return new OpenAIWorker(apiKey);
                case 'gemini':
                    return new GeminiWorker(apiKey);
                case 'claude':
                    return new ClaudeWorker(apiKey);
                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }
        }

        // Fallback to cached singletons (using env vars)
        if (!this.workers.has(provider)) {
            switch (provider) {
                case 'openai':
                    this.workers.set(provider, new OpenAIWorker());
                    break;
                case 'gemini':
                    this.workers.set(provider, new GeminiWorker());
                    break;
                case 'claude':
                    this.workers.set(provider, new ClaudeWorker());
                    break;
                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }
        }
        return this.workers.get(provider)!;
    }
}

export const router = new LLMRouter();
