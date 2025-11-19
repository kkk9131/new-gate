# プラグインアーキテクチャ設計

## 1. 概要
本プラットフォームのプラグインシステムは、単なる機能追加ではなく、**「AIエージェントの能力（手札）を拡張する」** ことを主眼に置いたAIネイティブな設計とする。
プラグインは「人間用のUI」と「AI用のツール定義」をセットで提供し、インストールされると即座にエージェントがその機能を利用可能になる。

## 2. プラグインの構成要素

プラグインは以下の4つの要素で構成されるパッケージである。

```
my-plugin/
├── manifest.json       # プラグインの基本情報・権限定義
├── ai-tools.json       # AIエージェント用のツール定義（OpenAI Function Calling形式準拠）
├── ui/                 # フロントエンド (Reactコンポーネント)
└── api/                # バックエンド (Server Actions / API Routes)
```

### 2.1 manifest.json
プラグインのメタデータと必要な権限を定義する。

```json
{
  "id": "com.example.sales-forecast",
  "name": "AI売上予測",
  "version": "1.0.0",
  "description": "過去のデータから来月の売上を予測します",
  "permissions": [
    "read:revenue",  // 売上データの読み取り権限
    "write:calendar" // カレンダーへの書き込み権限
  ],
  "entryPoint": "ui/index.tsx"
}
```

### 2.2 ai-tools.json (Core Concept)
エージェントがこのプラグインをどう使うかを記述した「説明書」。
プラグインインストール時に、システムはこの定義を読み込み、エージェントのツールセットに動的に追加する。

```json
{
  "tools": [
    {
      "name": "generate_sales_forecast",
      "description": "指定された期間の売上予測を生成する",
      "parameters": {
        "type": "object",
        "properties": {
          "target_month": {
            "type": "string",
            "description": "予測対象月 (YYYY-MM)"
          },
          "method": {
            "type": "string",
            "enum": ["linear", "seasonal"],
            "description": "予測アルゴリズム"
          }
        },
        "required": ["target_month"]
      }
    }
  ]
}
```

## 3. ランタイムアーキテクチャ

### 3.1 サンドボックス実行環境 (Security)
サードパーティ製プラグインによるセキュリティリスクを排除するため、UIとロジックは厳格に分離・制限される。

*   **UIレイヤー**: `iframe` 内で実行。親ウィンドウ（本体）とは `postMessage` を介した SDK (`@platform/bridge`) 経由でのみ通信可能。直接的なDOM操作やCookieアクセスは禁止。
*   **APIレイヤー**: サーバーサイドのサンドボックス環境（V8 Isolate等、あるいはDockerコンテナ）で実行。データベースへのアクセスは、プラットフォームが提供する `Context` オブジェクト経由でのみ許可され、RLS（Row Level Security）が適用される。

### 3.2 エージェントとの連携フロー
1.  **インストール**: ユーザーがプラグインをインストール。
2.  **登録**: システムが `ai-tools.json` を解析し、Global Tool Registry に登録。
3.  **認識**: エージェントが次回起動時（またはコンテキスト更新時）に、新しいツールとして認識。
4.  **実行**: ユーザーが「来月の予測して」と頼むと、エージェントは `generate_sales_forecast` ツールを選択し、プラグインのAPIを実行する。

## 4. データフローと権限管理

プラグインは独自のテーブルを持つことができるが、基本的にはプラットフォームのコアデータ（Projects, Revenues等）と連携する。

*   **データアクセス**: プラグインは `manifest.json` で宣言した権限（Scope）の範囲内でのみ、Core APIを通じてデータにアクセスできる。
*   **ユーザー承認**: インストール時に、ユーザーは要求された権限（「売上データの読み取り」など）を承認する必要がある。

## 5. 開発者体験 (DX)
*   **CLIツール**: プラグインの雛形作成、ローカルテスト、デプロイを行う `platform-cli` を提供。
*   **Simulator**: エージェントが自分のプラグインをどう使うかをテストできるシミュレーター環境を提供。
