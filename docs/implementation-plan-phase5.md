# Phase 5: Plugin-Agent Integration (プラグイン・エージェント統合) 実装計画

## 概要
Phase 5では、Phase 2で構築した「プラグイン基盤」とPhase 4で構築した「ハイブリッドエージェント」を統合します。
これにより、サードパーティ開発者が作成したプラグインをインストールするだけで、エージェントがその機能を「ツール」として認識し、利用できるようになります。
これは「ユーザーに合わせて無限に進化するSaaS」というビジョンを実現するための核心的なフェーズです。

## 目標
1.  **動的ツール読み込み**: インストール済みプラグインからツール定義 (`ai-tools.json`) を動的に読み込む。
2.  **サンドボックス実行**: エージェントからのツール呼び出しを、セキュアなサンドボックス環境経由でプラグインAPIにルーティングする。
3.  **E2E検証**: サンプルプラグインを作成し、エージェントがそれを操作できることを確認する。

## 実装ステップ

### 5.1 Plugin Tool Definition (Layer 1)
プラグインがツールを定義するための仕組みを実装します。

- [ ] **DBスキーマ拡張**
  - `plugins` テーブルに `tools` カラム (JSONB) を追加（または `ai-tools.json` の内容を保存する別テーブル）。
  - 今回はシンプルに `plugins` テーブルに `tools_definition` カラムを追加する方針とする。
- [ ] **Manifest拡張**
  - プラグインの `manifest.json` (または `ai-tools.json`) のパース処理を実装。
  - プラグイン公開/更新API (`api/store/plugins`) でツール定義を受け取り、DBに保存する処理を追加。

### 5.2 Dynamic Tool Registry (Layer 2)
Agent Managerが動的にツールを取得・統合するロジックを実装します。

- [ ] **Tool Loader実装**
  - `lib/agent/tool-loader.ts` を作成。
  - `getAvailableTools(userId)`: ユーザーがインストールしている有効なプラグインのツール定義を取得し、Core Tools (`lib/agent/tools.ts`) とマージする関数を実装。
- [ ] **Agent Manager更新**
  - `AgentManager` が初期化時（または計画時）に `ToolLoader` を使用して全ツールを取得するように変更。
  - `ScreenSubAgent` にも利用可能なツール定義を渡すように `HybridOrchestrator` を更新。

### 5.3 Secure Tool Execution (Layer 3)
エージェントがプラグインのツールを実行する際のルーティングとセキュリティを実装します。

- [ ] **Tool Executor実装**
  - `lib/agent/tool-executor.ts` を作成。
  - ツール名から「Core Tool」か「Plugin Tool」かを判別。
  - Plugin Toolの場合、`api/sandbox/[pluginId]/[functionName]` (または専用のエンドポイント) を呼び出すロジックを実装。
- [ ] **Sandbox API更新**
  - エージェントからのリクエストを処理するための内部API、または既存のSandbox APIの拡張。
  - エージェント実行時の権限チェック（ユーザーの代理として実行されるため、ユーザーの権限 + プラグインの権限を確認）。

### 5.4 Sample Plugin & Verification (Layer 4)
検証用のサンプルプラグインを作成し、動作確認を行います。

- [ ] **Sample Plugin作成**
  - `plugins/sample-todo` (仮想的なリポジトリまたはDBエントリ)
  - 機能: "Advanced Todo List"
  - ツール: `add_todo`, `get_todos`
- [ ] **E2Eテスト**
  - シナリオ: "Advanced Todoプラグインをインストールして、エージェントにタスクを追加させる"
  - 1. プラグインをインストール (DB操作で模擬)
  - 2. ユーザー: "Todoリストに「牛乳を買う」を追加して"
  - 3. エージェント: `add_todo` ツールを選択 → 実行 → 成功確認

## タイムライン (概算)
- 5.1 & 5.2: 4時間
- 5.3: 4時間
- 5.4: 2時間
**合計: 10時間**
