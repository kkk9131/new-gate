# Phase 4 実装計画: ハイブリッド型マルチレイヤーエージェント統合

## 📋 ドキュメント情報
- **作成日**: 2025-11-20
- **対象フェーズ**: Phase 4 - Integration
- **前提条件**: Phase 3完了(Router-Worker実装済み)
- **目標**: Screen操作型subAgentsとCheck Agent検証の実装

---

## 🎯 実装概要

### 目標
既存のRouter-Worker実装に、以下の機能を追加:
1. **Agent Manager拡張**: スクリーン管理機能
2. **Screen subAgents**: 各スクリーンを操作するエージェント
3. **Check Agent**: 最終検証レイヤー

### 実装方針
- ✅ 既存実装を最大限活用
- ✅ 段階的な実装(3つのサブフェーズ)
- ✅ 各フェーズで動作検証

---

## 📦 Phase 4.1: Agent Manager拡張

### 目標
既存`orchestrator.ts`を拡張し、スクリーン管理機能を追加

### 実装タスク

#### 4.1.1 型定義の拡張

**ファイル**: `lib/llm/types.ts`

```typescript
// 既存の型に追加

export type LayoutMode = 'single' | 'split-2' | 'split-3' | 'split-4';

export interface Subtask {
  id: string;
  description: string;
  appId: string;              // 'projects', 'calendar', 'revenue', 'settings'
  estimatedComplexity: 'low' | 'medium' | 'high';
  dependencies: string[];     // 依存する他のsubtask ID
}

export interface Assignment {
  screenId: number;           // 1, 2, 3, 4
  subtask: Subtask;
  appId: string;
  suggestedWorker: LLMProvider;
  tools: ToolDefinition[];
}

export interface AgentManagerDecision {
  layout: LayoutMode;
  assignments: Assignment[];
  strategy: 'parallel' | 'sequential';
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
}
```

**作業時間**: 30分

---

#### 4.1.2 Agent Managerクラス実装

**ファイル**: `lib/agent/manager.ts` (新規)

```typescript
import { router } from '../llm/router';
import { LLMProvider, Message } from '../llm/types';
import {
  AgentManagerDecision,
  Subtask,
  Assignment,
  LayoutMode
} from '../llm/types';

export class AgentManager {
  private plannerProvider: LLMProvider = 'openai';

  /**
   * ユーザーリクエストを分析し、実行計画を立てる
   */
  async plan(userRequest: string): Promise<AgentManagerDecision> {
    console.log('[AgentManager] Planning for:', userRequest);

    // 1. タスク分解
    const subtasks = await this.decomposeTask(userRequest);
    console.log('[AgentManager] Decomposed subtasks:', subtasks);

    if (subtasks.length === 0) {
      throw new Error('Failed to decompose task');
    }

    // 2. レイアウト決定
    const layout = this.determineLayout(subtasks.length);
    console.log('[AgentManager] Layout:', layout);

    // 3. 各タスクにWorkerとScreenを割り当て
    const assignments = subtasks.map((task, index) => ({
      screenId: index + 1,
      subtask: task,
      appId: task.appId,
      suggestedWorker: this.selectWorker(task),
      tools: this.getToolsForApp(task.appId)
    }));

    // 4. 実行戦略決定
    const strategy = this.determineStrategy(subtasks);
    console.log('[AgentManager] Strategy:', strategy);

    return { layout, assignments, strategy };
  }

  /**
   * タスク分解ロジック
   */
  private async decomposeTask(request: string): Promise<Subtask[]> {
    const worker = router.getWorker(this.plannerProvider);

    const prompt = `
あなたはタスク分解の専門家です。
ユーザーリクエストを実行可能なサブタスクに分解してください。

【利用可能なアプリ】
- projects: プロジェクト管理
- calendar: カレンダー管理
- revenue: 売上管理
- settings: 設定管理

【ユーザーリクエスト】
"${request}"

