import { orchestrator } from '../lib/llm/orchestrator';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testParallel() {
    const complexTask = "Explain the benefits of TypeScript briefly, AND THEN explain the benefits of Rust briefly.";

    console.log(`Testing Parallel Execution with task: "${complexTask}"\n`);

    try {
        const result = await orchestrator.execute(complexTask, 'openai');
        console.log('\nFinal Result:\n', result);
    } catch (e: any) {
        console.error('Orchestrator Error:', e.message);
    }
}

testParallel();
