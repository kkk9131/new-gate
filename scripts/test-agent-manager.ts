import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { agentManager } from '../lib/agent/manager';

async function testAgentManager() {
    console.log('=== Agent Manager Test ===\n');

    const testCases = [
        "新規プロジェクトを作成",
        "プロジェクト作成とカレンダー登録",
        "プロジェクト作成、カレンダー登録、売上目標設定"
    ];

    for (const testCase of testCases) {
        console.log(`\n[Test] ${testCase}`);
        console.log('-'.repeat(50));

        try {
            const decision = await agentManager.plan(testCase);
            console.log('Decision:', JSON.stringify(decision, null, 2));
        } catch (e: any) {
            console.error('Error:', e.message);
        }
    }
}

testAgentManager();
