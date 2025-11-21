export type Role = 'system' | 'user' | 'assistant' | 'function' | 'tool';

export interface Message {
    role: Role;
    content: string;
    name?: string;
    tool_call_id?: string;
}

export type LLMProvider = 'openai' | 'gemini' | 'claude';

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

// --- Agent Manager Types ---

export type LayoutMode = 'single' | 'split-2' | 'split-3' | 'split-4';

export interface Subtask {
    id: string;
    description: string;
    appId: string;              // 'projects', 'calendar', 'revenue', 'settings'
    estimatedComplexity: 'low' | 'medium' | 'high';
    dependencies: string[];     // IDs of tasks this task depends on
}

export interface ToolDefinition {
    name: string;
    description: string;
    parameters: any;
    meta?: {
        appId?: string;
        preferredScreenId?: number;
        uiHint?: string;
    };
}

export interface Assignment {
    screenId: number;           // 1, 2, 3, 4
    subtask: Subtask;
    appId: string;
    suggestedWorker: LLMProvider;
    tools: ToolDefinition[];
}

export interface AgentManagerDecision {
    layout: LayoutMode;
    assignments: Assignment[];
    strategy: 'parallel' | 'sequential';
}
