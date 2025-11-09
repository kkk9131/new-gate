# プラグイン開発者ガイド

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **対象読者**: プラグイン開発者
- **前提知識**: React, TypeScript, Next.js基礎
- **目的**: 初めてのプラグイン開発から公開まで完全サポート

---

## 🎯 このガイドで学べること

1. 開発環境のセットアップ
2. 初めてのプラグイン作成
3. Core APIの使い方
4. プラグイン間通信
5. テスト・デバッグ方法
6. ストアへの公開手順

---

## ⚙️ 開発環境セットアップ

### 必要なツール

```bash
# Node.js 18+ (推奨: 20 LTS)
node --version

# pnpm (推奨) または npm
pnpm --version
```

### Plugin CLIのインストール

```bash
# グローバルインストール
npm install -g @platform/cli

# バージョン確認
platform-cli --version
```

### 開発者アカウント登録

```bash
# プラットフォームにログイン
platform-cli login

# 開発者情報設定
platform-cli config set author.name "Your Name"
platform-cli config set author.email "you@example.com"
```

---

## 🚀 チュートリアル: 初めてのプラグイン作成

### Step 1: プロジェクト作成

```bash
# 新規プラグインプロジェクト作成
platform-cli create my-first-plugin

# テンプレート選択
? プラグインテンプレートを選択してください:
  > Basic Plugin (シンプルなプラグイン)
    Dashboard Plugin (ダッシュボード表示)
    Form Plugin (フォーム入力)
    Data Visualization (データ可視化)

# プロジェクトディレクトリに移動
cd my-first-plugin
```

### Step 2: プロジェクト構造確認

```
my-first-plugin/
├── plugin.json          # プラグイン情報
├── src/
│   ├── index.tsx        # エントリーポイント
│   ├── App.tsx          # メインコンポーネント
│   └── types.ts         # 型定義
├── assets/
│   └── icon.png         # アイコン
├── package.json
├── tsconfig.json
└── vite.config.ts       # Viteビルド設定
```

### Step 3: plugin.json編集

```json
{
  "id": "com.yourname.my-first-plugin",
  "name": "My First Plugin",
  "version": "1.0.0",
  "description": "私の最初のプラグイン",
  "author": {
    "name": "Your Name",
    "email": "you@example.com"
  },
  "category": "utility",
  "icon": "assets/icon.png",

  "main": "dist/index.js",
  "window": {
    "defaultWidth": 600,
    "defaultHeight": 400,
    "resizable": true
  },

  "permissions": [
    "storage.read",
    "storage.write",
    "ui.notification"
  ]
}
```

### Step 4: メインコンポーネント実装

```typescript
// src/App.tsx
import { useState } from 'react';
import { usePluginContext } from '@platform/sdk/react';

export default function App() {
  const context = usePluginContext();
  const [count, setCount] = useState(0);

  const handleSave = async () => {
    await context.storage.set('count', count);
    context.ui.showNotification('保存しました！', 'success');
  };

  const handleLoad = async () => {
    const savedCount = await context.storage.get<number>('count');
    if (savedCount !== null) {
      setCount(savedCount);
      context.ui.showNotification('読み込みました！', 'info');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">カウンター</h1>

      <div className="mb-4">
        <p className="text-lg">カウント: {count}</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          +1
        </button>

        <button
          onClick={() => setCount(count - 1)}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          -1
        </button>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          保存
        </button>

        <button
          onClick={handleLoad}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          読み込み
        </button>
      </div>
    </div>
  );
}
```

```typescript
// src/index.tsx
import { Plugin, PluginContext } from '@platform/sdk';
import { createRoot } from 'react-dom/client';
import App from './App';

export default class MyFirstPlugin extends Plugin {
  async onActivate(context: PluginContext) {
    // ウィンドウ登録
    context.ui.registerWindow({
      id: 'main',
      title: 'My First Plugin',
      render: (container) => {
        const root = createRoot(container);
        root.render(<App />);
      }
    });
  }

  async onDeactivate() {
    console.log('Plugin deactivated');
  }
}
```

### Step 5: 開発サーバー起動

```bash
# 開発モードで起動
pnpm dev

# ブラウザで http://localhost:3000 を開く
# プラットフォームが起動し、プラグインが自動的にロードされる
```

### Step 6: ビルド

