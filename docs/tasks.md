# 実装タスクリスト (Updated)

## 📋 概要
現在の実装状況（基本アプリ実装済み、Store/AgentはMock UIあり）を踏まえた、残りの実装タスク。
**変更点**: AgentAppをウィンドウ形式から「右側固定のチャットサイドバー」に変更。

---

## Phase 1: MVP Core & Basic Apps (完了) ✅
**状態**: UI/API共に実装済み。

- [x] **Database & Core Infrastructure**
  - [x] `projects`, `revenues`, `calendar_events` テーブル
  - [x] RLSポリシー設定
- [x] **Core API**
  - [x] `api/projects`, `api/revenues`, `api/events`
- [x] **Basic Apps UI**
  - [x] Projects App
  - [x] Revenue App
  - [x] Calendar App

---

## Phase 2: Plugin System Foundation (プラグイン基盤)
**目標**: Mock状態の `StoreApp` を実機能化し、外部プラグインをサンドボックスで動かす。

### 2.1 Plugin Registry & DB
- [x] **DB Schema Setup**
  - [x] `plugins` テーブル作成 (manifest情報格納)
  - [x] `plugin_installations` テーブル作成
  - [x] `plugin_permissions` テーブル作成
- [x] **Store API Implementation**
  - [x] `api/store/plugins` (GET: 一覧, POST: 公開)
  - [x] `api/store/install` (POST: インストール)
- [x] **StoreApp Integration**
  - [x] `components/apps/StoreApp.tsx` の `mockPlugins` をAPI取得に置き換え
  - [x] インストールボタンの処理実装

- [x] **UI Sandbox (iframe)**
  - [x] `components/PluginFrame.tsx` 実装 (iframeコンテナ)
  - [x] `lib/bridge/host.ts` 実装 (postMessage受信側)
- [x] **API Sandbox (Server)**
  - [x] `api/sandbox/[pluginId]/[...path]` プロキシ実装
  - [x] 権限チェックミドルウェア (DBアクセス制限)

### 2.3 Developer Experience
- [x] **Core SDK Package**
  - [x] `@platform/sdk` の型定義とエクスポート設定
  - [x] `lib/bridge/client.ts` 実装 (プラグイン側SDK)

---

## Phase 3: Multi-LLM Agent System (高度なエージェント)
**目標**: 右側固定のチャットUIを実装し、Router-Worker構成のバックエンドと接続する。

### 3.1 Agent Database
- [x] **DB Schema Setup**
  - [x] `llm_providers` (APIキー管理)
  - [x] `agent_profiles` (Worker定義)
  - [x] `agent_routing_rules` (振り分けルール)
  - [x] `agent_memories` (pgvector導入)

### 3.2 Router & Worker Logic
- [x] **LLM Service Layer**
  - [x] `lib/llm/router.ts` (振り分けロジック)
  - [x] `lib/llm/workers/gemini.ts` (Writer)
  - [x] `lib/llm/workers/openai.ts` (Coder)
- [x] **Agent API**
  - [x] `api/agent/chat` (チャットエンドポイント)
  - [x] `api/agent/tasks` (タスク管理エンドポイント)
- [x] **Parallel Execution Logic**
  - [x] 複合タスクをサブタスクに分解するプロンプト設計
  - [x] 複数のWorkerを並列実行させるオーケストレーター実装

### 3.3 Agent UI (Right Sidebar Chat) 🔄 Re-defined
- [x] **Chat Sidebar Implementation**
  - [x] `components/desktop/ChatSidebar.tsx` 新規作成
  - [-] ChatKit (`@openai/chatkit-react`) の組み込み (Custom UI implemented)
  - [x] メッセージの送受信処理 (`api/agent/chat` 接続)
  - [x] **Always Visible**: 分割モード時も常に最前面/右側に表示されるようZ-indexとレイアウト調整
- [x] **Desktop Layout Integration**
  - [x] `components/desktop/DesktopLayout.tsx` に右サイドバー領域を追加
  - [x] `react-resizable-panels` を使用してリサイズ可能にする
  - [x] Agentアイコンクリックでサイドバーの開閉をトグルする処理

---