【出力形式】
JSON形式で回答してください:
{
  "subtasks": [
    {
      "id": "1",
      "description": "タスクの説明",
      "appId": "projects",
      "estimatedComplexity": "low",
      "dependencies": []
    }
  ]
}

【注意事項】
- 各タスクは単一のアプリで完結すること
- 依存関係がある場合はdependenciesに先行タスクのIDを指定
- 複雑度は low/medium/high で評価
`;

    const messages: Message[] = [
      { role: 'system', content: 'あなたはタスク分解の専門家です' },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await worker.generate(messages, undefined, {
        temperature: 0,
        model: 'gpt-4o'
      });

      const result = this.parseJSON(response.content);
      return result.subtasks || [];
    } catch (e) {
      console.error('[AgentManager] Failed to decompose task:', e);
      // フォールバック: 単一タスクとして扱う
      return [{
        id: '1',
        description: request,
        appId: 'projects', // デフォルト
        estimatedComplexity: 'medium',
        dependencies: []
      }];
    }
  }

  /**
   * レイアウト決定ロジック
   */
  private determineLayout(taskCount: number): LayoutMode {
    if (taskCount === 1) return 'single';
    if (taskCount === 2) return 'split-2';
    if (taskCount === 3) return 'split-3';
    return 'split-4';
  }

  /**
   * Worker選択ロジック
   */
  private selectWorker(task: Subtask): LLMProvider {
    // 複雑度に応じてWorkerを選択
    switch (task.estimatedComplexity) {
      case 'high':
        return 'openai'; // GPT-4o (Coder)
      case 'medium':
        return 'claude'; // Claude (Analyst)
      case 'low':
      default:
        return 'gemini'; // Gemini Flash (Clerk)
    }
  }

  /**
   * 実行戦略決定
   */
  private determineStrategy(subtasks: Subtask[]): 'parallel' | 'sequential' {
    // 依存関係があればsequential、なければparallel
    const hasDependencies = subtasks.some(task => task.dependencies.length > 0);
    return hasDependencies ? 'sequential' : 'parallel';
  }

  /**
   * アプリごとの利用可能ツールを取得
   */
  private getToolsForApp(appId: string): ToolDefinition[] {
    // TODO: 実際のツール定義を返す
    // Phase 4.2で実装
    return [];
  }

  /**
   * JSON解析ヘルパー
   */
  private parseJSON(content: string): any {
    let cleaned = content.trim();
    
    // マークダウンコードブロックを除去
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '');
    }
    
    return JSON.parse(cleaned);
  }
}

// シングルトンインスタンス
export const agentManager = new AgentManager();
```

**作業時間**: 2時間

---

#### 4.1.3 Desktop Store拡張

**ファイル**: `store/useDesktopStore.ts`

既存のstoreに以下を追加:

```typescript
// 既存の型に追加
interface ScreenState {
  screenId: number;
  appId: string | null;
  status: string;
  progress: number;
}

interface DesktopState {
  // ... 既存のフィールド
  
  // 新規追加
  screens: Map<number, ScreenState>;
  currentLayout: LayoutMode;
}

// 新規アクション
const useDesktopStore = create<DesktopState>((set, get) => ({
  // ... 既存のフィールド
  
  screens: new Map(),
  currentLayout: 'single',
  
  // レイアウト設定
  setLayout: (layout: LayoutMode) => {
    set({ currentLayout: layout });
    // 分割モードに応じてスクリーン数を初期化
    const screenCount = layout === 'single' ? 1 :
                       layout === 'split-2' ? 2 :
                       layout === 'split-3' ? 3 : 4;
    
    const screens = new Map<number, ScreenState>();
    for (let i = 1; i <= screenCount; i++) {
      screens.set(i, {
        screenId: i,
        appId: null,
        status: 'idle',
        progress: 0
      });
    }
    set({ screens });
  },
  
  // スクリーンにアプリを開く
  openAppInScreen: (appId: string, screenId: number) => {
    const { screens } = get();
    const screen = screens.get(screenId);
    if (screen) {
      screen.appId = appId;
      screen.status = 'loading';
      set({ screens: new Map(screens) });
    }
  },
  
  // スクリーン状態更新
  updateScreenStatus: (screenId: number, status: string, progress?: number) => {
    const { screens } = get();
    const screen = screens.get(screenId);
    if (screen) {
      screen.status = status;
      if (progress !== undefined) {
        screen.progress = progress;
      }
      set({ screens: new Map(screens) });
    }
  }
}));
```

