# ハイブリッド型マルチレイヤーエージェントアーキテクチャ

## 📋 ドキュメント情報
- **作成日**: 2025-11-20
- **バージョン**: 1.0
- **対象**: Phase 4 Agent System統合
- **目的**: 既存Router-Worker実装とScreen操作型subAgentsを統合した新アーキテクチャの定義

---

## 🎯 概要

### ビジョン

**「ユーザーの複雑なタスクを、複数のスクリーンで並列実行し、自動検証まで行うインテリジェントエージェントシステム」**

従来のRouter-Worker実装は、LLMの役割分担による効率的なタスク実行を実現していました。
ハイブリッド案では、これに**スクリーン操作機能**と**最終検証機能**を追加し、ユーザーが視覚的にタスク実行を確認できる体験を提供します。

### コアコンセプト

```yaml
3層アーキテクチャ:
  Layer 1 - Agent Manager (司令塔):
    - タスク分解
    - スクリーンレイアウト決定
    - Screen subAgent割り当て
    - 並列実行調整
    
  Layer 2 - Screen subAgents (実行部隊):
    - 各スクリーンを担当
    - UI操作(アプリ起動、状態表示)
    - 既存Workerを内包してタスク実行
    
  Layer 3 - Check Agent (検証者):
    - 全タスク完了後の最終検証
    - ユーザー要件との照合
    - 問題点の指摘と改善提案
```

---

## 🏗️ アーキテクチャ詳細

### 全体フロー図

```
┌─────────────────────────────────────────────────────────────┐
│                    User Request                              │
│         "新規プロジェクト作成して、カレンダーに登録"           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Agent Manager (Orchestrator)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🧠 Planning Phase                                     │   │
│  │                                                       │   │
│  │ 1. タスク分解:                                         │   │
│  │    - Subtask 1: "新規プロジェクト作成"                │   │
│  │    - Subtask 2: "カレンダーにイベント登録"            │   │
│  │                                                       │   │
│  │ 2. レイアウト決定:                                     │   │
│  │    - Mode: split-2 (2分割)                            │   │
│  │                                                       │   │
│  │ 3. Screen割り当て:                                     │   │
│  │    - Screen 1 → Subtask 1 (Worker: Clerk)            │   │
│  │    - Screen 2 → Subtask 2 (Worker: Clerk)            │   │
│  │                                                       │   │
│  │ 使用LLM: GPT-4o (高度な推論)                          │   │
│  └──────────────────────────────────────────────────────┘   │
└────────┬────────────────────────────┬────────────────────────┘
         │                            │
         ▼                            ▼
┌────────────────────┐      ┌────────────────────┐
│ Assignment 1       │      │ Assignment 2       │
│ Screen: 1          │      │ Screen: 2          │
│ Task: Projects作成 │      │ Task: Calendar登録 │
│ Worker: Clerk      │      │ Worker: Clerk      │
└────────┬───────────┘      └────────┬───────────┘
         │                            │
         ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Screen subAgents (Browser Controllers)             │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Screen subAgent #1                                    │   │
│  │ ┌────────────────────────────────────────────────┐   │   │
│  │ │ 1. UI Control:                                  │   │   │
│  │ │    - ui_open_app('projects', screen: 1)         │   │   │
│  │ │    - ui_update_status('Creating project...')    │   │   │
│  │ │                                                  │   │   │
│  │ │ 2. Task Execution (via Worker):                 │   │   │
│  │ │    - Worker(Clerk).generate(...)                │   │   │
│  │ │    - Tool: create_project(name, budget)         │   │   │
│  │ │                                                  │   │   │
│  │ │ 3. Result Reporting:                            │   │   │
│  │ │    - status: 'success'                          │   │   │
│  │ │    - data: { projectId: 'xxx', name: '...' }    │   │   │
│  │ └────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Screen subAgent #2                                    │   │
│  │ ┌────────────────────────────────────────────────┐   │   │
│  │ │ 1. UI Control:                                  │   │   │
│  │ │    - ui_open_app('calendar', screen: 2)         │   │   │
│  │ │    - ui_update_status('Adding event...')        │   │   │
│  │ │                                                  │   │   │
│  │ │ 2. Task Execution (via Worker):                 │   │   │
│  │ │    - Worker(Clerk).generate(...)                │   │   │
│  │ │    - Tool: create_event(title, date)            │   │   │
│  │ │                                                  │   │   │
│  │ │ 3. Result Reporting:                            │   │   │
│  │ │    - status: 'success'                          │   │   │
│  │ │    - data: { eventId: 'yyy', title: '...' }     │   │   │
│  │ └────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬──────────────────────┬──────────────────────┘
                 │                      │
                 │  Results             │  Results
                 │                      │
                 ▼                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Check Agent (Validator)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 🔍 Validation Phase                                   │   │
│  │                                                       │   │
│  │ Input:                                                │   │
│  │ - originalRequest: "新規プロジェクト作成して..."      │   │
│  │ - screenResults: [                                    │   │
│  │     {                                                 │   │
│  │       screenId: 1,                                    │   │
│  │       task: "新規プロジェクト作成",                   │   │
│  │       status: "success",                              │   │
│  │       data: { projectId: 'xxx', ... }                 │   │
│  │     },                                                │   │
│  │     {                                                 │   │
│  │       screenId: 2,                                    │   │
│  │       task: "カレンダーにイベント登録",               │   │
│  │       status: "success",                              │   │
│  │       data: { eventId: 'yyy', ... }                   │   │
│  │     }                                                 │   │
│  │   ]                                                   │   │
│  │                                                       │   │
│  │ Verification:                                         │   │
│  │ 1. 両方のタスクが成功しているか?                       │   │
│  │ 2. プロジェクトとカレンダーイベントが関連付けられているか? │
│  │ 3. ユーザーの意図を満たしているか?                     │   │
│  │                                                       │   │
│  │ Output:                                               │   │
│  │ {                                                     │   │
│  │   success: true,                                      │   │
│  │   summary: "プロジェクトとカレンダーイベントを正常に作成しました", │
│  │   issues: [],                                         │   │
│  │   suggestions: ["プロジェクトの期限を設定すると便利です"] │
│  │ }                                                     │   │
│  │                                                       │   │
│  │ 使用LLM: GPT-4o-mini (検証タスク)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ User Report │
                  │             │
                  │ ✅ 完了      │
                  │ 📊 詳細      │
                  │ 💡 提案      │
                  └─────────────┘
```

