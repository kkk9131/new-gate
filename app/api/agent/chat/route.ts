import { NextRequest, NextResponse } from 'next/server';
import { runWithAgentsSDK } from '@/lib/agent/agents-runner';
import { AgentAction } from '@/lib/agent/server/types';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const encoder = new TextEncoder();

    const isSmallTalk = (text: string) => {
        const t = text.trim();
        const greetings = ['こんにちは', 'こんばんは', 'おはよう', 'hi', 'hello', 'hey', 'やあ', 'ちわ', 'ちわっす'];
        const short = t.length <= 18;
        const isGreeting = greetings.some((g) => t.toLowerCase().includes(g));
        return short && isGreeting;
    };

    const sendErrorStream = (msg: string) => {
        const stream = new ReadableStream({
            start(controller) {
                controller.enqueue(encoder.encode(JSON.stringify({ type: 'error', error: msg }) + '\n'));
                controller.close();
            }
        });
        return new NextResponse(stream, {
            status: 200,
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    };

    try {
        let parsed: { message?: string; apiKeys?: Record<string, string> };
        try {
            parsed = await req.json();
        } catch (error: any) {
            return sendErrorStream('Invalid JSON request body');
        }

        const { message, apiKeys } = parsed;
        if (!message) {
            return sendErrorStream('Message is required');
        }

        // Get authenticated user
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        // カジュアルな挨拶はツールを呼ばずにそのまま返す
        if (isSmallTalk(message)) {
            const stream = new ReadableStream({
                start(controller) {
                    const finalData = JSON.stringify({ type: 'message', content: 'こんにちは！何かお手伝いできることはありますか？' });
                    controller.enqueue(encoder.encode(finalData + '\n'));
                    controller.close();
                }
            });
            return new NextResponse(stream, {
                status: 200,
                headers: {
                    'Content-Type': 'application/x-ndjson',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        const stream = new ReadableStream({
            async start(controller) {
                const dispatch = (action: AgentAction) => {
                    const data = JSON.stringify({ type: 'action', action });
                    controller.enqueue(encoder.encode(data + '\n'));
                };

                try {
                    const result = await runWithAgentsSDK(message, apiKeys || {}, dispatch, userId);
                    const finalData = JSON.stringify({ type: 'message', content: result });
                    controller.enqueue(encoder.encode(finalData + '\n'));
                } catch (error: any) {
                    const errorData = JSON.stringify({ type: 'error', error: error.message || 'Unknown error' });
                    controller.enqueue(encoder.encode(errorData + '\n'));
                } finally {
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            status: 200,
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        console.error('Agent API Error:', error);
        return sendErrorStream(error?.message || 'Internal Server Error');
    }
}