**作業時間**: 1時間

---

#### 4.1.4 テスト実装

**ファイル**: `scripts/test-agent-manager.ts` (新規)

```typescript
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
```

**実行**:
```bash
npx tsx scripts/test-agent-manager.ts
```

**作業時間**: 30分

---

### Phase 4.1 完了条件
- ✅ Agent Managerがタスク分解できる
- ✅ レイアウトモードが正しく決定される
- ✅ Worker選択が適切に行われる
- ✅ Desktop Storeでスクリーン管理ができる

**総作業時間**: 4時間

---

## 📦 Phase 4.2: Screen subAgents実装

### 目標
各スクリーンを操作するScreen subAgentを実装

### 実装タスク

#### 4.2.1 UI Controllerクラス実装

**ファイル**: `lib/agent/ui-controller.ts` (新規)

```typescript
import { useDesktopStore } from '@/store/useDesktopStore';

export class UIController {
  /**
   * レイアウトモードを設定
   */
  async setLayout(layout: LayoutMode): Promise<void> {
    const { setLayout } = useDesktopStore.getState();
    setLayout(layout);
    
    // レイアウト変更のアニメーション待機
    await this.wait(300);
  }

  /**
   * 指定スクリーンにアプリを開く
   */
  async openApp(appId: string, screenId: number): Promise<void> {
    console.log(`[UIController] Opening ${appId} in screen ${screenId}`);
    
    const { openAppInScreen } = useDesktopStore.getState();
    openAppInScreen(appId, screenId);
    
    // アプリ起動のアニメーション待機
    await this.wait(500);
  }

  /**
   * スクリーンの状態表示を更新
   */
  async updateStatus(
    screenId: number,
    status: string,
    progress?: number
  ): Promise<void> {
    console.log(`[UIController] Screen ${screenId}: ${status}`);
    
    const { updateScreenStatus } = useDesktopStore.getState();
    updateScreenStatus(screenId, status, progress);
  }

  /**
   * 待機ヘルパー
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// シングルトンインスタンス
export const uiController = new UIController();
```

**作業時間**: 1時間

---

#### 4.2.2 Screen subAgentクラス実装

**ファイル**: `lib/agent/screen-agent.ts` (新規)

```typescript
import { LLMWorker } from '../llm/types';
import { Assignment } from '../llm/types';
import { UIController } from './ui-controller';

export interface ScreenResult {
  screenId: number;
  task: Subtask;
  status: 'success' | 'error' | 'partial';
  data: any;
  error?: string;
  executionTime: number;
  toolCalls: ToolCall[];
}

export interface ToolCall {
  toolName: string;
  arguments: any;
  result: any;
  timestamp: number;
}

export class ScreenSubAgent {
  constructor(
    private screenId: number,
    private assignment: Assignment,
    private worker: LLMWorker,
    private uiController: UIController
  ) {}

  /**
   * タスク実行メインロジック
   */
  async execute(): Promise<ScreenResult> {
    const startTime = Date.now();
    const toolCalls: ToolCall[] = [];

    try {
      console.log(`[ScreenAgent ${this.screenId}] Starting task: ${this.assignment.subtask.description}`);

      // 1. スクリーンにアプリを開く
      await this.uiController.openApp(
        this.assignment.appId,
        this.screenId
      );

      // 2. 実行状態を表示
      await this.uiController.updateStatus(
        this.screenId,
        `Executing: ${this.assignment.subtask.description}`,
        10
      );

      // 3. Workerを使ってタスク実行
      const messages: Message[] = [
        {
          role: 'system',
          content: `あなたは${this.assignment.appId}アプリの操作を担当するエージェントです。
