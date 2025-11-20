import { NextRequest, NextResponse } from 'next/server';
import { router } from '@/lib/llm/router';
import { Message, LLMProvider } from '@/lib/llm/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { messages, provider = 'openai', model, apiKey } = body as {
            messages: Message[],
            provider: LLMProvider,
            model?: string,
            apiKey?: string
        };

        const worker = router.getWorker(provider, apiKey);

        const stream = worker.stream(messages, undefined, { model });

        const encoder = new TextEncoder();

        const readable = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of stream) {
                        if (chunk.content) {
                            controller.enqueue(encoder.encode(chunk.content));
                        }
                    }
                    controller.close();
                } catch (error) {
                    controller.error(error);
                }
            },
        });

        return new NextResponse(readable, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
            },
        });

    } catch (error: any) {
        console.error('Agent Chat API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
