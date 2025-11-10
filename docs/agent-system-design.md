# エージェントシステム設計書

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **バージョン**: 1.0
- **対象**: AIエージェント自動化システム
- **目的**: タスクの自動化とワークフロー実行の設計

---

## 🎯 システム概要

AIエージェントシステムは、**繰り返し作業の自動化**と**複数プラグインを横断したタスク実行**を実現します。

### コアコンセプト

```yaml
自動化:
  - 定期実行（cron形式スケジュール）
  - イベントトリガー実行
  - 手動実行

ワークフロー:
  - 複数ステップの連鎖実行
  - 条件分岐・ループ
  - エラーハンドリング・リトライ

プラグイン連携:
  - 複数プラグインAPI呼び出し
  - データ受け渡し
  - 結果集約
```

---

## 🏗️ アーキテクチャ

### システム構成

```
┌──────────────────────────────────────┐
│     Task Scheduler (Cron Engine)     │
│  - 定期実行管理                      │
│  - イベントリスナー                  │
└──────────┬───────────────────────────┘
           │
┌──────────▼───────────────────────────┐
│    Workflow Executor Engine          │
│  - YAML/JSON解析                     │
│  - ステップ実行                      │
│  - 条件分岐処理                      │
│  - エラーハンドリング                │
└──────────┬───────────────────────────┘
           │
┌──────────▼───────────────────────────┐
│      Plugin API Caller               │
│  - プラグインAPI呼び出し             │
│  - Core API呼び出し                  │
│  - レスポンス処理                    │
└──────────┬───────────────────────────┘
           │
┌──────────▼───────────────────────────┐
│       Task History Storage           │
│  - 実行ログ保存                      │
│  - 成功/失敗記録                     │
│  - パフォーマンスメトリクス          │
└──────────────────────────────────────┘
```

---

## 📝 タスク定義

### YAML形式

```yaml
# task-definition.yaml
name: "月次売上レポート自動生成"
description: "毎月1日に先月の売上レポートを生成してメール送信"

schedule:
  cron: "0 9 1 * *"  # 毎月1日 9:00
  timezone: "Asia/Tokyo"

workflow:
  steps:
    - id: "fetch-revenues"
      action: "plugin.call"
      plugin: "com.platform.revenue"
      method: "getRevenues"
      params:
        startDate: "{{ lastMonth.start }}"
        endDate: "{{ lastMonth.end }}"
      output: "revenues"

    - id: "aggregate-data"
      action: "transform"
      input: "{{ revenues }}"
      transform: "sum"
      field: "amount"
      output: "total"

    - id: "generate-pdf"
      action: "plugin.call"
      plugin: "com.platform.pdf-generator"
      method: "createReport"
      params:
        template: "monthly-revenue"
        data:
          total: "{{ total }}"
          revenues: "{{ revenues }}"
      output: "pdfUrl"

    - id: "send-email"
      action: "plugin.call"
      plugin: "com.platform.email"
      method: "send"
      params:
        to: "manager@example.com"
        subject: "月次売上レポート"
        body: "先月の売上レポートを添付します"
        attachments:
          - "{{ pdfUrl }}"

    - id: "notify-completion"
      action: "ui.notification"
      params:
        message: "月次レポートを送信しました"
        type: "success"

  onError:
    - action: "ui.notification"
      params:
        message: "レポート生成に失敗しました: {{ error.message }}"
        type: "error"

    - action: "plugin.call"
      plugin: "com.platform.logger"
      method: "logError"
      params:
        error: "{{ error }}"
```

### JSON形式

```json
{
  "name": "プロジェクト期限アラート",
  "description": "期限が3日以内のプロジェクトを通知",
  "schedule": {
    "cron": "0 18 * * *",
    "timezone": "Asia/Tokyo"
  },
  "workflow": {
    "steps": [
      {
        "id": "fetch-projects",
        "action": "plugin.call",
        "plugin": "com.platform.projects",
        "method": "getActiveProjects",
        "output": "projects"
      },
      {
        "id": "filter-due-soon",
        "action": "filter",
        "input": "{{ projects }}",
        "condition": "item.dueDate <= Date.now() + 3 * 24 * 60 * 60 * 1000",
        "output": "dueSoonProjects"
      },
      {
        "id": "send-slack-alert",
        "action": "plugin.call",
        "plugin": "com.platform.slack",
        "method": "postMessage",
        "params": {
          "channel": "#alerts",
          "text": "期限が近いプロジェクト: {{ dueSoonProjects.length }}件"
        },
        "condition": "dueSoonProjects.length > 0"
      }
    ]
  }
}
```

---

## ⚙️ 実行エンジン

### Workflow Executor

