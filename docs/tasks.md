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
- [ ] **Chat Sidebar Implementation**
  - [ ] `components/desktop/ChatSidebar.tsx` 新規作成
  - [ ] ChatKit (`@openai/chatkit-react`) の組み込み
  - [ ] メッセージの送受信処理 (`api/agent/chat` 接続)
  - [ ] **Always Visible**: 分割モード時も常に最前面/右側に表示されるようZ-indexとレイアウト調整
- [ ] **Desktop Layout Integration**
  - [ ] `components/desktop/DesktopLayout.tsx` に右サイドバー領域を追加
  - [ ] `react-resizable-panels` を使用してリサイズ可能にする
  - [ ] Agentアイコンクリックでサイドバーの開閉をトグルする処理

---

## Phase 4: Integration (統合)
**目標**: アプリとエージェントを有機的に結合する。

### 4.1 Tool Registration
- [ ] **Dynamic Tool Loading**
  - [ ] インストール済みプラグインの `ai-tools.json` をDBから取得
  - [ ] エージェントのSystem Promptにツール定義を注入する処理
- [ ] **UI Control Tools**
  - [ ] `tools/ui_control.ts` 実装 (set_layout, open_app)
  - [ ] エージェントからの指示でZustandストア (`useDesktopStore`) を操作するブリッジ実装

### 4.2 E2E Verification
- [ ] **Scenario Test**
  - [ ] ユーザーがストアから「売上予測プラグイン」をインストール
  - [ ] チャットで「来月の売上予測して」と依頼
  - [ ] エージェントがプラグインAPIを叩いて回答するフローを確認
- [ ] **Parallel Execution Test**
  - [ ] 「プロジェクト作成とカレンダー登録」を指示
  - [ ] 画面が2分割され、両方のアプリが開くことを確認
