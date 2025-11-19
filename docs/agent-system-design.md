# エージェントシステム設計 (Multi-LLM Router)

## 1. 概要
本システムのエージェントは、単一のLLMではなく、**「司令塔（Router）」と「専門家（Workers）」** からなるチームとして機能する。
ユーザーはタスクの性質やコストに応じて、使用するLLMを柔軟に構成・選択できる。

## 2. アーキテクチャ: Router-Worker パターン

### 2.1 Router Agent (司令塔)
*   **役割**: ユーザーの入力を最初に受け取り、意図理解とタスクの振り分けを行う。
*   **推奨モデル**: 高速かつ低コストなモデル (例: gpt-4o-mini, gemini-flash)。
*   **機能**:
    1.  ユーザー入力の解析
    2.  必要なツールの特定
    3.  適切なWorker Agentへの委譲（または自ら実行）

### 2.2 Worker Agents (専門家)
特定のタスクに特化したエージェント設定。ユーザーは以下のようなWorkerを定義できる。

| Worker名 | 得意分野 | 推奨モデル | 特徴 |
| :--- | :--- | :--- | :--- |
| **Writer** | ドキュメント作成、要約 | Gemini 1.5 Pro | 長文コンテキストに強く、自然な日本語生成が得意 |
| **Coder** | コード生成、デバッグ | GPT-4o / Claude 3.5 Sonnet | 論理的思考とコーディング能力が高い |
| **Analyst** | データ分析、グラフ作成 | GPT-4o (Code Interpreter) | データ処理と可視化が得意 |
| **Clerk** | 定型業務、データ入力 | Gemini Flash / GPT-4o-mini | 高速・低コスト |

## 3. ルーティングロジック

ユーザーは「ルーティングルール」を設定画面で定義できる。

```json
// ルーティングルールのイメージ
[
  {
    "condition": "task_type == 'writing'",
    "target_worker": "Writer"
  },
  {
    "condition": "task_type == 'coding'",
    "target_worker": "Coder"
  },
  {
    "condition": "default",
    "target_worker": "Clerk"
  }
]
```

## 4. データベース設計 (Schema)

エージェントシステムを支えるためのテーブル構造。

### 4.1 `llm_providers`
利用可能なLLMプロバイダーとAPIキー（暗号化保存）を管理。

```sql
CREATE TABLE llm_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  provider_name VARCHAR(50) NOT NULL, -- 'openai', 'google', 'anthropic'
  api_key_hash VARCHAR(255) NOT NULL, -- 暗号化されたAPIキー
  is_active BOOLEAN DEFAULT true
);
```

### 4.2 `agent_profiles`
Worker Agentの設定定義。

```sql
CREATE TABLE agent_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name VARCHAR(100) NOT NULL, -- 'Writer', 'Coder'
  description TEXT,
  model_id VARCHAR(100) NOT NULL, -- 'gemini-1.5-pro', 'gpt-4o'
  system_prompt TEXT, -- 「あなたはプロのライターです...」
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4.3 `agent_routing_rules`
タスク振り分けルール。

```sql
CREATE TABLE agent_routing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  priority INTEGER DEFAULT 0,
  condition_json JSONB NOT NULL, -- 振り分け条件
  target_agent_id UUID REFERENCES agent_profiles(id)
);
```

### 4.4 `agent_memories` (Vector Store)
エージェントの長期記憶。過去のタスク実行結果やユーザーの好みを保存。
`pgvector` 拡張機能を使用する。

```sql
CREATE TABLE agent_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  embedding vector(1536), -- 埋め込みベクトル
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 5. エージェントの実行フロー

1.  **User**: 「来月の売上予測レポートを書いて」
2.  **Router**: 入力を解析。「レポート作成」→ `Writer` (Gemini) に委譲と判断。
3.  **Router**: `Writer` にタスクと必要なツール（`generate_sales_forecast` from Plugin）を渡す。
4.  **Writer**:
    *   ツール `generate_sales_forecast` を実行（API Call）。
    *   結果（数値データ）を取得。
    *   レポート本文を執筆。
5.  **System**: 結果をユーザーに提示し、実行ログを `agent_memories` に保存。

## 6. Agent-Driven UI Control (並列実行の可視化)

ユーザーの複合的なリクエストに対して、エージェントが自律的にUIを操作し、並列作業を視覚化する。

### 6.1 コンセプト
「プロジェクト作成、カレンダー登録、売上入力」のような複合タスクの場合、エージェントは以下のステップで実行する。

1.  **Task Decomposition**: Routerがタスクを3つのサブタスクに分解。
2.  **UI Layout Control**: Routerが「3分割モード」に切り替え、各領域に対象アプリ（Projects, Calendar, Revenue）を開く。
3.  **Parallel Execution**: 各Worker Agentがそれぞれのアプリ（API）に対して操作を行い、その進行状況が各ウィンドウにリアルタイム反映される。

### 6.2 UI Control Tools
エージェントには以下のUI操作ツールが提供される。

*   `ui_set_layout(mode: 'single' | 'split-2' | 'split-3' | 'split-4')`
*   `ui_open_app(appId: string, targetScreen: number)`
*   `ui_highlight_element(selector: string)`

これにより、ユーザーは「エージェントが自分の代わりに画面を操作して仕事をしている」様子を目の当たりにできる。