```bash
# 本番用ビルド
pnpm build

# dist/フォルダに出力される
```

---

## 📚 Core API使用例

### 1. Storage API（データ保存）

```typescript
import { usePluginContext } from '@platform/sdk/react';

function MyComponent() {
  const context = usePluginContext();

  // データ保存
  const saveData = async () => {
    await context.storage.set('user-preferences', {
      theme: 'dark',
      language: 'ja'
    });
  };

  // データ読み込み
  const loadData = async () => {
    const prefs = await context.storage.get<{
      theme: string;
      language: string;
    }>('user-preferences');

    console.log(prefs?.theme); // 'dark'
  };

  // データ削除
  const deleteData = async () => {
    await context.storage.remove('user-preferences');
  };

  return (
    <div>
      <button onClick={saveData}>保存</button>
      <button onClick={loadData}>読み込み</button>
      <button onClick={deleteData}>削除</button>
    </div>
  );
}
```

### 2. UI API（通知・ダイアログ）

```typescript
// 通知表示
context.ui.showNotification('処理が完了しました', 'success');
context.ui.showNotification('エラーが発生しました', 'error');

// 確認ダイアログ
const confirmed = await context.ui.showDialog({
  title: '確認',
  message: '本当に削除しますか？',
  type: 'confirm',
  confirmText: '削除',
  cancelText: 'キャンセル'
});

if (confirmed) {
  // 削除処理
}

// 入力ダイアログ
const input = await context.ui.showDialog({
  title: '名前を入力',
  message: 'プロジェクト名を入力してください',
  type: 'prompt',
  placeholder: '新しいプロジェクト'
});

console.log(input); // ユーザーの入力値
```

### 3. HTTP API（外部API呼び出し）

```typescript
// GET リクエスト
const projects = await context.http.get('/api/projects');

// POST リクエスト
const newProject = await context.http.post('/api/projects', {
  name: 'New Project',
  description: 'プロジェクトの説明'
});

// PATCH リクエスト
const updated = await context.http.patch(`/api/projects/${id}`, {
  status: 'completed'
});

// DELETE リクエスト
await context.http.delete(`/api/projects/${id}`);
```

### 4. Auth API（認証情報）

```typescript
// 現在のユーザー取得
const user = await context.auth.getCurrentUser();
console.log(user.id, user.email);

// 権限チェック
if (context.auth.hasPermission('storage.write')) {
  // ストレージ書き込み可能
}
```

### 5. Plugin Communication API（プラグイン間通信）

```typescript
// 他のプラグインにメッセージ送信
await context.plugin.send('com.example.another-plugin', {
  action: 'refresh',
  data: { id: 123 }
});

// メッセージ受信
context.plugin.onMessage((message, sender) => {
  console.log(`${sender}からメッセージ:`, message);

  if (message.action === 'refresh') {
    refreshData(message.data.id);
  }
});

// 他のプラグインのAPIを呼び出し
const result = await context.plugin.call(
  'com.example.another-plugin',
  'calculateTotal',
  { items: [1, 2, 3] }
);
```

---

## 🧪 テスト

### ユニットテスト

```typescript
// src/App.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { createMockContext } from '@platform/sdk/testing';
import { PluginContextProvider } from '@platform/sdk/react';
import App from './App';

describe('App', () => {
  it('カウンターが動作する', () => {
    const context = createMockContext();

    render(
      <PluginContextProvider value={context}>
        <App />
      </PluginContextProvider>
    );

    const incrementButton = screen.getByText('+1');
    fireEvent.click(incrementButton);

    expect(screen.getByText('カウント: 1')).toBeInTheDocument();
  });

  it('データを保存できる', async () => {
    const context = createMockContext();

    render(
      <PluginContextProvider value={context}>
        <App />
      </PluginContextProvider>
    );

    const saveButton = screen.getByText('保存');
    fireEvent.click(saveButton);

    // Storage APIがモック実装で呼ばれたことを確認
    expect(context.storage.set).toHaveBeenCalledWith('count', 0);
  });
});
```

### テスト実行

```bash
# テスト実行
pnpm test

# カバレッジ付きテスト
pnpm test:coverage
```

---

## 🐛 デバッグ

### ローカルデバッグ

```bash
# 開発モードで起動（ホットリロード有効）
pnpm dev

# ブラウザの開発者ツールを開く（F12）
# Consoleタブでログ確認
```