---

## 📦 コンポーネント詳細

### Layer 1: Agent Manager

#### 責務
1. **タスク分解**: ユーザーリクエストを複数のサブタスクに分解
2. **レイアウト決定**: 必要なスクリーン数とレイアウトモードを決定
3. **Worker選択**: 各タスクに最適なWorker(LLM)を選択
4. **Screen割り当て**: どのタスクをどのスクリーンで実行するか決定
5. **並列実行調整**: Screen subAgentsの並列実行を管理

#### インターフェース

```typescript
interface AgentManagerDecision {
  // レイアウト設定
  layout: 'single' | 'split-2' | 'split-3' | 'split-4';
  
  // Screen割り当て
  assignments: Array<{
    screenId: number;           // 1, 2, 3, 4
    subtask: Subtask;           // 実行するタスク
    appId: string;              // 開くアプリID ('projects', 'calendar', etc.)
    suggestedWorker: LLMProvider; // 推奨Worker ('openai', 'gemini', 'claude')
    tools: ToolDefinition[];    // 利用可能なツール
  }>;
  
  // 実行戦略
  strategy: 'parallel' | 'sequential';
}

interface Subtask {
  id: string;
  description: string;
  appId: string;              // 対象アプリ
  estimatedComplexity: 'low' | 'medium' | 'high';
  dependencies: string[];     // 依存する他のsubtask ID
}
```

#### 実装クラス

```typescript
class AgentManager {
  private plannerLLM: LLMWorker; // GPT-4o
  
  /**
   * ユーザーリクエストを分析し、実行計画を立てる
   */
  async plan(userRequest: string): Promise<AgentManagerDecision> {
    // 1. タスク分解
    const subtasks = await this.decomposeTask(userRequest);
    
    // 2. レイアウト決定
    const layout = this.determineLayout(subtasks.length);
    
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
    
    return { layout, assignments, strategy };
  }
  
  /**
   * タスク分解ロジック
   */
  private async decomposeTask(request: string): Promise<Subtask[]> {
    const prompt = `
ユーザーリクエスト: "${request}"

このリクエストを実行可能なサブタスクに分解してください。
各タスクには以下を含めてください:
- description: タスクの説明
- appId: 使用するアプリ ('projects', 'calendar', 'revenue', 'settings')
- estimatedComplexity: 複雑度 ('low', 'medium', 'high')
- dependencies: 依存する他のタスクID (配列)

