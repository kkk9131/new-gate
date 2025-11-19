import { NextRequest, NextResponse } from 'next/server';
import { orchestrator } from '@/lib/llm/orchestrator';
import { LLMProvider } from '@/lib/llm/types';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { task, provider = 'openai' } = body as {
            task: string,
            provider: LLMProvider
        };

        const result = await orchestrator.execute(task, provider);

        return NextResponse.json({ result });

    } catch (error: any) {
        console.error('Agent Task API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
