import { LLMWorker, LLMProvider } from './types';
import { OpenAIWorker } from './workers/openai';
import { GeminiWorker } from './workers/gemini';

export class LLMRouter {
    private workers: Map<LLMProvider, LLMWorker>;

    constructor() {
        this.workers = new Map();
    }

    getWorker(provider: LLMProvider = 'openai'): LLMWorker {
        if (!this.workers.has(provider)) {
            switch (provider) {
                case 'openai':
                    this.workers.set(provider, new OpenAIWorker());
                    break;
                case 'gemini':
                    this.workers.set(provider, new GeminiWorker());
                    break;
                default:
                    throw new Error(`Unsupported provider: ${provider}`);
            }
        }
        return this.workers.get(provider)!;
    }
}

export const router = new LLMRouter();