与えられたタスクを実行し、結果を報告してください。`
        },
        {
          role: 'user',
          content: this.assignment.subtask.description
        }
      ];

      await this.uiController.updateStatus(
        this.screenId,
        'Processing...',
        50
      );

      const response = await this.worker.generate(
        messages,
        this.assignment.tools
      );

      // 4. ツール呼び出し履歴を記録
      if (response.toolCalls) {
        toolCalls.push(...response.toolCalls);
      }

      // 5. 完了状態を表示
      await this.uiController.updateStatus(
        this.screenId,
        '✅ Completed',
        100
      );

      console.log(`[ScreenAgent ${this.screenId}] Task completed successfully`);

      return {
        screenId: this.screenId,
        task: this.assignment.subtask,
        status: 'success',
        data: response.data || response.content,
        executionTime: Date.now() - startTime,
        toolCalls
      };

    } catch (error: any) {
      console.error(`[ScreenAgent ${this.screenId}] Error:`, error);

      // エラー状態を表示
      await this.uiController.updateStatus(
        this.screenId,
        `❌ Error: ${error.message}`,
        0
      );

      return {
        screenId: this.screenId,
        task: this.assignment.subtask,
        status: 'error',
        data: null,
        error: error.message,
        executionTime: Date.now() - startTime,
        toolCalls
      };
    }
  }
}
```

**作業時間**: 2時間

---

#### 4.2.3 ツール定義の実装

**ファイル**: `lib/agent/tools.ts` (新規)

```typescript
import { ToolDefinition } from '../llm/types';

/**
 * Projects App用ツール
 */
export const projectsTools: ToolDefinition[] = [
  {
    name: 'create_project',
    description: '新規プロジェクトを作成します',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'プロジェクト名'
        },
        description: {
          type: 'string',
          description: 'プロジェクトの説明'
        },
        budget: {
          type: 'number',
          description: '予算'
        },
        status: {
          type: 'string',
          enum: ['active', 'completed', 'on_hold'],
          description: 'ステータス'
        }
      },
      required: ['name']
    }
  },
  {
    name: 'list_projects',
    description: 'プロジェクト一覧を取得します',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'completed', 'on_hold', 'all'],
          description: 'フィルター条件'
        }
      }
    }
  }
];

/**
 * Calendar App用ツール
 */
export const calendarTools: ToolDefinition[] = [
  {
    name: 'create_event',
    description: 'カレンダーイベントを作成します',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'イベントタイトル'
        },
        start_date: {
          type: 'string',
          description: '開始日時 (ISO 8601形式)'
        },
        end_date: {
          type: 'string',
          description: '終了日時 (ISO 8601形式)'
        },
        description: {
          type: 'string',
          description: 'イベントの説明'
        }
      },
      required: ['title', 'start_date']
    }
  },
  {
    name: 'list_events',
    description: 'カレンダーイベント一覧を取得します',
    parameters: {
      type: 'object',
      properties: {
        start_date: {
          type: 'string',
          description: '検索開始日'
        },
        end_date: {
          type: 'string',
          description: '検索終了日'
        }
      }
    }
  }
];

/**
 * Revenue App用ツール
 */
export const revenueTools: ToolDefinition[] = [
  {
    name: 'create_revenue',
    description: '売上データを登録します',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: '売上金額'
        },
        date: {
          type: 'string',
          description: '売上日 (ISO 8601形式)'
        },
        project_id: {
          type: 'string',
          description: '関連プロジェクトID'
        },
        description: {
          type: 'string',
          description: '説明'
        }
      },
      required: ['amount', 'date']
    }
  }
];

/**
 * アプリIDからツールを取得
 */
export function getToolsForApp(appId: string): ToolDefinition[] {
  switch (appId) {
    case 'projects':
      return projectsTools;
    case 'calendar':
      return calendarTools;
    case 'revenue':
      return revenueTools;
    case 'settings':
      return [];
    default:
      return [];
  }
}
```

