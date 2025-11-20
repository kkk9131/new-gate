import Anthropic from '@anthropic-ai/sdk';
import { LLMWorker, LLMConfig, LLMResponse, LLMStreamResponse, Message } from '../types';

export class ClaudeWorker implements LLMWorker {
    provider = 'claude' as const;
    private client: Anthropic;

    constructor(apiKey?: string) {
        this.client = new Anthropic({
            apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
        });
    }

    private convertMessages(messages: Message[]): Anthropic.MessageParam[] {
        // Filter out system messages as they are handled separately in Claude
        return messages
            .filter(m => m.role !== 'system')
            .map((m) => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content,
            }));
    }

    private getSystemMessage(messages: Message[]): string | undefined {
        const systemMsg = messages.find(m => m.role === 'system');
        return systemMsg?.content;
    }

    async generate(
        messages: Message[],
        tools?: any,
        config?: Partial<LLMConfig>
    ): Promise<LLMResponse> {
        const model = config?.model || 'claude-3-opus-20240229';
        const system = this.getSystemMessage(messages);

        const response = await this.client.messages.create({
            model,
            max_tokens: config?.maxTokens || 1024,
            messages: this.convertMessages(messages),
            system,
            temperature: config?.temperature,
        });

        const content = response.content[0].type === 'text' ? response.content[0].text : '';

        return {
            content,
            usage: {
                promptTokens: response.usage.input_tokens,
                completionTokens: response.usage.output_tokens,
                totalTokens: response.usage.input_tokens + response.usage.output_tokens,
            },
        };
    }

    async *stream(
        messages: Message[],
        tools?: any,
        config?: Partial<LLMConfig>
    ): AsyncGenerator<LLMStreamResponse, void, unknown> {
        const model = config?.model || 'claude-3-opus-20240229';
        const system = this.getSystemMessage(messages);

        const stream = await this.client.messages.create({
            model,
            max_tokens: config?.maxTokens || 1024,
            messages: this.convertMessages(messages),
            system,
            temperature: config?.temperature,
            stream: true,
        });

        for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                yield {
                    content: chunk.delta.text,
                    done: false,
                };
            }
        }

        yield { done: true };
    }
}
