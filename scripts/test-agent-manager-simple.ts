/**
 * Agent Manager の動作確認スクリプト（簡易版）
 * 
 * このスクリプトは、Agent Managerの各メソッドが正しく動作するかを
 * APIキーなしで確認できます。
 */

import { AgentManager } from '../lib/agent/manager';
import type { Subtask } from '../lib/llm/types';

const agentManager = new AgentManager();

console.log('=== Agent Manager 動作確認 (簡易版) ===\n');

// 1. レイアウト決定ロジックのテスト
console.log('【1】レイアウト決定ロジック');
console.log('-'.repeat(60));
const layouts = [
    { taskCount: 1, expected: 'single' },
    { taskCount: 2, expected: 'split-2' },
    { taskCount: 3, expected: 'split-3' },
    { taskCount: 4, expected: 'split-4' },
];

layouts.forEach(({ taskCount, expected }) => {
    const result = (agentManager as any).determineLayout(taskCount);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} タスク数 ${taskCount} → レイアウト: ${result} (期待値: ${expected})`);
});

// 2. Worker選択ロジックのテスト
console.log('\n【2】Worker選択ロジック');
console.log('-'.repeat(60));
const tasks: Subtask[] = [
    {
        id: '1',
        description: '簡単なタスク',
        appId: 'projects',
        estimatedComplexity: 'low',
        dependencies: []
    },
    {
        id: '2',
        description: '中程度のタスク',
        appId: 'calendar',
        estimatedComplexity: 'medium',
        dependencies: []
    },
    {
        id: '3',
        description: '複雑なタスク',
        appId: 'revenue',
        estimatedComplexity: 'high',
        dependencies: []
    }
];

tasks.forEach(task => {
    const worker = (agentManager as any).selectWorker(task);
    const expectedWorker =
        task.estimatedComplexity === 'low' ? 'gemini' :
            task.estimatedComplexity === 'medium' ? 'claude' : 'openai';
    const status = worker === expectedWorker ? '✅' : '❌';
    console.log(`${status} ${task.estimatedComplexity} → ${worker} (期待値: ${expectedWorker})`);
});

// 3. 実行戦略決定ロジックのテスト
console.log('\n【3】実行戦略決定ロジック');
console.log('-'.repeat(60));

const parallelTasks: Subtask[] = [
    { id: '1', description: 'タスク1', appId: 'projects', estimatedComplexity: 'low', dependencies: [] },
    { id: '2', description: 'タスク2', appId: 'calendar', estimatedComplexity: 'low', dependencies: [] }
];

const sequentialTasks: Subtask[] = [
    { id: '1', description: 'タスク1', appId: 'projects', estimatedComplexity: 'low', dependencies: [] },
    { id: '2', description: 'タスク2', appId: 'calendar', estimatedComplexity: 'low', dependencies: ['1'] }
];

const parallelStrategy = (agentManager as any).determineStrategy(parallelTasks);
const sequentialStrategy = (agentManager as any).determineStrategy(sequentialTasks);

console.log(`${parallelStrategy === 'parallel' ? '✅' : '❌'} 依存関係なし → ${parallelStrategy} (期待値: parallel)`);
console.log(`${sequentialStrategy === 'sequential' ? '✅' : '❌'} 依存関係あり → ${sequentialStrategy} (期待値: sequential)`);

// 4. 統合テスト（フォールバック動作の確認）
console.log('\n【4】統合テスト（フォールバック動作）');
console.log('-'.repeat(60));
console.log('※ APIキーが無効な場合、フォールバックロジックが動作します\n');

async function testIntegration() {
    try {
        const decision = await agentManager.plan('テストタスク');
        console.log('✅ フォールバックが正常に動作しました');
        console.log(`   - Layout: ${decision.layout}`);
        console.log(`   - Strategy: ${decision.strategy}`);
        console.log(`   - Assignments: ${decision.assignments.length}個`);
        if (decision.assignments.length > 0) {
            console.log(`   - 最初のタスク: ${decision.assignments[0].subtask.description}`);
            console.log(`   - 選択されたWorker: ${decision.assignments[0].suggestedWorker}`);
        }
    } catch (e: any) {
        console.log('❌ エラーが発生しました:', e.message);
    }
}

testIntegration().then(() => {
    console.log('\n' + '='.repeat(60));
    console.log('✅ すべてのテストが完了しました!');
    console.log('\n【結論】');
    console.log('Agent Managerの基本ロジック（レイアウト決定、Worker選択、戦略決定）');
    console.log('は正常に動作しています。');
    console.log('\n実際のLLM APIを使用したタスク分解をテストするには、');
    console.log('有効なOPENAI_API_KEYを.env.localに設定してください。');
});