**作業時間**: 1.5時間

---

#### 4.2.4 Agent Manager更新

**ファイル**: `lib/agent/manager.ts`

`getToolsForApp`メソッドを更新:

```typescript
import { getToolsForApp } from './tools';

// ...

private getToolsForApp(appId: string): ToolDefinition[] {
  return getToolsForApp(appId);
}
```

**作業時間**: 10分

---

#### 4.2.5 統合オーケストレーター実装

**ファイル**: `lib/agent/orchestrator.ts` (新規)

```typescript
import { agentManager } from './manager';
import { ScreenSubAgent, ScreenResult } from './screen-agent';
import { uiController } from './ui-controller';
import { router } from '../llm/router';

export class HybridOrchestrator {
  /**
   * ユーザーリクエストを実行
   */
  async execute(userRequest: string): Promise<{
    success: boolean;
    results: ScreenResult[];
  }> {
    console.log('[HybridOrchestrator] Executing:', userRequest);

    // 1. Agent Manager: Planning
    const decision = await agentManager.plan(userRequest);
    console.log('[HybridOrchestrator] Decision:', decision);

    // 2. UI Layout設定
    await uiController.setLayout(decision.layout);

    // 3. Screen subAgents作成
    const screenAgents = decision.assignments.map(assignment => {
      const worker = router.getWorker(assignment.suggestedWorker);
      return new ScreenSubAgent(
        assignment.screenId,
        assignment,
        worker,
        uiController
      );
    });

    // 4. 実行(並列 or 順次)
    let results: ScreenResult[];
    
    if (decision.strategy === 'parallel') {
      console.log('[HybridOrchestrator] Executing in parallel');
      results = await Promise.all(
        screenAgents.map(agent => agent.execute())
      );
    } else {
      console.log('[HybridOrchestrator] Executing sequentially');
      results = [];
      for (const agent of screenAgents) {
        const result = await agent.execute();
        results.push(result);
      }
    }

    // 5. 成功判定
    const success = results.every(r => r.status === 'success');

    console.log('[HybridOrchestrator] Execution completed:', { success, results });

    return { success, results };
  }
}

// シングルトンインスタンス
export const hybridOrchestrator = new HybridOrchestrator();
```

**作業時間**: 1時間

---

#### 4.2.6 テスト実装

**ファイル**: `scripts/test-screen-agents.ts` (新規)

```typescript
import { hybridOrchestrator } from '../lib/agent/orchestrator';

async function testScreenAgents() {
  console.log('=== Screen subAgents Test ===\n');

  const testCases = [
    "新規プロジェクトを作成",
    "プロジェクト作成とカレンダー登録"
  ];

  for (const testCase of testCases) {
    console.log(`\n[Test] ${testCase}`);
    console.log('='.repeat(60));
    
    try {
      const result = await hybridOrchestrator.execute(testCase);
      console.log('\n[Result]');
      console.log('Success:', result.success);
      console.log('Results:', JSON.stringify(result.results, null, 2));
    } catch (e: any) {
      console.error('Error:', e.message);
    }
    
    console.log('\n');
  }
}

testScreenAgents();
```

**作業時間**: 30分

---

### Phase 4.2 完了条件
- ✅ Screen subAgentがスクリーンを操作できる
- ✅ Workerを使ってタスク実行できる
- ✅ 並列実行と順次実行が動作する
- ✅ UI状態が正しく更新される

**総作業時間**: 6時間

---

## 📦 Phase 4.3: Check Agent実装

### 目標
最終検証レイヤーを実装

### 実装タスク

#### 4.3.1 Check Agentクラス実装

