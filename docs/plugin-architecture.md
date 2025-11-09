# プラグインアーキテクチャ設計書

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **バージョン**: 1.0
- **対象**: プラグインシステム設計
- **目的**: 拡張可能で安全なプラグインアーキテクチャの定義

---

## 🎯 設計思想

### コアコンセプト

```yaml
安全性:
  - サンドボックス実行環境
  - 明示的な権限システム
  - コード検証・セキュリティスキャン

拡張性:
  - プラグイン間通信API
  - Core APIへのアクセス
  - カスタムUIコンポーネント

開発者体験:
  - シンプルなAPI設計
  - 豊富なドキュメント
  - ローカルデバッグ環境
```

---

## 🏗️ プラグイン構造

### ディレクトリ構成

```
my-plugin/
├── plugin.json          # プラグインマニフェスト
├── src/
│   ├── index.tsx        # エントリーポイント
│   ├── components/      # Reactコンポーネント
│   ├── api/             # API呼び出しロジック
│   ├── hooks/           # カスタムフック
│   └── utils/           # ユーティリティ
├── assets/
│   ├── icon.png         # プラグインアイコン（80x80px）
│   └── screenshot.png   # スクリーンショット
├── README.md            # プラグイン説明
└── package.json         # 依存関係
```

### plugin.json（マニフェスト）

```json
{
  "id": "com.example.my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "プラグインの説明",
  "author": {
    "name": "開発者名",
    "email": "dev@example.com",
    "url": "https://example.com"
  },
  "category": "business",
  "icon": "assets/icon.png",
  "screenshots": ["assets/screenshot.png"],

  "main": "dist/index.js",
  "window": {
    "defaultWidth": 800,
    "defaultHeight": 600,
    "minWidth": 400,
    "minHeight": 300,
    "resizable": true,
    "maximizable": true
  },

  "permissions": [
    "storage.read",
    "storage.write",
    "ui.notification"
  ],

  "dependencies": {
    "@platform/sdk": "^1.0.0"
  },

  "api": {
    "endpoints": [
      {
        "method": "GET",
        "path": "/my-plugin/data",
        "description": "データ取得"
      }
    ]
  }
}
```

### エントリーポイント（index.tsx）

```typescript
import { Plugin, PluginContext } from '@platform/sdk';

export default class MyPlugin extends Plugin {
  // プラグイン初期化
  async onActivate(context: PluginContext) {
    console.log('Plugin activated!');

    // Core API利用
    const user = await context.auth.getCurrentUser();
    const data = await context.storage.get('my-data');

    // UI登録
    context.ui.registerWindow({
      component: MainWindow,
      title: 'My Plugin',
    });
  }

  // プラグイン終了
  async onDeactivate() {
    console.log('Plugin deactivated!');
  }
}

// メインウィンドウコンポーネント
function MainWindow({ context }: { context: PluginContext }) {
  return (
    <div className="p-4">
      <h1>My Plugin</h1>
      <button onClick={() => context.ui.showNotification('Hello!')}>
        通知を表示
      </button>
    </div>
  );
}
```

---

## 🔌 Plugin SDK

### Core API

#### 1. Auth API（認証）

```typescript
interface AuthAPI {
  // 現在のユーザー取得
  getCurrentUser(): Promise<User>;

  // ユーザー権限チェック
  hasPermission(permission: string): boolean;
}

// 使用例
const user = await context.auth.getCurrentUser();
console.log(user.id, user.email);
```

#### 2. Storage API（データ保存）

```typescript
interface StorageAPI {
  // データ取得
  get<T>(key: string): Promise<T | null>;

  // データ保存
  set<T>(key: string, value: T): Promise<void>;

  // データ削除
  remove(key: string): Promise<void>;

  // 全データクリア
  clear(): Promise<void>;
}

// 使用例
await context.storage.set('user-prefs', { theme: 'dark' });
const prefs = await context.storage.get<{ theme: string }>('user-prefs');
```

#### 3. UI API（UIコントロール）

```typescript
interface UIAPI {
  // ウィンドウ登録
  registerWindow(config: WindowConfig): void;

  // 通知表示
  showNotification(message: string, type?: 'info' | 'success' | 'warning' | 'error'): void;

  // ダイアログ表示
  showDialog(options: DialogOptions): Promise<boolean>;

  // ウィンドウ操作
  closeWindow(): void;
  minimizeWindow(): void;
  maximizeWindow(): void;
}

// 使用例
context.ui.showNotification('保存しました！', 'success');

const confirmed = await context.ui.showDialog({
  title: '確認',
  message: '本当に削除しますか？',
  type: 'confirm',
});
```

#### 4. HTTP API（外部API呼び出し）

