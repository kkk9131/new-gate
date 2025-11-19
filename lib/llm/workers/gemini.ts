import { GoogleGenerativeAI, Content } from '@google/generative-ai';
import { LLMWorker, LLMConfig, LLMResponse, LLMStreamResponse, Message } from '../types';

export class GeminiWorker implements LLMWorker {
    provider = 'gemini' as const;
    private client: GoogleGenerativeAI;

    constructor(apiKey?: string) {
        const key = apiKey || process.env.GEMINI_API_KEY;
        if (!key) {
            throw new Error('GEMINI_API_KEY is not set');
        }
        this.client = new GoogleGenerativeAI(key);
    }

    private convertMessages(messages: Message[]): Content[] {
        // Gemini expects history + last message separately usually, but chatSession handles it.
        // Here we convert all to Content format.
        // Note: Gemini roles are 'user' and 'model'. System instructions are separate in config.

        return messages.map((m) => {
            let role = 'user';
            if (m.role === 'assistant') {
                role = 'model';
            }
            // System messages should ideally be passed to model config, but for simple chat history:
            // If it's system, we might need to handle it differently or prepend to first user message.
            // For now, we map system to user for simplicity in history, or filter it out if we use systemInstruction.

            return {
                role,
                parts: [{ text: m.content }],
            };
        });
    }

    async generate(
        messages: Message[],
        tools?: any,
        config?: Partial<LLMConfig>
    ): Promise<LLMResponse> {
        const modelName = config?.model || 'gemini-1.5-pro';

        // Extract system message if present
        const systemMessage = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');

        const model = this.client.getGenerativeModel({
            model: modelName,
            systemInstruction: systemMessage ? systemMessage.content : undefined,
        });

        const chat = model.startChat({
            history: this.convertMessages(chatMessages.slice(0, -1)),
        });

        const lastMessage = chatMessages[chatMessages.length - 1];
        const result = await chat.sendMessage(lastMessage.content);
        const response = result.response;
        const text = response.text();

        return {
            content: text,
            usage: {
                promptTokens: 0, // Gemini doesn't always return usage in simple response object easily without digging
                completionTokens: 0,
                totalTokens: 0,
            },
        };
    }

    async *stream(
        messages: Message[],
        tools?: any,
        config?: Partial<LLMConfig>
    ): AsyncGenerator<LLMStreamResponse, void, unknown> {
        const modelName = config?.model || 'gemini-1.5-pro';

        const systemMessage = messages.find(m => m.role === 'system');
        const chatMessages = messages.filter(m => m.role !== 'system');

        const model = this.client.getGenerativeModel({
            model: modelName,
            systemInstruction: systemMessage ? systemMessage.content : undefined,
        });

        const chat = model.startChat({
            history: this.convertMessages(chatMessages.slice(0, -1)),
        });

        const lastMessage = chatMessages[chatMessages.length - 1];
        const result = await chat.sendMessageStream(lastMessage.content);

        for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
                yield {
                    content: text,
                    done: false,
                };
            }
        }

        yield { done: true };
    }
}