JSON形式で回答:
{
  "subtasks": [
    {
      "id": "1",
      "description": "...",
      "appId": "projects",
      "estimatedComplexity": "low",
      "dependencies": []
    }
  ]
}
`;

    const response = await this.plannerLLM.generate([
      { role: 'system', content: 'あなたはタスク分解の専門家です' },
      { role: 'user', content: prompt }
    ]);
    
    const result = this.parseJSON(response.content);
    return result.subtasks;
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
   * Worker選択ロジック (既存のRouter実装を活用)
   */
  private selectWorker(task: Subtask): LLMProvider {
    // 複雑度に応じてWorkerを選択
    if (task.estimatedComplexity === 'high') {
      return 'openai'; // GPT-4o (Coder)
    } else if (task.estimatedComplexity === 'medium') {
      return 'claude'; // Claude (Analyst)
    } else {
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
}
```

---

### Layer 2: Screen subAgents

#### 責務
1. **UI制御**: 担当スクリーンにアプリを開く、状態を表示
2. **タスク実行**: 既存Workerを使ってタスクを実行
3. **ツール呼び出し**: アプリAPIを呼び出してデータ操作
4. **結果報告**: 実行結果をAgent Managerに返す

#### インターフェース

```typescript
interface ScreenResult {
  screenId: number;
  task: Subtask;
  status: 'success' | 'error' | 'partial';
  data: any;                  // タスク実行結果データ
  error?: string;             // エラーメッセージ
  executionTime: number;      // 実行時間(ms)
  toolCalls: ToolCall[];      // 実行したツール呼び出し履歴
}

interface ToolCall {
  toolName: string;
  arguments: any;
  result: any;
  timestamp: number;
}
```

#### 実装クラス

```typescript
class ScreenSubAgent {
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
      // 1. スクリーンにアプリを開く
      await this.uiController.openApp(
        this.assignment.appId,
        this.screenId
      );
      
      // 2. 実行状態を表示
      await this.uiController.updateStatus(
        this.screenId,
        `Executing: ${this.assignment.subtask.description}`
      );
      
      // 3. Workerを使ってタスク実行
      const messages: Message[] = [
        {
          role: 'system',
          content: `あなたは${this.assignment.appId}アプリの操作を担当するエージェントです。`
        },
        {
          role: 'user',
          content: this.assignment.subtask.description
        }
      ];
      
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
        '✅ Completed'
      );
      
      return {
        screenId: this.screenId,
        task: this.assignment.subtask,
        status: 'success',
        data: response.data,
        executionTime: Date.now() - startTime,
        toolCalls
      };
      
    } catch (error: any) {
      // エラー状態を表示
      await this.uiController.updateStatus(
        this.screenId,
        `❌ Error: ${error.message}`
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

#### UI Controller

```typescript
class UIController {
  /**
   * 指定スクリーンにアプリを開く
   */
  async openApp(appId: string, screenId: number): Promise<void> {
    // useDesktopStore経由でアプリを開く
    const { openAppInScreen } = useDesktopStore.getState();
    await openAppInScreen(appId, screenId);
  }
  
  /**
   * スクリーンの状態表示を更新
   */
  async updateStatus(screenId: number, status: string): Promise<void> {
    // 各スクリーンのヘッダーに状態を表示
    const { updateScreenStatus } = useDesktopStore.getState();
    updateScreenStatus(screenId, status);
  }
}
```

---

### Layer 3: Check Agent

#### 責務
1. **結果検証**: 全Screen subAgentsの実行結果を検証
2. **要件照合**: ユーザーの元の要求と照合
3. **問題検出**: 不足や矛盾を検出
4. **改善提案**: より良い実行方法を提案

#### インターフェース

```typescript
interface ValidationReport {
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
```

#### 実装クラス

```typescript
class CheckAgent {
  private llm: LLMWorker; // GPT-4o-mini
  
