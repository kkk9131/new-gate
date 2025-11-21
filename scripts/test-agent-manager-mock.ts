import { AgentManager } from '../lib/agent/manager';
import { LLMResponse, Message } from '../lib/llm/types';

// モックWorkerを作成
class MockOpenAIWorker {
    provider = 'openai' as const;

    async generate(messages: Message[]): Promise<LLMResponse> {
        // ユーザーリクエストからモックレスポンスを生成
        const userMessage = messages.find(m => m.role === 'user')?.content || '';

        let mockResponse = '';

        if (userMessage.includes('新規プロジェクトを作成')) {
            mockResponse = JSON.stringify({
                subtasks: [
                    {
                        id: '1',
                        description: '新規プロジェクトを作成',
                        appId: 'projects',
                        estimatedComplexity: 'low',
                        dependencies: []
                    }
                ]
            });
        } else if (userMessage.includes('プロジェクト作成とカレンダー登録')) {
            mockResponse = JSON.stringify({
                subtasks: [
                    {
                        id: '1',
                        description: 'プロジェクトを作成',
                        appId: 'projects',
                        estimatedComplexity: 'low',
                        dependencies: []
                    },
                    {
                        id: '2',
                        description: 'カレンダーにイベントを登録',
                        appId: 'calendar',
                        estimatedComplexity: 'low',
                        dependencies: ['1']
                    }
                ]
            });
        } else if (userMessage.includes('プロジェクト作成、カレンダー登録、売上目標設定')) {
            mockResponse = JSON.stringify({
                subtasks: [
                    {
                        id: '1',
                        description: 'プロジェクトを作成',
                        appId: 'projects',
                        estimatedComplexity: 'medium',
                        dependencies: []
                    },
                    {
                        id: '2',
                        description: 'カレンダーにイベントを登録',
                        appId: 'calendar',
                        estimatedComplexity: 'low',
                        dependencies: ['1']
                    },
                    {
                        id: '3',
                        description: '売上目標を設定',
                        appId: 'revenue',
                        estimatedComplexity: 'medium',
                        dependencies: ['1']
                    }
                ]
            });
        }

        return {
            content: mockResponse,
            usage: {
                promptTokens: 100,
                completionTokens: 50,
                totalTokens: 150
            }
        };
    }

    async *stream(): AsyncGenerator<any, void, unknown> {
        yield { done: true };
    }
}

// routerをモック
const mockRouter = {
    getWorker: () => new MockOpenAIWorker()
};

// AgentManagerのrouterをモックに差し替え
const agentManager = new AgentManager();
(agentManager as any).plannerProvider = 'openai';

// テスト実行
async function testAgentManager() {
    console.log('=== Agent Manager Test (Mock Mode) ===\n');

    const testCases = [
        "新規プロジェクトを作成",
        "プロジェクト作成とカレンダー登録",
        "プロジェクト作成、カレンダー登録、売上目標設定"
    ];

    for (const testCase of testCases) {
        console.log(`\n[Test] ${testCase}`);
        console.log('-'.repeat(60));

        try {
            // routerをモックに差し替え
            const originalRouter = require('../lib/llm/router').router;
            require('../lib/llm/router').router = mockRouter;

            const decision = await agentManager.plan(testCase);

            console.log('✅ Decision:');
            console.log(`   Layout: ${decision.layout}`);
            console.log(`   Strategy: ${decision.strategy}`);
            console.log(`   Assignments (${decision.assignments.length}):`);

            decision.assignments.forEach((assignment, index) => {
                console.log(`   ${index + 1}. Screen ${assignment.screenId}:`);
                console.log(`      - App: ${assignment.appId}`);
                console.log(`      - Task: ${assignment.subtask.description}`);
                console.log(`      - Worker: ${assignment.suggestedWorker}`);
                console.log(`      - Complexity: ${assignment.subtask.estimatedComplexity}`);
                if (assignment.subtask.dependencies.length > 0) {
                    console.log(`      - Dependencies: ${assignment.subtask.dependencies.join(', ')}`);
                }
            });

            // 元に戻す
            require('../lib/llm/router').router = originalRouter;
        } catch (e: any) {
            console.error('❌ Error:', e.message);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('テスト完了!');
}

testAgentManager();