**ファイル**: `lib/agent/check-agent.ts` (新規)

```typescript
import { router } from '../llm/router';
import { LLMProvider, Message } from '../llm/types';
import { ScreenResult } from './screen-agent';

export interface ValidationReport {
  success: boolean;
  summary: string;
  details: {
    completedTasks: number;
    totalTasks: number;
    successRate: number;
  };
  issues: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    affectedScreens: number[];
  }>;
  suggestions: string[];
}

export class CheckAgent {
  private llmProvider: LLMProvider = 'openai'; // GPT-4o-mini

  /**
   * 実行結果の検証
   */
  async verify(
    originalRequest: string,
    screenResults: ScreenResult[]
  ): Promise<ValidationReport> {
    console.log('[CheckAgent] Verifying results for:', originalRequest);

    const worker = router.getWorker(this.llmProvider);

    const prompt = this.buildVerificationPrompt(originalRequest, screenResults);

    const messages: Message[] = [
      { role: 'system', content: 'あなたはタスク検証の専門家です。実行結果を分析し、ユーザーの要求が満たされているか検証してください。' },
      { role: 'user', content: prompt }
    ];

    try {
      const response = await worker.generate(messages, undefined, {
        temperature: 0,
        model: 'gpt-4o-mini'
      });

      const report = this.parseJSON(response.content);
      console.log('[CheckAgent] Validation report:', report);

      return report;
    } catch (e: any) {
      console.error('[CheckAgent] Verification failed:', e);

      // フォールバック: 基本的な検証
      return this.createFallbackReport(screenResults);
    }
  }

  /**
   * 検証プロンプト生成
   */
  private buildVerificationPrompt(
    originalRequest: string,
    screenResults: ScreenResult[]
  ): string {
    return `
あなたはタスク検証の専門家です。
以下のユーザーリクエストと実行結果を検証してください。

【ユーザーの元の要求】
"${originalRequest}"

【実行結果】
${screenResults.map((r, i) => `
Screen ${r.screenId}:
- タスク: ${r.task.description}
- アプリ: ${r.task.appId}
- 状態: ${r.status}
- 実行時間: ${r.executionTime}ms
- データ: ${JSON.stringify(r.data, null, 2)}
${r.error ? `- エラー: ${r.error}` : ''}
${r.toolCalls.length > 0 ? `- ツール呼び出し: ${r.toolCalls.map(tc => tc.toolName).join(', ')}` : ''}
`).join('\n')}

【検証項目】
1. 全てのタスクが正常に完了しましたか?
2. ユーザーの要求を満たしていますか?
3. データの整合性に問題はありませんか?
4. 改善できる点はありますか?

【出力形式】
JSON形式で回答してください:
{
  "success": true/false,
  "summary": "検証結果の要約(日本語)",
  "details": {
    "completedTasks": 2,
    "totalTasks": 2,
    "successRate": 100
  },
  "issues": [
    {
      "severity": "warning",
      "message": "問題の説明",
      "affectedScreens": [1]
    }
  ],
  "suggestions": [
    "改善提案1",
    "改善提案2"
  ]
}
`;
  }

  /**
   * JSON解析
   */
  private parseJSON(content: string): ValidationReport {
    try {
      let cleaned = content.trim();
      
      // マークダウンコードブロックを除去
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('[CheckAgent] Failed to parse JSON:', e);
      throw e;
    }
  }

  /**
   * フォールバックレポート生成
   */
  private createFallbackReport(screenResults: ScreenResult[]): ValidationReport {
    const completedTasks = screenResults.filter(r => r.status === 'success').length;
    const totalTasks = screenResults.length;
    const successRate = Math.round((completedTasks / totalTasks) * 100);

    const issues = screenResults
      .filter(r => r.status === 'error')
      .map(r => ({
        severity: 'critical' as const,
        message: r.error || 'Unknown error',
        affectedScreens: [r.screenId]
      }));

    return {
      success: completedTasks === totalTasks,
      summary: `${completedTasks}/${totalTasks}のタスクが完了しました`,
      details: {
        completedTasks,
        totalTasks,
        successRate
      },
      issues,
      suggestions: []
    };
  }
}

// シングルトンインスタンス
export const checkAgent = new CheckAgent();
```