## Phase 4: Hybrid Agent Integration (ハイブリッドエージェント統合)
**目標**: 既存Router-Worker実装にScreen操作型subAgentsとCheck Agent検証を統合する。
**設計**: [ハイブリッドエージェントアーキテクチャ](./hybrid-agent-architecture.md)
**実装計画**: [Phase 4実装計画](./implementation-plan-phase4.md)

### 4.0 API Key Management (Settings Integration) ✅ 完了
**依存**: Agent機能の利用にはAPIキー設定が必須
- [x] **Settings App UI Update**
  - [x] `components/apps/SettingsApp.tsx` に「AI設定」セクションを追加
  - [x] APIキー入力フォーム (OpenAI, Gemini等) の実装
  - [x] 入力されたキーをセキュアに保存 (localStorage または DBのuser_secretsテーブル)
- [x] **Agent Client Integration**
  - [x] `useChatStore` または `api/agent/chat` で設定されたAPIキーを読み込む処理の実装

---

### 4.1 Agent Manager拡張 (Layer 1) ✅ 完了
**目標**: 既存`orchestrator.ts`を拡張し、スクリーン管理機能を追加
**作業時間**: 4時間

- [x] **型定義の拡張**
  - [x] `lib/llm/types.ts` に `LayoutMode`, `Subtask`, `Assignment`, `AgentManagerDecision` を追加
- [x] **Agent Managerクラス実装**
  - [x] `lib/agent/manager.ts` 新規作成
  - [x] タスク分解ロジック (`decomposeTask`)
  - [x] レイアウト決定ロジック (`determineLayout`)
  - [x] Worker選択ロジック (`selectWorker`)
  - [x] 実行戦略決定 (`determineStrategy`)
- [x] **Desktop Store拡張**
  - [x] `store/useDesktopStore.ts` にScreen管理機能を追加
  - [x] `setLayout`, `openAppInScreen`, `updateScreenStatus` アクション実装
- [x] **テスト実装**
  - [x] `scripts/test-agent-manager.ts` 作成
  - [x] タスク分解、レイアウト決定、Worker選択のテスト

---

### 4.2 Screen subAgents実装 (Layer 2) ✅ 完了
**目標**: 各スクリーンを操作するScreen subAgentを実装
**作業時間**: 6時間

- [x] **UI Controllerクラス実装**
  - [x] `lib/agent/ui-controller.ts` 新規作成
  - [x] `setLayout`, `openApp`, `updateStatus` メソッド実装
- [x] **Screen subAgentクラス実装**
  - [x] `lib/agent/screen-agent.ts` 新規作成
  - [x] `execute` メソッド: UI制御 + タスク実行 + 結果報告
  - [x] エラーハンドリング
- [x] **ツール定義の実装**
  - [x] `lib/agent/tools.ts` 新規作成
  - [x] Projects App用ツール (`create_project`, `list_projects`)
  - [x] Calendar App用ツール (`create_event`, `list_events`)
  - [x] Revenue App用ツール (`create_revenue`)
- [x] **統合オーケストレーター実装**
  - [x] `lib/agent/orchestrator.ts` 新規作成
  - [x] Agent Manager → Screen subAgents → 並列/順次実行
- [x] **テスト実装**
  - [x] `scripts/test-screen-agents.ts` 作成
  - [x] Screen操作、並列実行、エラーハンドリングのテスト

---

### 4.3 Check Agent実装 (Layer 3) ✅ 完了
**目標**: 実行結果を検証するCheck Agentを実装
**作業時間**: 4時間

- [x] **Check Agentクラス実装**
  - [x] `lib/agent/check-agent.ts` 新規作成
  - [x] `verify` メソッド: ユーザー要求と実行結果の照合
  - [x] 検証プロンプトの設計
- [x] **Orchestratorへの統合**
  - [x] `HybridOrchestrator` に検証フェーズを追加
  - [x] 検証結果に基づく最終レポート生成
- [x] **Chat API統合**
  - [x] `store/useChatStore.ts` 更新: Hybrid Orchestratorを使用
  - [x] APIキーの受け渡し実装
- [x] **テスト実装**
  - [x] `scripts/test-screen-agents.ts` 更新
  - [x] 検証フローの確認