  /**
   * 実行結果の検証
   */
  async verify(
    originalRequest: string,
    screenResults: ScreenResult[]
  ): Promise<ValidationReport> {
    const prompt = `
あなたはタスク検証の専門家です。
以下のユーザーリクエストと実行結果を検証してください。

【ユーザーの元の要求】
"${originalRequest}"

【実行結果】
${screenResults.map((r, i) => `
Screen ${r.screenId}:
- タスク: ${r.task.description}
- 状態: ${r.status}
- 実行時間: ${r.executionTime}ms
- データ: ${JSON.stringify(r.data, null, 2)}
- ツール呼び出し: ${r.toolCalls.map(tc => tc.toolName).join(', ')}
${r.error ? `- エラー: ${r.error}` : ''}
`).join('\n')}

【検証項目】
1. 全てのタスクが正常に完了しましたか?
2. ユーザーの要求を満たしていますか?
3. データの整合性に問題はありませんか?
4. 改善できる点はありますか?

JSON形式で回答してください:
{
  "success": true/false,
  "summary": "検証結果の要約",
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

    const response = await this.llm.generate([
      { role: 'system', content: 'あなたはタスク検証の専門家です' },
      { role: 'user', content: prompt }
    ]);
    
    return this.parseJSON(response.content);
  }
  
  /**
   * JSON解析(エラーハンドリング付き)
   */
  private parseJSON(content: string): ValidationReport {
    try {
      // マークダウンコードブロックを除去
      let cleaned = content.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\n/, '').replace(/\n```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\n/, '').replace(/\n```$/, '');
      }
      
      return JSON.parse(cleaned);
    } catch (e) {
      // パース失敗時のフォールバック
      return {
        success: false,
        summary: 'Failed to parse validation result',
        details: { completedTasks: 0, totalTasks: 0, successRate: 0 },
        issues: [{
          severity: 'critical',
          message: 'Validation failed',
          affectedScreens: []
        }],
        suggestions: []
      };
    }
  }
}
```

---

## 🔄 実行フロー詳細

### フルシーケンス図

```typescript
// 1. ユーザーリクエスト受信
const userRequest = "新規プロジェクト作成して、カレンダーに登録";

// 2. Agent Manager: Planning
const manager = new AgentManager();
const decision = await manager.plan(userRequest);
// → {
//     layout: 'split-2',
//     assignments: [
//       { screenId: 1, subtask: {...}, appId: 'projects', suggestedWorker: 'gemini', tools: [...] },
//       { screenId: 2, subtask: {...}, appId: 'calendar', suggestedWorker: 'gemini', tools: [...] }
//     ],
//     strategy: 'parallel'
//   }

// 3. UI Layout設定
const uiController = new UIController();
await uiController.setLayout(decision.layout);

// 4. Screen subAgents作成
const screenAgents = decision.assignments.map(assignment => {
  const worker = router.getWorker(assignment.suggestedWorker);
  return new ScreenSubAgent(
    assignment.screenId,
    assignment,
    worker,
    uiController
  );
});

// 5. 並列実行
const results = await Promise.all(
  screenAgents.map(agent => agent.execute())
);
// → [
//     { screenId: 1, status: 'success', data: { projectId: 'xxx' }, ... },
//     { screenId: 2, status: 'success', data: { eventId: 'yyy' }, ... }
//   ]

// 6. Check Agent: Validation
const checkAgent = new CheckAgent();
const validation = await checkAgent.verify(userRequest, results);
// → {
//     success: true,
//     summary: "プロジェクトとカレンダーイベントを正常に作成しました",
//     issues: [],
//     suggestions: ["プロジェクトの期限を設定すると便利です"]
//   }

// 7. ユーザーに結果報告
return {
  success: validation.success,
  message: validation.summary,
  details: {
    screens: results,
    validation: validation
  }
};
```

---

## 🔧 既存実装との統合

### 既存コンポーネントの活用

| 既存コンポーネント | ハイブリッド案での役割 | 変更内容 |
|------------------|---------------------|---------|
| `lib/llm/orchestrator.ts` | Agent Managerのベース | ✏️ Screen管理機能を追加 |
| `lib/llm/router.ts` | Worker選択ロジック | ✅ そのまま活用 |
| `lib/llm/workers/*.ts` | LLM実行エンジン | ✅ Screen subAgentに内包 |
| `store/useDesktopStore.ts` | UI状態管理 | ✏️ Screen割り当て情報を追加 |
| `components/desktop/DesktopLayout.tsx` | レイアウト制御 | ✏️ Screen状態表示を追加 |

### 新規コンポーネント

| 新規コンポーネント | 役割 | 優先度 |
|------------------|------|--------|
| `lib/agent/manager.ts` | Agent Manager実装 | 🔴 High |
| `lib/agent/screen-agent.ts` | Screen subAgent実装 | 🔴 High |
| `lib/agent/check-agent.ts` | Check Agent実装 | 🟡 Medium |
| `lib/agent/ui-controller.ts` | UI制御ユーティリティ | 🔴 High |
| `store/useAgentStore.ts` | Agent状態管理 | 🟡 Medium |

---

## 📊 データフロー

### 状態管理

```typescript
// useAgentStore.ts
interface AgentState {
  // 現在の実行状態
  isExecuting: boolean;
  currentRequest: string | null;
  
  // Agent Manager決定
  decision: AgentManagerDecision | null;
  
  // Screen状態
  screens: Map<number, ScreenState>;
  
  // 実行結果
  results: ScreenResult[];
  validation: ValidationReport | null;
}

interface ScreenState {
  screenId: number;
  appId: string | null;
  status: string;
  progress: number; // 0-100
}
```

### データベース拡張

既存の`agent_memories`テーブルに実行履歴を保存:

```sql
-- 実行履歴の保存
INSERT INTO agent_memories (user_id, content, metadata)
VALUES (
  $1,
  $2, -- ユーザーリクエスト
  jsonb_build_object(
    'type', 'execution_history',
    'decision', $3, -- AgentManagerDecision
    'results', $4,  -- ScreenResult[]
    'validation', $5, -- ValidationReport
    'timestamp', NOW()
  )
);
```

---

## 🎯 ユースケース例

### ケース1: シンプルなタスク

**ユーザーリクエスト**: "新規プロジェクトを作成"

```yaml
Agent Manager決定:
  layout: single
  assignments:
    - screenId: 1
      subtask: "新規プロジェクト作成"
      appId: projects
      worker: gemini (Clerk)

実行:
  Screen 1: Projects App起動 → create_project() → 完了

Check Agent検証:
  success: true
  summary: "プロジェクトを正常に作成しました"
```

### ケース2: 複合タスク(並列実行)

**ユーザーリクエスト**: "プロジェクト作成、カレンダー登録、売上目標設定"

```yaml
Agent Manager決定:
  layout: split-3
  assignments:
    - screenId: 1
      subtask: "プロジェクト作成"
      appId: projects
      worker: gemini
    - screenId: 2
      subtask: "カレンダー登録"
      appId: calendar
      worker: gemini
    - screenId: 3
      subtask: "売上目標設定"
      appId: revenue
      worker: gemini
  strategy: parallel

実行:
  Screen 1, 2, 3: 並列実行

Check Agent検証:
  success: true
  summary: "3つのタスクを正常に完了しました"
  suggestions:
    - "プロジェクトとカレンダーイベントを関連付けると便利です"
```

### ケース3: 依存関係のあるタスク(順次実行)

**ユーザーリクエスト**: "プロジェクト作成して、そのプロジェクトIDで売上を登録"

```yaml
Agent Manager決定:
  layout: split-2
  assignments:
    - screenId: 1
      subtask: "プロジェクト作成"
      appId: projects
      worker: gemini
      dependencies: []
    - screenId: 2
      subtask: "売上登録(プロジェクトID使用)"
      appId: revenue
      worker: gemini
      dependencies: ["1"]
  strategy: sequential

実行:
  Screen 1: Projects App → create_project() → projectId取得
  ↓ (依存関係により待機)
  Screen 2: Revenue App → create_revenue(projectId) → 完了

Check Agent検証:
  success: true
  summary: "プロジェクトと売上を正常に作成し、関連付けました"
```

---

## 🚀 段階的実装戦略

実装は3つのフェーズに分けて進めます。

### Phase 4.1: Agent Manager拡張
- 既存`orchestrator.ts`を拡張
- Screen管理機能を追加
- レイアウト決定ロジック実装

### Phase 4.2: Screen subAgents実装
- Screen subAgentクラス作成
- UI Controller実装
- 既存Workerとの統合

### Phase 4.3: Check Agent実装
- Check Agentクラス作成
- 検証ロジック実装
- レポート生成機能

詳細は別ドキュメント `implementation-plan-phase4.md` を参照。

---

## 📚 関連ドキュメント

- [実装計画 Phase 4](./implementation-plan-phase4.md) - 詳細な実装ステップ
- [エージェントシステム設計](./agent-system-design.md) - 既存Router-Worker設計
- [タスクリスト](./tasks.md) - 実装進捗管理

---

## 🎯 成功指標

### 機能指標
- ✅ 複数タスクの並列実行が可能
- ✅ スクリーン操作が視覚的に確認できる
- ✅ 最終検証により品質保証

### パフォーマンス指標
- タスク分解時間: < 2秒
- 並列実行効率: 80%以上
- 検証時間: < 1秒

### ユーザー体験指標
- タスク成功率: 95%以上
- ユーザー満足度: 4.5/5以上