**作業時間**: 2時間

---

#### 4.3.2 オーケストレーター更新

**ファイル**: `lib/agent/orchestrator.ts`

Check Agent統合:

```typescript
import { checkAgent, ValidationReport } from './check-agent';

export class HybridOrchestrator {
  async execute(userRequest: string): Promise<{
    success: boolean;
    results: ScreenResult[];
    validation: ValidationReport;
  }> {
    console.log('[HybridOrchestrator] Executing:', userRequest);

    // 1-4. (既存のロジック)
    const decision = await agentManager.plan(userRequest);
    await uiController.setLayout(decision.layout);
    
    const screenAgents = decision.assignments.map(assignment => {
      const worker = router.getWorker(assignment.suggestedWorker);
      return new ScreenSubAgent(
        assignment.screenId,
        assignment,
        worker,
        uiController
      );
    });

    let results: ScreenResult[];
    if (decision.strategy === 'parallel') {
      results = await Promise.all(screenAgents.map(agent => agent.execute()));
    } else {
      results = [];
      for (const agent of screenAgents) {
        results.push(await agent.execute());
      }
    }

    // 5. Check Agent: Validation (新規)
    const validation = await checkAgent.verify(userRequest, results);

    console.log('[HybridOrchestrator] Execution completed:', {
      success: validation.success,
      results,
      validation
    });

    return {
      success: validation.success,
      results,
      validation
    };
  }
}
```

**作業時間**: 30分

---

#### 4.3.3 Chat API統合

**ファイル**: `app/api/agent/chat/route.ts`

既存のエンドポイントを更新:

```typescript
import { hybridOrchestrator } from '@/lib/agent/orchestrator';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Hybrid Orchestratorを使用
    const result = await hybridOrchestrator.execute(message);

    return Response.json({
      success: result.success,
      message: result.validation.summary,
      details: {
        screens: result.results,
        validation: result.validation
      }
    });
  } catch (error: any) {
    console.error('[API] Chat error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**作業時間**: 30分

---

#### 4.3.4 テスト実装

**ファイル**: `scripts/test-full-flow.ts` (新規)

```typescript
import { hybridOrchestrator } from '../lib/agent/orchestrator';

