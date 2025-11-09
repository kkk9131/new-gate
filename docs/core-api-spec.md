# Core API仕様書

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **バージョン**: 1.0
- **対象**: プラグイン開発者向けCore API
- **目的**: プラグインから利用可能なプラットフォームAPIの完全仕様

---

## 🎯 概要

Core APIは、プラグインがプラットフォームの機能にアクセスするための統一されたインターフェースです。

### 利用方法

```typescript
import { usePluginContext } from '@platform/sdk/react';

function MyComponent() {
  const context = usePluginContext();

  // Core API利用
  const user = await context.auth.getCurrentUser();
  await context.storage.set('key', 'value');
  context.ui.showNotification('Hello!');
}
```

---

## 🔐 Auth API

ユーザー認証と権限管理を提供します。

### getCurrentUser()

現在ログイン中のユーザー情報を取得します。

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

const user: User = await context.auth.getCurrentUser();
```

### hasPermission(permission)

プラグインが特定の権限を持っているか確認します。

```typescript
const canWrite: boolean = context.auth.hasPermission('storage.write');

if (canWrite) {
  await context.storage.set('key', 'value');
}
```

---

## 💾 Storage API

プラグイン専用のデータストレージを提供します。

### set<T>(key, value)

データを保存します。

```typescript
interface UserPrefs {
  theme: 'light' | 'dark';
  language: string;
}

await context.storage.set<UserPrefs>('preferences', {
  theme: 'dark',
  language: 'ja'
});
```

### get<T>(key)

データを取得します。存在しない場合は`null`を返します。

```typescript
const prefs = await context.storage.get<UserPrefs>('preferences');

if (prefs) {
  console.log(prefs.theme); // 'dark'
}
```

### remove(key)

データを削除します。

```typescript
await context.storage.remove('preferences');
```

### clear()

プラグインのすべてのデータを削除します。

```typescript
await context.storage.clear();
```

### keys()

保存されているすべてのキーを取得します。

```typescript
const keys: string[] = await context.storage.keys();
// ['preferences', 'cache', 'user-data']
```

---

## 🎨 UI API

ユーザーインターフェース操作を提供します。

### registerWindow(config)

プラグインウィンドウを登録します。

```typescript
interface WindowConfig {
  id: string;
  title: string;
  render: (container: HTMLElement) => void;
  width?: number;
  height?: number;
  resizable?: boolean;
  maximizable?: boolean;
}

context.ui.registerWindow({
  id: 'main',
  title: 'My Plugin',
  render: (container) => {
    const root = createRoot(container);
    root.render(<App />);
  },
  width: 800,
  height: 600,
  resizable: true
});
```

### showNotification(message, type?)

通知を表示します。

```typescript
type NotificationType = 'info' | 'success' | 'warning' | 'error';

context.ui.showNotification('保存しました！', 'success');
context.ui.showNotification('エラーが発生しました', 'error');
```

### showDialog(options)

ダイアログを表示します。

```typescript
// 確認ダイアログ
const confirmed: boolean = await context.ui.showDialog({
  type: 'confirm',
  title: '確認',
  message: '本当に削除しますか？',
  confirmText: '削除',
  cancelText: 'キャンセル'
});

// 入力ダイアログ
const input: string | null = await context.ui.showDialog({
  type: 'prompt',
  title: '入力',
  message: '名前を入力してください',
  placeholder: 'プロジェクト名',
  defaultValue: '新しいプロジェクト'
});

// アラートダイアログ
await context.ui.showDialog({
  type: 'alert',
  title: 'お知らせ',
  message: '処理が完了しました'
});
```

### closeWindow()

現在のウィンドウを閉じます。

```typescript
context.ui.closeWindow();
```

### minimizeWindow()

現在のウィンドウを最小化します。

```typescript
context.ui.minimizeWindow();
```

### maximizeWindow()

現在のウィンドウを最大化します。

```typescript
context.ui.maximizeWindow();
```

---

## 🌐 HTTP API

HTTP通信を提供します。

### get<T>(url, options?)

GETリクエストを送信します。

```typescript
interface Project {
  id: string;
  name: string;
}

const projects: Project[] = await context.http.get('/api/projects');

// クエリパラメータ付き
const activeProjects = await context.http.get('/api/projects', {
  params: { status: 'active' }
});
```

### post<T>(url, data, options?)

POSTリクエストを送信します。

```typescript
const newProject = await context.http.post('/api/projects', {
  name: 'New Project',
  description: 'Project description'
});
```

### patch<T>(url, data, options?)

PATCHリクエストを送信します。

```typescript
const updated = await context.http.patch(`/api/projects/${id}`, {
  status: 'completed'
});
```

### delete<T>(url, options?)

DELETEリクエストを送信します。

```typescript
await context.http.delete(`/api/projects/${id}`);
```

### RequestOptions

```typescript
interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  timeout?: number;  // ms
}
```

---

## 🔌 Plugin Communication API

プラグイン間通信を提供します。

### send(pluginId, message)

他のプラグインにメッセージを送信します。

```typescript
await context.plugin.send('com.example.another-plugin', {
  action: 'refresh',
  data: { id: 123 }
});
```

### onMessage(callback)

他のプラグインからのメッセージを受信します。

```typescript
context.plugin.onMessage((message: any, sender: string) => {
  console.log(`${sender}からメッセージ:`, message);

  if (message.action === 'refresh') {
    refreshData(message.data.id);
  }
});
```

### call<T>(pluginId, method, params)

他のプラグインの公開APIを呼び出します。

```typescript
const result = await context.plugin.call<number>(
  'com.example.calculator',
  'sum',
  { numbers: [1, 2, 3, 4, 5] }
);