```typescript
class WorkflowExecutor {
  async execute(workflow: Workflow, context: ExecutionContext) {
    const results = new Map<string, any>();

    for (const step of workflow.steps) {
      try {
        // 条件チェック
        if (step.condition && !this.evaluateCondition(step.condition, results)) {
          continue;
        }

        // ステップ実行
        const result = await this.executeStep(step, results, context);

        // 結果保存
        if (step.output) {
          results.set(step.output, result);
        }

        // ログ記録
        await this.logStepSuccess(step.id, result);

      } catch (error) {
        // エラーハンドリング
        await this.logStepError(step.id, error);

        if (workflow.onError) {
          await this.executeErrorHandler(workflow.onError, error);
        }

        // リトライロジック
        if (step.retry) {
          await this.retryStep(step, results, context);
        } else {
          throw error;
        }
      }
    }

    return results;
  }

  private async executeStep(
    step: WorkflowStep,
    results: Map<string, any>,
    context: ExecutionContext
  ) {
    switch (step.action) {
      case 'plugin.call':
        return await this.callPluginAPI(step, results);

      case 'transform':
        return await this.transformData(step, results);

      case 'filter':
        return await this.filterData(step, results);

      case 'ui.notification':
        return await this.showNotification(step, results);

      default:
        throw new Error(`Unknown action: ${step.action}`);
    }
  }

  private async callPluginAPI(step: PluginCallStep, results: Map<string, any>) {
    const plugin = await this.loadPlugin(step.plugin);
    const params = this.resolveVariables(step.params, results);

    return await plugin[step.method](params);
  }

  private resolveVariables(template: any, results: Map<string, any>): any {
    // {{ variable }} を実際の値に置換
    const json = JSON.stringify(template);
    const resolved = json.replace(/\{\{\s*(\w+(?:\.\w+)*)\s*\}\}/g, (_, path) => {
      return this.getNestedValue(results, path);
    });
    return JSON.parse(resolved);
  }
}
```

---

## 🕒 スケジューラー

### Cron形式スケジュール

```typescript
class TaskScheduler {
  private scheduler: CronScheduler;
  private tasks: Map<string, ScheduledTask> = new Map();

  async scheduleTask(taskId: string, cronExpression: string, workflow: Workflow) {
    const job = this.scheduler.schedule(cronExpression, async () => {
      await this.executeTask(taskId, workflow);
    });

    this.tasks.set(taskId, {
      id: taskId,
      cron: cronExpression,
      workflow,
      job,
      lastRun: null,
      nextRun: job.nextDate(),
    });
  }

  async executeTask(taskId: string, workflow: Workflow) {
    const execution = await this.createExecution(taskId);

    try {
      const executor = new WorkflowExecutor();
      const results = await executor.execute(workflow, {
        executionId: execution.id,
      });

      await this.markExecutionSuccess(execution.id, results);
    } catch (error) {
      await this.markExecutionFailure(execution.id, error);
    }
  }

  cancelTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      task.job.cancel();
      this.tasks.delete(taskId);
    }
  }
}
```

---

## 📊 実行履歴管理

### データベーススキーマ

```sql
-- タスク定義
CREATE TABLE agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  name VARCHAR(255) NOT NULL,
  description TEXT,

  workflow JSONB NOT NULL,
  schedule JSONB,  -- { cron, timezone }

  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 実行履歴
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,

  status VARCHAR(20) NOT NULL,  -- running, success, failed
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  results JSONB,
  error_message TEXT,

  execution_time_ms INT
);

-- ステップログ
CREATE TABLE agent_step_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES agent_executions(id) ON DELETE CASCADE,

  step_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL,

  input JSONB,
  output JSONB,
  error_message TEXT,

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  execution_time_ms INT
);
```

---

## 🎨 UI設計

### タスク一覧画面

```
┌────────────────────────────────────────────────┐
│  エージェントタスク                [+ 新規作成] │
├────────────────────────────────────────────────┤
│  [アクティブ] [停止中] [すべて]                │
│                                                │
│  ✅ 月次売上レポート自動生成                   │
│     毎月1日 9:00 | 最終実行: 2025-11-01        │
│     [編集] [実行] [停止]                       │
│                                                │
│  ✅ プロジェクト期限アラート                   │
│     毎日 18:00 | 最終実行: 2025-11-08          │
│     [編集] [実行] [停止]                       │
│                                                │
│  ⏸️ データバックアップ                         │
│     毎週日曜 2:00 | 停止中                     │
│     [編集] [開始]                              │
│                                                │
└────────────────────────────────────────────────┘
```

### 実行履歴画面

```
┌────────────────────────────────────────────────┐
│  実行履歴 - 月次売上レポート自動生成           │
├────────────────────────────────────────────────┤
│  ✅ 2025-11-01 09:00  成功  実行時間: 3.2s    │
│  ✅ 2025-10-01 09:00  成功  実行時間: 2.8s    │
│  ❌ 2025-09-01 09:00  失敗  エラー: API timeout│
│  ✅ 2025-08-01 09:00  成功  実行時間: 3.1s    │
│                                                │
│  [詳細を表示]                                  │
└────────────────────────────────────────────────┘
```

---

## 🔧 API仕様

```typescript
// タスク作成
POST /api/agents/tasks
{
  "name": "タスク名",
  "workflow": { ... },
  "schedule": { "cron": "0 9 * * *" }
}

// タスク一覧取得
GET /api/agents/tasks

// タスク実行
POST /api/agents/tasks/:taskId/execute

// タスク停止
POST /api/agents/tasks/:taskId/pause

// 実行履歴取得
GET /api/agents/tasks/:taskId/executions

// ログ取得
GET /api/agents/executions/:executionId/logs
```

---

## 📚 関連ドキュメント

- [プラットフォーム要件定義](./platform-requirements.md)
- [プラグインアーキテクチャ](./plugin-architecture.md)
- [Core API仕様](./core-api-spec.md)
- [データベーススキーマ](./database-schema.md)