async function testFullFlow() {
  console.log('=== Full Flow Test (with Check Agent) ===\n');

  const testCases = [
    {
      request: "新規プロジェクトを作成",
      expected: "1つのタスクが完了"
    },
    {
      request: "プロジェクト作成とカレンダー登録",
      expected: "2つのタスクが完了"
    },
    {
      request: "プロジェクト作成、カレンダー登録、売上目標設定",
      expected: "3つのタスクが完了"
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n[Test] ${testCase.request}`);
    console.log('Expected:', testCase.expected);
    console.log('='.repeat(60));
    
    try {
      const result = await hybridOrchestrator.execute(testCase.request);
      
      console.log('\n[Validation Report]');
      console.log('Success:', result.validation.success);
      console.log('Summary:', result.validation.summary);
      console.log('Details:', result.validation.details);
      
      if (result.validation.issues.length > 0) {
        console.log('\nIssues:');
        result.validation.issues.forEach(issue => {
          console.log(`  [${issue.severity}] ${issue.message}`);
        });
      }
      
      if (result.validation.suggestions.length > 0) {
        console.log('\nSuggestions:');
        result.validation.suggestions.forEach(s => {
          console.log(`  - ${s}`);
        });
      }
      
      console.log('\n[Screen Results]');
      result.results.forEach(r => {
        console.log(`  Screen ${r.screenId}: ${r.status} (${r.executionTime}ms)`);
      });
      
    } catch (e: any) {
      console.error('Error:', e.message);
    }
    
    console.log('\n');
  }
}

testFullFlow();
```

**作業時間**: 30分

---

### Phase 4.3 完了条件
- ✅ Check Agentが結果を検証できる
- ✅ 問題検出と改善提案が機能する
- ✅ Chat APIと統合されている
- ✅ フルフローテストが成功する

**総作業時間**: 3.5時間

---

## 📊 実装スケジュール

### 全体タイムライン

| Phase | タスク | 作業時間 | 累計時間 |
|-------|--------|---------|---------|
| 4.1 | Agent Manager拡張 | 4時間 | 4時間 |
| 4.2 | Screen subAgents実装 | 6時間 | 10時間 |
| 4.3 | Check Agent実装 | 3.5時間 | 13.5時間 |
| **合計** | | **13.5時間** | |

### 推奨スケジュール

**Day 1** (4時間):
- Phase 4.1完了
- Agent Manager拡張とテスト

**Day 2** (6時間):
- Phase 4.2完了
- Screen subAgents実装とテスト

**Day 3** (3.5時間):
- Phase 4.3完了
- Check Agent実装とフルフローテスト

---

## ✅ 検証計画

### 単体テスト

各Phaseで以下をテスト:

1. **Phase 4.1**:
   - タスク分解が正しく動作するか
   - レイアウト決定が適切か
   - Worker選択が正しいか

2. **Phase 4.2**:
   - Screen subAgentがスクリーンを操作できるか
   - 並列実行が動作するか
   - エラーハンドリングが機能するか

3. **Phase 4.3**:
   - Check Agentが検証できるか
   - 問題検出が機能するか
   - 改善提案が生成されるか

### 統合テスト

**シナリオ1**: シンプルなタスク
```
Input: "新規プロジェクトを作成"
Expected:
  - Layout: single
  - Screens: 1
  - Success: true
```

**シナリオ2**: 複合タスク(並列)
```
Input: "プロジェクト作成とカレンダー登録"
Expected:
  - Layout: split-2
  - Screens: 2
  - Strategy: parallel
  - Success: true
```

**シナリオ3**: 依存関係のあるタスク
```
Input: "プロジェクト作成して、そのIDで売上登録"
Expected:
  - Layout: split-2
  - Screens: 2
  - Strategy: sequential
  - Success: true
```

---

## 🚀 デプロイ計画

### 段階的ロールアウト

1. **Phase 4.1**: Agent Manager拡張
   - 既存機能に影響なし
   - 新機能として追加

2. **Phase 4.2**: Screen subAgents
   - UI変更あり(スクリーン状態表示)
   - ユーザーテストが必要

3. **Phase 4.3**: Check Agent
   - Chat UI更新(検証結果表示)
   - ユーザーフィードバック収集

### フィーチャーフラグ

環境変数で機能を制御:

```typescript
// .env.local
NEXT_PUBLIC_ENABLE_HYBRID_AGENT=true
NEXT_PUBLIC_ENABLE_CHECK_AGENT=true
```

---

## 📚 関連ドキュメント

- [ハイブリッドエージェントアーキテクチャ](./hybrid-agent-architecture.md) - 設計詳細
- [タスクリスト](./tasks.md) - 実装進捗管理
- [エージェントシステム設計](./agent-system-design.md) - 既存設計

---

## 🎯 成功指標

### 機能指標
- ✅ タスク分解精度: 90%以上
- ✅ 並列実行成功率: 95%以上
- ✅ 検証精度: 85%以上

### パフォーマンス指標
- タスク分解時間: < 2秒
- Screen操作時間: < 1秒
- 検証時間: < 1秒
- 全体実行時間: < 10秒(3タスク並列)

### ユーザー体験指標
- タスク成功率: 95%以上
- エラー率: < 5%
- ユーザー満足度: 4.5/5以上