```typescript
interface HttpAPI {
  // HTTP GET
  get<T>(url: string, options?: RequestOptions): Promise<T>;

  // HTTP POST
  post<T>(url: string, data: any, options?: RequestOptions): Promise<T>;

  // HTTP PATCH
  patch<T>(url: string, data: any, options?: RequestOptions): Promise<T>;

  // HTTP DELETE
  delete<T>(url: string, options?: RequestOptions): Promise<T>;
}

// 使用例
const data = await context.http.get('/api/projects');
```

#### 5. Plugin Communication API（プラグイン間通信）

```typescript
interface PluginCommAPI {
  // 他プラグインにメッセージ送信
  send(pluginId: string, message: any): Promise<void>;

  // メッセージ受信リスナー登録
  onMessage(callback: (message: any, sender: string) => void): void;

  // 他プラグインのAPIを呼び出し
  call<T>(pluginId: string, method: string, params: any): Promise<T>;
}

// 使用例
// プラグインAからプラグインBへメッセージ送信
await context.plugin.send('com.example.plugin-b', {
  action: 'refresh',
  data: { id: 123 }
});

// プラグインBでメッセージ受信
context.plugin.onMessage((message, sender) => {
  if (message.action === 'refresh') {
    refreshData(message.data.id);
  }
});
```

#### 6. Agent API（エージェント実行）

```typescript
interface AgentAPI {
  // タスク実行
  executeTask(taskDefinition: TaskDefinition): Promise<TaskResult>;

  // スケジュール設定
  scheduleTask(taskId: string, cron: string): Promise<void>;

  // タスクキャンセル
  cancelTask(taskId: string): Promise<void>;
}

// 使用例
const result = await context.agent.executeTask({
  name: 'データ集計',
  steps: [
    { action: 'fetch', target: '/api/revenues' },
    { action: 'aggregate', method: 'sum' },
    { action: 'notify', message: '集計完了' }
  ]
});
```

---

## 🛡️ 権限システム

### 権限タイプ

```typescript
enum Permission {
  // ストレージ
  STORAGE_READ = 'storage.read',
  STORAGE_WRITE = 'storage.write',

  // UI操作
  UI_WINDOW = 'ui.window',
  UI_NOTIFICATION = 'ui.notification',
  UI_DIALOG = 'ui.dialog',

  // ネットワーク
  NETWORK_HTTP = 'network.http',
  NETWORK_WEBSOCKET = 'network.websocket',

  // プラグイン間通信
  PLUGIN_COMMUNICATION = 'plugin.communication',

  // エージェント実行
  AGENT_EXECUTE = 'agent.execute',

  // システム（管理者のみ）
  SYSTEM_ADMIN = 'system.admin',
}
```

### 権限リクエストフロー

```
1. プラグインがplugin.jsonで必要な権限を宣言
   ↓
2. ユーザーがインストール時に権限を確認
   ↓
3. ユーザーが承認
   ↓
4. プラグイン実行時に権限チェック
   ↓
5. 権限がない場合はエラー
```

### 権限チェック実装例

```typescript
// プラグイン内での権限チェック
async function saveData(context: PluginContext, data: any) {
  if (!context.auth.hasPermission('storage.write')) {
    throw new Error('ストレージ書き込み権限がありません');
  }

  await context.storage.set('my-data', data);
}
```

---

## 🔒 サンドボックス実行

### 実行環境

プラグインは**iframe + Web Worker**のサンドボックス環境で実行される。

```typescript
// プラグインローダー（プラットフォーム側）
class PluginLoader {
  async loadPlugin(pluginId: string) {
    // 1. プラグインマニフェスト読み込み
    const manifest = await this.fetchManifest(pluginId);

    // 2. 権限チェック
    const hasPermissions = await this.checkPermissions(manifest.permissions);
    if (!hasPermissions) {
      throw new Error('権限が不足しています');
    }

    // 3. サンドボックス作成
    const sandbox = this.createSandbox(pluginId);

    // 4. プラグインコード読み込み
    const code = await this.fetchPluginCode(manifest.main);

    // 5. サンドボックス内で実行
    sandbox.execute(code);
  }

  private createSandbox(pluginId: string): Sandbox {
    // iframeまたはWeb Workerでサンドボックス作成
    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-scripts';
    iframe.src = `/sandbox/${pluginId}`;

    return new Sandbox(iframe);
  }
}
```

### セキュリティ制約

```yaml
制限事項:
  - DOM直接操作禁止（ReactコンポーネントのみOK）
  - グローバル変数アクセス禁止
  - eval() 使用禁止
  - localStorage直接アクセス禁止（Storage API経由のみ）
  - 外部スクリプト読み込み禁止
  - クッキー操作禁止
```

---

## 📦 プラグインライフサイクル

### 状態遷移

```
NOT_INSTALLED
    ↓ インストール
INSTALLED
    ↓ 有効化
ACTIVATED
    ↓ 一時停止
DEACTIVATED
    ↓ 有効化
ACTIVATED
    ↓ アンインストール
UNINSTALLING
    ↓
NOT_INSTALLED
```