シンプルなタスク、複合タスク、依存関係のあるタスクのテスト

---

### 4.4 UI連携強化 (可視化) ✅ 完了
**目標**: エージェントの思考・実行状態をUI上で可視化
**作業時間**: 2時間

- [x] **Agent Overlay実装**
  - [x] `components/agent/AgentOverlay.tsx` 作成
  - [x] スクリーンごとのステータス表示 (Thinking, Executing, Completed)
  - [x] プログレスバー表示
- [x] **DesktopArea統合**
  - [x] `components/desktop/SplitMode.tsx` 更新
  - [x] 各スクリーンにOverlayを配置

---

### 4.5 E2E Verification ✅ 完了
**目標**: 全体フローの動作確認

- [x] **Improve Test Scripts**: `scripts/test-screen-agents.ts` を更新し、APIキー処理と複数シナリオに対応
- [x] **Create Verification Guide**: `docs/verification-guide.md` に手動検証手順をドキュメント化
- [x] **Manual Verification**: 以下のシナリオをブラウザで検証
  - [x] Single task execution (e.g., Create Project)
  - [x] Parallel task execution (e.g., Create Project + Calendar Event)
  - [x] UI Visualization (Agent Overlay)

---

## Phase 5: Plugin-Agent Integration (プラグイン・エージェント統合)
**目標**: プラグインシステムとエージェントシステムを統合し、インストールされたプラグインのツールをエージェントが動的に利用できるようにする。
**設計**: [Phase 5実装計画](./implementation-plan-phase5.md)

### 5.1 Plugin Tool Definition (Layer 1)
**目標**: プラグインがツールを定義するための仕組みを実装
**作業時間**: 2時間

- [ ] **DBスキーマ拡張**
  - [ ] `plugins` テーブルに `tools_definition` カラム (JSONB) を追加
  - [ ] マイグレーションスクリプト作成
- [ ] **Manifest拡張**
  - [ ] `ai-tools.json` のパース処理を実装
  - [ ] `api/store/plugins` でツール定義を受け取り、DBに保存する処理を追加

---

### 5.2 Dynamic Tool Registry (Layer 2)
**目標**: Agent Managerが動的にツールを取得・統合するロジックを実装
**作業時間**: 2時間

- [ ] **Tool Loader実装**
  - [ ] `lib/agent/tool-loader.ts` 新規作成
  - [ ] `getAvailableTools(userId)`: インストール済みプラグインのツール定義を取得
  - [ ] Core Tools (`lib/agent/tools.ts`) とマージする関数を実装
- [ ] **Agent Manager更新**
  - [ ] `AgentManager` が初期化時に `ToolLoader` を使用して全ツールを取得
  - [ ] `HybridOrchestrator` を更新し、`ScreenSubAgent` にツール定義を渡す

---

### 5.3 Secure Tool Execution (Layer 3)
**目標**: エージェントがプラグインのツールを実行する際のルーティングとセキュリティを実装
**作業時間**: 4時間

- [ ] **Tool Executor実装**
  - [ ] `lib/agent/tool-executor.ts` 新規作成
  - [ ] ツール名から「Core Tool」か「Plugin Tool」かを判別
  - [ ] Plugin Toolの場合、Sandbox API経由で実行するロジックを実装
- [ ] **Sandbox API更新**
  - [ ] エージェントからのリクエストを処理する内部API実装
  - [ ] 権限チェック（ユーザー権限 + プラグイン権限）の実装

---

### 5.4 Sample Plugin & Verification (Layer 4)
**目標**: 検証用のサンプルプラグインを作成し、動作確認を行う
**作業時間**: 2時間

- [ ] **Sample Plugin作成**
  - [ ] `plugins/sample-todo` ディレクトリ作成
  - [ ] `manifest.json` と `ai-tools.json` 定義
  - [ ] ツール: `add_todo`, `get_todos` の実装
- [ ] **E2Eテスト**
  - [ ] プラグインをDBに登録
  - [ ] エージェントがプラグインのツールを認識することを確認
  - [ ] "Todoリストに「牛乳を買う」を追加して" → 成功確認
  - [ ] 検証ガイドを `docs/verification-guide.md` に追記

