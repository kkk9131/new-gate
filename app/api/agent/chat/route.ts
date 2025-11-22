import { NextRequest, NextResponse } from 'next/server';
import { runWithAgentsSDK, runWithAgentsSDKStream, prepareSession } from '@/lib/agent/agents-runner';
import { AgentAction } from '@/lib/agent/server/types';
import { createClient } from '@/lib/supabase/server';
import { guardrailFinalOutput } from '@/lib/agent/guardrails';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const encoder = new TextEncoder();
    const url = new URL(req.url);
    const streamMode = url.searchParams.get('stream') === 'true';

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
        let parsed: { message?: string; apiKeys?: Record<string, string>; sessionId?: string };
        try {
            parsed = await req.json();
        } catch (error: any) {
            return sendErrorStream('Invalid JSON request body');
        }

        const { message, apiKeys, sessionId } = parsed;
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

        // ノンストリーミング（従来）
        if (!streamMode) {
            const stream = new ReadableStream({
                async start(controller) {
                    const { session: _session, resolvedSessionId } = await prepareSession(sessionId, userId);
                    if (resolvedSessionId) {
                        controller.enqueue(encoder.encode(JSON.stringify({ type: 'session', sessionId: resolvedSessionId }) + '\n'));
                    }

                    const dispatch = (action: AgentAction) => {
                        const data = JSON.stringify({ type: 'action', action });
                        controller.enqueue(encoder.encode(data + '\n'));
                    };

                    try {
                        const result = await runWithAgentsSDK(message, apiKeys || {}, dispatch, userId, resolvedSessionId);
                        const finalData = JSON.stringify({ type: 'message', content: result, sessionId: resolvedSessionId });
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
        }

        // ストリーミングモード（トークン/イベントを逐次送信）
        const stream = new ReadableStream({
            async start(controller) {
                const { session: _session, resolvedSessionId } = await prepareSession(sessionId, userId);
                if (resolvedSessionId) {
                    controller.enqueue(encoder.encode(JSON.stringify({ type: 'session', sessionId: resolvedSessionId }) + '\n'));
                }

                const dispatch = (action: AgentAction) => {
                    const data = JSON.stringify({ type: 'action', action });
                    controller.enqueue(encoder.encode(data + '\n'));
                };

                try {
                    const streamed = await runWithAgentsSDKStream(message, apiKeys || {}, dispatch, userId, resolvedSessionId);

                    for await (const event of streamed) {
                        if (event.type === 'raw_model_stream_event') {
                            const delta = (event.data as any)?.delta || (event.data as any)?.text || (event.data as any)?.output_text?.delta;
                            if (delta) {
                                controller.enqueue(encoder.encode(JSON.stringify({ type: 'token', content: delta }) + '\n'));
                                continue;
                            }
                        }
                        if (event.type === 'run_item_stream_event') {
                            controller.enqueue(encoder.encode(JSON.stringify({ type: 'item', name: event.name, item: event.item }) + '\n'));
                            continue;
                        }
                        if (event.type === 'agent_updated_stream_event') {
                            controller.enqueue(encoder.encode(JSON.stringify({ type: 'agent', name: event.agent.name }) + '\n'));
                            continue;
                        }
                        // フォールバックで生イベントを送信
                        controller.enqueue(encoder.encode(JSON.stringify({ type: 'event', event }) + '\n'));
                    }

                    await streamed.completed;
                    const finalOutput = streamed.finalOutput;
                    const rawFinal = typeof finalOutput === 'string'
                        ? finalOutput
                        : JSON.stringify(finalOutput, null, 2);
                    const safeFinal = guardrailFinalOutput(rawFinal);
                    controller.enqueue(encoder.encode(JSON.stringify({ type: 'message', content: safeFinal, sessionId: resolvedSessionId }) + '\n'));
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