### ライフサイクルフック

```typescript
export default class MyPlugin extends Plugin {
  // インストール時（初回のみ）
  async onInstall() {
    console.log('プラグインがインストールされました');
    // 初期データセットアップ
  }

  // 有効化時（毎回）
  async onActivate(context: PluginContext) {
    console.log('プラグインが有効化されました');
    // UI登録、イベントリスナー設定
  }

  // 無効化時
  async onDeactivate() {
    console.log('プラグインが無効化されました');
    // クリーンアップ処理
  }

  // アンインストール時（最後）
  async onUninstall() {
    console.log('プラグインがアンインストールされました');
    // データ削除
  }
}
```

---

## 🔄 プラグイン間通信

### メッセージングAPI

```typescript
// プラグインA（送信側）
await context.plugin.send('com.example.plugin-b', {
  type: 'PROJECT_CREATED',
  payload: { projectId: '123', name: 'New Project' }
});

// プラグインB（受信側）
context.plugin.onMessage((message, sender) => {
  if (message.type === 'PROJECT_CREATED') {
    console.log(`プロジェクト作成: ${message.payload.name}`);
    // プラグインBの処理を実行
  }
});
```

### 共有データストア

```typescript
// プラグインAがデータを保存
await context.storage.set('shared:project-123', {
  id: '123',
  name: 'Shared Project',
  sharedWith: ['com.example.plugin-b']
});

// プラグインBがデータを取得
const project = await context.storage.get('shared:project-123');
```

---

## 🧪 テスト環境

### ローカル開発モード

```bash
# プラグイン開発CLI
npx @platform/cli dev

# ローカルサーバー起動 (http://localhost:5173)
# プラットフォームにプラグインを自動ロード
# ホットリロード対応
```

### テストフレームワーク

```typescript
import { describe, it, expect } from 'vitest';
import { createMockContext } from '@platform/sdk/testing';

describe('MyPlugin', () => {
  it('should save data correctly', async () => {
    const context = createMockContext();
    const plugin = new MyPlugin();

    await plugin.onActivate(context);
    await context.storage.set('test-key', 'test-value');

    const value = await context.storage.get('test-key');
    expect(value).toBe('test-value');
  });
});
```

---

## 📊 プラグインストア公開

### 公開フロー

```
1. プラグインコード完成
   ↓
2. `npx @platform/cli build` でビルド
   ↓
3. `npx @platform/cli publish` で公開申請
   ↓
4. セキュリティスキャン実行
   ↓
5. プラットフォームチームによるレビュー
   ↓
6. 承認されたらストアに掲載
```

### セキュリティスキャン項目

```yaml
自動チェック:
  - 悪意のあるコード検出
  - 未承認の権限使用
  - 外部スクリプト読み込み
  - eval() 使用
  - プロトタイプ汚染
  - XSS脆弱性

手動レビュー:
  - プラグイン説明の妥当性
  - アイコン・スクリーンショットの適切性
  - ユーザー体験の品質
```

---

## 🛠️ 開発ツール

### Plugin CLI

```bash
# 新規プラグイン作成
npx @platform/cli create my-plugin

# 開発サーバー起動
npx @platform/cli dev

# ビルド
npx @platform/cli build

# テスト実行
npx @platform/cli test

# 公開
npx @platform/cli publish
```

### Plugin SDKパッケージ

```json
{
  "name": "@platform/sdk",
  "version": "1.0.0",
  "exports": {
    ".": "./dist/index.js",
    "./testing": "./dist/testing.js"
  }
}
```

---

## 📚 関連ドキュメント

- [プラットフォーム要件定義](./platform-requirements.md)
- [開発者ガイド](./developer-guide.md)
- [Core API仕様](./core-api-spec.md)
- [プラグインストア設計](./plugin-store-design.md)
- [データベーススキーマ](./database-schema.md)

---

## 🔄 バージョニング

### プラグインバージョン管理

```yaml
セマンティックバージョニング:
  MAJOR.MINOR.PATCH

  MAJOR: 破壊的変更（互換性なし）
  MINOR: 機能追加（後方互換性あり）
  PATCH: バグ修正（後方互換性あり）

例:
  1.0.0 → 初回リリース
  1.1.0 → 新機能追加
  1.1.1 → バグ修正
  2.0.0 → 破壊的変更
```

### 自動更新

```typescript
// プラットフォーム側で自動更新チェック
async function checkPluginUpdates() {
  const installedPlugins = await getInstalledPlugins();

  for (const plugin of installedPlugins) {
    const latestVersion = await fetchLatestVersion(plugin.id);

    if (isNewerVersion(latestVersion, plugin.version)) {
      // ユーザーに更新通知
      notifyUpdate(plugin, latestVersion);
    }
  }
}
```