console.log(result); // 15
```

### getInfo(pluginId)

他のプラグインの情報を取得します。

```typescript
const info = await context.plugin.getInfo('com.example.another-plugin');

console.log(info.name);        // プラグイン名
console.log(info.version);     // バージョン
console.log(info.isInstalled); // インストール済みか
```

---

## 🤖 Agent API

エージェントタスク実行を提供します。

### executeTask(definition)

タスクを実行します。

```typescript
interface TaskDefinition {
  name: string;
  steps: TaskStep[];
}

const result = await context.agent.executeTask({
  name: 'データ集計',
  steps: [
    {
      id: 'fetch',
      action: 'plugin.call',
      plugin: 'com.platform.revenue',
      method: 'getRevenues',
      params: { startDate: '2025-01-01', endDate: '2025-01-31' },
      output: 'revenues'
    },
    {
      id: 'sum',
      action: 'transform',
      input: '{{ revenues }}',
      transform: 'sum',
      field: 'amount',
      output: 'total'
    }
  ]
});

console.log(result.get('total'));
```

### scheduleTask(taskId, cron)

定期実行タスクをスケジュールします。

```typescript
await context.agent.scheduleTask('monthly-report', '0 9 1 * *');
```

### cancelTask(taskId)

スケジュールされたタスクをキャンセルします。

```typescript
await context.agent.cancelTask('monthly-report');
```

### getExecutions(taskId, options?)

タスクの実行履歴を取得します。

```typescript
const executions = await context.agent.getExecutions('monthly-report', {
  limit: 10,
  offset: 0
});

executions.forEach(exec => {
  console.log(exec.status, exec.startedAt, exec.completedAt);
});
```

---

## 📊 Platform API

プラットフォーム情報を提供します。

### getVersion()

プラットフォームバージョンを取得します。

```typescript
const version: string = context.platform.getVersion();
// '1.0.0'
```

### getConfig()

プラットフォーム設定を取得します。

```typescript
const config = context.platform.getConfig();

console.log(config.apiUrl);      // API URL
console.log(config.environment); // 'development' | 'production'
```

---

## ⚠️ エラーハンドリング

すべてのAPI呼び出しは例外をスローする可能性があります。

### エラー型

```typescript
class PlatformError extends Error {
  code: string;
  details?: any;
}

// エラーコード一覧
enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
```

### エラーハンドリング例

```typescript
try {
  const data = await context.storage.get('key');
} catch (error) {
  if (error instanceof PlatformError) {
    switch (error.code) {
      case ErrorCode.PERMISSION_DENIED:
        context.ui.showNotification('権限がありません', 'error');
        break;

      case ErrorCode.NETWORK_ERROR:
        context.ui.showNotification('ネットワークエラー', 'error');
        break;

      default:
        context.ui.showNotification('エラーが発生しました', 'error');
    }
  }
}
```

---

## 🔒 権限システム

Core APIを使用するには、plugin.jsonで権限を宣言する必要があります。

```json
{
  "permissions": [
    "storage.read",
    "storage.write",
    "ui.window",
    "ui.notification",
    "ui.dialog",
    "network.http",
    "plugin.communication",
    "agent.execute"
  ]
}
```

### 権限一覧

| 権限 | 説明 | 必要なAPI |
|------|------|-----------|
| `storage.read` | ストレージ読み込み | `storage.get()`, `storage.keys()` |
| `storage.write` | ストレージ書き込み | `storage.set()`, `storage.remove()`, `storage.clear()` |
| `ui.window` | ウィンドウ操作 | `ui.registerWindow()`, `ui.closeWindow()` |
| `ui.notification` | 通知表示 | `ui.showNotification()` |
| `ui.dialog` | ダイアログ表示 | `ui.showDialog()` |
| `network.http` | HTTP通信 | `http.get()`, `http.post()`, `http.patch()`, `http.delete()` |
| `plugin.communication` | プラグイン間通信 | `plugin.send()`, `plugin.onMessage()`, `plugin.call()` |
| `agent.execute` | エージェント実行 | `agent.executeTask()`, `agent.scheduleTask()` |

---

## 📚 関連ドキュメント

- [プラグインアーキテクチャ](./plugin-architecture.md)
- [開発者ガイド](./developer-guide.md)
- [プラットフォーム要件定義](./platform-requirements.md)
