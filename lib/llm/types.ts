export type Role = 'system' | 'user' | 'assistant' | 'function' | 'tool';

export interface Message {
    role: Role;
    content: string;
    name?: string;
    tool_call_id?: string;
}

export type LLMProvider = 'openai' | 'gemini' | 'anthropic';

export interface LLMConfig {
    provider: LLMProvider;
    model: string;
    apiKey?: string;
    temperature?: number;
    maxTokens?: number;
}

export interface LLMResponse {
    content: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    toolCalls?: Array<{
        id: string;
        name: string;
        arguments: Record<string, any>;
    }>;
}

export interface LLMStreamResponse {
    content?: string;
    toolCall?: {
        id: string;
        name: string;
        arguments: string; // Partial JSON
    };
    done: boolean;
}

export interface LLMWorker {
    provider: LLMProvider;

    generate(
        messages: Message[],
        tools?: any, // We'll refine this if needed, or use specific provider types internally
        config?: Partial<LLMConfig>
    ): Promise<LLMResponse>;

    stream(
        messages: Message[],
        tools?: any,
        config?: Partial<LLMConfig>
    ): AsyncGenerator<LLMStreamResponse, void, unknown>;
}
