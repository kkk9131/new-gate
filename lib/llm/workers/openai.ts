import OpenAI from 'openai';
import { LLMWorker, LLMConfig, LLMResponse, LLMStreamResponse, Message } from '../types';

export class OpenAIWorker implements LLMWorker {
    provider = 'openai' as const;
    private client: OpenAI;

    constructor(apiKey?: string) {
        this.client = new OpenAI({
            apiKey: apiKey || process.env.OPENAI_API_KEY,
        });
    }

    private convertMessages(messages: Message[]): OpenAI.Chat.ChatCompletionMessageParam[] {
        return messages.map((m) => {
            if (m.role === 'system') {
                return { role: 'system', content: m.content };
            }
            if (m.role === 'user') {
                return { role: 'user', content: m.content };
            }
            if (m.role === 'assistant') {
                return { role: 'assistant', content: m.content };
            }
            // Fallback for other roles if necessary, or strict typing
            return { role: 'user', content: m.content };
        });
    }

    async generate(
        messages: Message[],
        tools?: any,
        config?: Partial<LLMConfig>
    ): Promise<LLMResponse> {
        const model = config?.model || 'gpt-4o';

        const response = await this.client.chat.completions.create({
            model,
            messages: this.convertMessages(messages),
            temperature: config?.temperature,
            max_tokens: config?.maxTokens,
            // tools: tools, // TODO: Implement tool conversion if needed
        });

        const choice = response.choices[0];

        return {
            content: choice.message.content || '',
            usage: response.usage ? {
                promptTokens: response.usage.prompt_tokens,
                completionTokens: response.usage.completion_tokens,
                totalTokens: response.usage.total_tokens,
            } : undefined,
        };
    }

    async *stream(
        messages: Message[],
        tools?: any,
        config?: Partial<LLMConfig>
    ): AsyncGenerator<LLMStreamResponse, void, unknown> {
        const model = config?.model || 'gpt-4o';

        const stream = await this.client.chat.completions.create({
            model,
            messages: this.convertMessages(messages),
            temperature: config?.temperature,
            max_tokens: config?.maxTokens,
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || undefined;
            if (content) {
                yield {
                    content,
                    done: false,
                };
            }
        }

        yield { done: true };
    }
}
