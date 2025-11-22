# AgentSDK 統合タスクリスト

本プロジェクトのハイブリッドオーケストレーションを OpenAI Agents SDK ベースに置き換えるための実行チェックリスト。完了した項目は `[x]` に更新してください。

## 0. 前提
- [x] `@openai/agents` をインストール済み
- [x] OpenAI APIキーを `.env.local` で `OPENAI_API_KEY` として登録

## 1. ランナー置き換え
- [x] `lib/agent/orchestrator.ts` を Agents SDK の Runner（ハンドオフ＋トレース付き）実装へ差し替え
- [x] 既存の `HybridOrchestrator` API（`execute(userRequest, apiKeys)`）互換のエントリ関数を残す
- [x] 並列/順次実行の戦略決定ロジックを Runner 側（サーバーオーケストレーター層）へ移設
- [x] Runner ラッパー（`lib/agent/agents-runner.ts`）を追加し、API ルートから呼び出せるようにした

## 2. ツール統合
- [x] `lib/agent/tools.ts` の各ツールを Agents SDK の function ツール定義に移行（`tool-loader` で Zod 変換）
- [x] 画面操作系（screen-id付き）のメタデータをツール側に渡せるよう定義拡張（`meta.preferredScreenId` 等）
- [x] プラグイン由来ツール（Phase 5 計画）のロード口を用意し、動的マージをサポート (`lib/agent/tool-loader.ts` 下準備)

## 3. プロンプト/ガードレール
- [x] メイン/サブエージェントのシステムプロンプトを Agents SDK の guardrails へ移し、JSON スキーマを強制（`lib/agent/guardrails.ts` で最終出力検証）
- [x] Check Agent の検証プロンプトを Runner 経由のフロー内に統合（サーバーオーケストレーター内で実行）
- [x] ゼロデータ保持が必要な場合のトレース設定メモを追加（トレース無効前提、必要なら自前エクスポートに切替）

## 4. UI とストリーム連携
- [x] `store/useChatStore.ts` で送信先を Agents SDK ランナーに切り替え、SSE/WebSocket ストリームに対応
- [x] 右サイドバーのメッセージ表示をトレースのステップ/ツール実行ログに対応させる（LOGアクションをチャット追記）
- [x] 失敗・リトライイベントを UI のステータスバッジに反映（UPDATE_STATUS受信時にチャットへ通知）

## 5. テストと検証
- [x] 既存スクリプト（`scripts/test-screen-agents.ts` など）を Runner ベースに書き換え
- [x] 並列タスク・依存タスク・プラグインツール利用の3シナリオで統合テスト（`scripts/test-agents-integration.ts`）
- [x] E2E 手順を `docs/verification-guide.md` に追記

## 6. 運用・デプロイ
- [ ] Vercel / Node ランタイムでの実行制限（Edge不可ケース）を確認
- [ ] レート制限・コスト監視のメトリクスを設定（OpenTelemetry または社内観察基盤）
- [ ] 秘匿情報（APIキー）の取り扱い方針を README に追記

## メモ
- 完了後、Phase 5 のプラグインツール動的読み込み設計と合わせて「ツールレジストリ」を共有化する。
- トレース/ログはデフォルトで最小化（Runnerで明示設定なし）。PIIを扱う場合は、社内OTS/OTelエンドポイントにエクスポートするか、環境変数でトレース送信を無効化する運用を推奨。