### ログ出力

```typescript
// 通常のログ
console.log('プラグイン起動');

// デバッグログ（開発時のみ表示）
if (process.env.NODE_ENV === 'development') {
  console.debug('デバッグ情報:', data);
}

// エラーログ
console.error('エラーが発生しました:', error);
```

### Platform CLIデバッグモード

```bash
# デバッグログ付きで起動
platform-cli dev --debug

# 詳細ログ表示
platform-cli dev --verbose
```

---

## 📦 ストアへの公開

### Step 1: リリース準備

```bash
# バージョンアップ
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

### Step 2: アイコン・スクリーンショット準備

```yaml
必須:
  - icon.png: 80x80px, PNG形式
  - screenshot1.png: 800x600px推奨

オプション:
  - screenshot2.png
  - screenshot3.png
  - README.md: 詳細説明
```

### Step 3: ビルド

```bash
# 本番用ビルド
pnpm build

# ビルド成果物確認
ls dist/
```

### Step 4: 公開

```bash
# プラグインを公開
platform-cli publish

# 公開情報入力
? プラグインカテゴリ: utility
? 価格設定: 無料
? 公開範囲: すべてのユーザー
```

### Step 5: レビュー待ち

```
公開申請が完了しました！

審査には通常1-3営業日かかります。
審査状況は以下で確認できます:
https://platform.example.com/developer/plugins/your-plugin-id

審査完了後、ストアに掲載されます。
```

---

## 🎨 ベストプラクティス

### UIデザイン

```yaml
推奨:
  - TailwindCSSを使用
  - プラットフォームのデザインシステムに準拠
  - レスポンシブ対応
  - アクセシビリティ考慮（ARIA属性、キーボード操作）

非推奨:
  - インラインスタイル多用
  - プラットフォームと異なるフォント
  - 過度なアニメーション
```

### パフォーマンス

```yaml
最適化:
  - 遅延ロード（React.lazy）
  - メモ化（useMemo, useCallback）
  - 仮想スクロール（大量データ表示時）
  - 画像最適化（WebP, 圧縮）

避けるべき:
  - 不要なレンダリング
  - 巨大なバンドルサイズ（500KB超）
  - 重い計算処理（メインスレッド）
```

### セキュリティ

```yaml
守るべきこと:
  - ユーザー入力のサニタイズ
  - XSS対策（dangerouslySetInnerHTML使用禁止）
  - 機密情報をコードに含めない
  - 外部ライブラリは最新版を使用

禁止事項:
  - eval()使用
  - ユーザーデータの外部送信（明示的許可なし）
  - 悪意のあるコード
```

---

## 🔧 トラブルシューティング

### よくある問題

#### 1. プラグインが読み込まれない

```bash
# plugin.jsonの構文エラーをチェック
cat plugin.json | jq .

# ビルドエラー確認
pnpm build --verbose
```

#### 2. 権限エラー

```json
// plugin.jsonに必要な権限を追加
{
  "permissions": [
    "storage.read",
    "storage.write",
    "ui.notification"
  ]
}
```

#### 3. Core APIが使えない

```typescript
// @platform/sdkのバージョン確認
npm list @platform/sdk

// 最新版にアップデート
npm install @platform/sdk@latest
```

---

## 📖 参考資料

### 公式ドキュメント
- [プラグインアーキテクチャ](./plugin-architecture.md)
- [Core API仕様](./core-api-spec.md)
- [プラットフォーム要件](./platform-requirements.md)

### コミュニティ
- Discord: https://discord.gg/platform
- GitHub: https://github.com/platform/plugins
- フォーラム: https://forum.platform.example.com

### サンプルプラグイン
- [カウンターアプリ](https://github.com/platform/examples/counter)
- [TODOリスト](https://github.com/platform/examples/todo)
- [データビジュアライゼーション](https://github.com/platform/examples/charts)

---

## 🚀 次のステップ

1. **サンプルプラグインを試す**: 公式サンプルをクローンして動かしてみる
2. **Core APIを学ぶ**: [Core API仕様](./core-api-spec.md)を読む
3. **コミュニティに参加**: Discordで質問・情報交換
4. **自分のプラグインを作る**: アイデアを形にする
5. **ストアに公開**: 世界中のユーザーに使ってもらう

頑張ってください！ 🎉
