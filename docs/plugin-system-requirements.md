# プラグインシステム要件定義

## 📋 ドキュメント情報
- **作成日**: 2025-11-10
- **対象リリース**: プラグイン Phase（Phase 9-10 想定）
- **関連文書**: `docs/plugin-store-design.md`, `docs/database-schema.md`, `docs/tasks.md`

## 🎯 ゴール
1. **開発者プラン利用者**が、提供されるテンプレートを使って自作アプリ（プラグイン）を短時間で構築できること。
2. **一般ユーザー**が、Desktop UI の Store 画面からプラグインを発見・追加・管理できること。
3. プラグインのインストールから実行まで一貫した UX / セキュリティ / 権限管理を提供すること。

## 🧑‍🤝‍🧑 アクター
| アクター | 役割 |
| --- | --- |
| 開発者 (Developer Plan) | テンプレ基盤でプラグインを開発・提出。マニフェストやスクリーンショットを登録。|
| プラットフォーム管理者 (Admin) | プラグインの審査・公開、権限設定テンプレの管理。|
| エンドユーザー (User) | Store からプラグインを検索・インストールし Desktop で利用。|

## 🧱 システム構成とデータ
- **DBテーブル** (既存設計を利用)
  - `plugins`: 基本情報 (id, name, slug, developer_id, category, summary, long_description, status, version, manifest_json, cover_image, created_at, updated_at)
  - `plugin_installations`: ユーザーごとの導入状況 (user_id, plugin_id, is_active, settings JSON, installed_at)
  - `plugin_permissions`: プラグインが要求する権限 (`storage.read`, `projects.write` 等)
  - `plugin_reviews`, `plugin_categories`, `plugin_assets` (将来拡張)
- **API** (新設/整理)
  - `GET /api/store/plugins`: 一覧取得 + 検索
  - `GET /api/store/plugins/[id]`: 詳細
  - `POST /api/store/install`: インストール（`plugin_id` + 同意フラグ）
  - `DELETE /api/store/install/[id]`: アンインストール
  - `POST /api/store/plugins`: 開発者が下書き登録
  - `PATCH /api/store/plugins/[id]`: 更新（Admin/Owner 限定）
  - `POST /api/store/plugins/[id]/submit`: 公開申請
  - `POST /api/store/plugins/[id]/approve`: 管理者承認

## 🛠 開発者向けワークフロー
1. **テンプレ生成**
   - CLI (`npx new-gate-plugin create <name>`) または Web ポータルからテンプレを発行。
   - 内容: フロントコンポーネント雛形 (Next.js + Zustand), API ルート雛形, `plugin.manifest.json`, README。
2. **ローカル実装**
   - 提供された `PluginApp` コンポーネント内で UI を実装。
   - Supabase へのアクセスは `supabasePluginClient` ラッパー経由に限定。権限は manifest の `permissions` と照合。
3. **テスト**
   - `npm run plugin:dev` でホスト Desktop に接続し、プラグインを iframe / sandbox で試験。
4. **パッケージング**
   - `plugin.manifest.json` に以下を必須記入：
     ```json
     {
       "id": "com.example.task-helper",
       "name": "Task Helper",
       "version": "1.0.0",
       "entry": "dist/index.js",
       "permissions": ["projects.read", "projects.write"],
       "icon": "./assets/icon.png",
       "screenshots": ["./assets/screen1.png"],
       "minPlatformVersion": "1.0.0"
     }
     ```
5. **提出・審査**
   - Store ポータルから ZIP をアップロード → 自動検証 (lint / manifest / bundle size) → 管理者が UI/UX と権限を審査。
6. **公開**
   - 承認されると `plugins.status = 'published'` に更新。必要に応じて Beta → GA の段階を持つ。

## 🛒 ユーザー体験フロー
1. **発見**
   - Store トップ: おすすめ・カテゴリ・人気プラグインをカード表示。
   - 検索: キーワード + フィルター（カテゴリ、価格、権限、評価）。
2. **詳細確認**
   - プラグインカードをクリック → 詳細パネル。
   - 表示項目: 名称、開発者、説明、スクリーンショット、必要権限、バージョン履歴、レビュー。
3. **権限確認**
   - 「インストール」クリック時にダイアログ表示：
     - 要求権限の説明
     - 利用規約/プライバシーポリシーリンク
4. **インストール**
   - API 呼び出し成功後、`desktopStore.apps` に動的追加 → アイコン並び替え
   - 初回起動時に設定ウィザード（`plugin_installations.settings` へ保存）
5. **管理**
   - Store の「マイプラグイン」タブで一覧表示、アンインストール・更新確認・設定変更が可能。

## 🧩 ランタイム仕様
- **実行形式**: プラグインは `appComponents` に登録される動的モジュール。ビルド時にサーバーから取得した manifest を基に import。将来的には Web Worker / iframe サンドボックスを検討。
- **状態管理**: プラグイン固有の Zustand ストアをテンプレで用意し、グローバル `desktopStore` との衝突を避ける。
- **権限 enforcement**: `supabasePluginClient` が manifest permissions を検証し、未許可クエリは 403 を返す。
- **エラーハンドリング**: プラグイン崩壊時も Window コンテナは落ちないよう try/catch & フォールバック UI。

## 🔐 セキュリティ / ポリシー
- RLS + JWT によりプラグインは操作者のデータのみアクセス可能。
- 権限プリセット例: `projects.read`, `projects.write`, `revenues.read`, `settings.read`, `notifications.send`。
- ネットワークアクセスはデフォルト禁止、必要な場合は manifest で `externalFetchDomains` を宣言。
- 監査ログ: `plugin_activity_logs` で重要操作を保存（インストール、設定更新、エラー）。

## 🔄 ライフサイクル管理
| ステータス | 説明 |
| --- | --- |
| draft | 開発者が保存した未申請状態 |
| in_review | 管理者審査中 |
| rejected | 差し戻し。理由はコメント欄で通知 |
| beta | 限定公開。招待コードまたは URL でインストール可 |
| published | Store に一般公開 |
| deprecated | 利用非推奨。インストール済ユーザーへ通知 |
| retired | ダウンロード不可。既存ユーザーからも無効化 |

更新時のルール：
- Minor/patch リリースは自動で既存ユーザーへ配信（設定で自動更新オフ可）。
- Major リリースは利用規約変更扱い。再度権限ダイアログを表示。

## ✅ 受け入れ条件
- [ ] 開発者がテンプレ生成→提出→公開まで CLI / ポータル上で完結する。
- [ ] ユーザーが Store からインストールし、Desktop に即座にプラグインアイコンが追加される。
- [ ] 権限同意フローがすべてのプラグインで統一されている。
- [ ] `plugin_installations` による状態管理とアンインストール処理が実装される。
- [ ] プラグイン実行時に権限を逸脱した API 呼び出しがブロックされる。

---

この要件をベースに `docs/tasks.md` の Phase 9-10 を詳細化し、実装タスク（テンプレ CLI、Store UI 拡張、API 追加、DB マイグレーション）へ落とし込みます。

