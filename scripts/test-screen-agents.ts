import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { serverHybridOrchestrator } from '../lib/agent/server/server-orchestrator';
import { AgentAction } from '../lib/agent/server/types';

async function testServerAgent() {
    console.log('=== Server Agent Test ===\n');

    const apiKeys = {
        'openai': process.env.OPENAI_API_KEY || '',
        'claude': process.env.ANTHROPIC_API_KEY || '',
        'gemini': process.env.GOOGLE_GENERATIVE_AI_API_KEY || ''
    };

    if (!apiKeys['openai']) {
        console.warn('⚠️  WARNING: OPENAI_API_KEY is missing.');
    }

    const testCase = "新規プロジェクト「サーバー移行」を作成して";
    console.log(`Request: ${testCase}\n`);

    const dispatch = (action: AgentAction) => {
        console.log(`[Dispatch] Type: ${action.type}, Payload:`, JSON.stringify(action.payload));
    };

    try {
        const result = await serverHybridOrchestrator.execute(testCase, apiKeys, dispatch);
        console.log('\n✅ Execution Result:');
        console.log(result);
    } catch (e: any) {
        console.error('\n❌ Error:', e.message);
    }
}

testServerAgent();
