import { NextRequest, NextResponse } from 'next/server';
import { serverHybridOrchestrator } from '@/lib/agent/server/server-orchestrator';
import { AgentAction } from '@/lib/agent/server/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { message, apiKeys } = await req.json();

        if (!message) {
            return new NextResponse('Message is required', { status: 400 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const dispatch = (action: AgentAction) => {
                    const data = JSON.stringify({ type: 'action', action });
                    controller.enqueue(encoder.encode(data + '\n'));
                };

                try {
                    const result = await serverHybridOrchestrator.execute(message, apiKeys || {}, dispatch);

                    // Send final result as a message chunk
                    const finalData = JSON.stringify({ type: 'message', content: result });
                    controller.enqueue(encoder.encode(finalData + '\n'));
                } catch (error: any) {
                    const errorData = JSON.stringify({ type: 'error', error: error.message });
                    controller.enqueue(encoder.encode(errorData + '\n'));
                } finally {
                    controller.close();
                }
            }
        });

        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/x-ndjson',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error: any) {
        console.error('Agent API Error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
