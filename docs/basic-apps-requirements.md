# 基本アプリケーション要件定義

## 📋 ドキュメント情報
- **作成日**: 2025-11-10
- **対象リリース**: MVP Phase 3-4（認証導入後）
- **スコープ**: Desktop UI 上で提供するデフォルトアプリ（Projects / Settings / Revenue / Dashboard / Calendar / Store）

## 🌌 UIコンセプト（空白と無限の可能性）
- 余白を最大限に活かしたシンプルなカード / タイポグラフィ中心のデザイン。
- カラーアクセントは 1アプリにつき 1色のみ（薄いトーン + 同系濃淡）を使用し、背景は淡いグラデーション or スモークホワイトで統一。
- 情報量が少ない状態でも不安を与えないコピー（例:「まだデータがありません。今ここから始めましょう。」）。
- すべてのアプリが DesktopWindow 内で同じ余白（`padding: 24px`）と同じ見出し（`text-2xl`）を使用して統一感を維持。

### UIレイアウトテンプレート
- **枠組み**: ヘッダー（タイトル + プライマリアクション） / コンテンツ（カード or リスト） / フッター（オプション）。
- **タイポグラフィ**: `text-2xl`（タイトル）, `text-base`（本文）, `text-sm text-gray-500`（サブ）。
- **コンポーネント**: カード = `rounded-2xl border border-white/40 bg-white/80 shadow-sm`, 入力 = フル幅ボーダー + フォーカスリング #A0B5D9。
- **ボタン種別**:
  - Primary: 背景 `#334155`, ホバー `#1E293B`, テキスト白。
  - Secondary: 枠線 `#D4D8E3`, 背景透明、テキスト `#334155`。
  - Ghost: 背景透明、テキスト `#64748B`、ホバーで `bg-white/30`。
- **ステート**: Loading はスケルトンバー、エンプティはアイコン無しの白背景カードで統一。

### アクセントカラーパレット
| 用途 | Hex | 説明 |
| ---- | ---- | ---- |
| Base Mist | `#F5F6F8` | DesktopWindow 背景、カード背景グラデーションの基調 |
| Ink (Primary) | `#2F3A4F` | タイトル/主要ボタンの文字色 |
| Cloud (Secondary) | `#9AA5B9` | サブテキスト/ボーダー |
| Accent Calm | `#9BD4CF` | 強調エリア（サマリーカードのライン、プログレス）|
| Accent Warm | `#E3C7A5` | 補助強調（警告/チャート）|
| Accent Bloom | `#E7B7C8` | Store や感情的メッセージに限定使用 |

> 各アプリは上記パレットから Primary + Accent 1色だけを選択し、React コンポーネントでは `text-ink`, `bg-accent-calm/20` といったユーティリティクラスを Tailwind で定義して再利用する。

## 🔁 共通機能・技術要件
- **認証**: Phase4 で導入する Supabase Auth を必須化。すべての API 呼び出しは `createRouteHandlerClient({ cookies })` 経由でユーザーコンテキストを取得。
- **データストア**: 既存の Supabase PostgreSQL スキーマを共用。アプリごとの専用テーブルを増やさず、可能な限り既存テーブル（`projects`, `user_settings`, `app_settings`, `revenues`, `plugin_*`）を活用。
- **Window/Navigation**: DesktopLayout から開いた順序で `WindowManager` が表示。各アプリは `className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900"` を標準テンプレートとする。
- **空状態**: 主要画面には「白背景 + 1行コピー + CTAボタン」の Empty ステートを用意し、初回ログインでも違和感がないようにする。
- **アクセシビリティ**: 主要操作（作成/保存/キャンセル）はキーボード操作に対応、ARIA ラベルを付与。

---

## 📁 Projects App（プロジェクト管理）

### 目的
- プロジェクトの一覧・詳細・進捗・予算を最小ステップで把握し、シンプルな UI で CRUD を提供する。
- デスクトップ全体の「現在進行中タスク」の中心となるハブ。

### データ & API
- **テーブル**: `projects`（`docs/database-schema.md:39-120`）。
- **API**: `GET/POST /api/projects`, `GET/PATCH/DELETE /api/projects/[id]`（`docs/api-design.md:70-284`）。

### コアフロー
1. プロジェクト一覧（デフォルト並び: 更新日の降順）。
2. フィルター: ステータス（active/completed/on_hold）、期間（start_date, end_date）。
3. CRUD: 新規作成モーダル、カード内「…」メニューから編集/アーカイブ、削除はソフトデリート（`is_deleted`）。
4. 進捗バー: `actual_cost / budget` をパーセンテージ表示。進行率はバックエンドで計算 or `projects.progress` 拡張を検討。

### UI構成
- ヘッダー: タイトル + 「新規プロジェクト」ボタン。
- コンテンツ: カードリスト（最大 3 行表示 → 無限スクロール）。
- Empty state: 「まだプロジェクトがありません。最初のプロジェクトを作成しましょう。」+ CTA。
- カラーパレット: Base Mist 背景 + Ink 文字 + Accent Calm をプログレス/ボタンのみに使用（他コンポーネントでは新色を増やさない）。

### バリデーション
- `name`: 1-255 文字。
- `start_date`: 未来/過去どちらも許容、`end_date >= start_date`。
- `budget`: 0 以上。`actual_cost` は `budget` を超えても警告表示のみ。

### 連携
- Dashboard の KPI（件数、進捗）に集計提供。
- Calendar へ `start_date` / `end_date` をイベントとして提供（ガント風表示）。

---

## ⚙️ Settings App（設定管理）

### 目的
- ユーザー固有設定（表示名/言語/タイムゾーン等）とアプリ設定（通貨/会計年度/税率）を一画面で完結させる。
- UI はカード型メニュー → 右側に詳細フォームを展開する 2カラム構成（Phase1 はメニューのみでも可）。

### データ & API
- **テーブル**: `user_settings`, `app_settings`（`docs/database-schema.md:140-260`）。
- **API**: `GET/PATCH /api/settings/user`, `GET/PATCH /api/settings/app`（`docs/api-design.md:300-396`）。

### コアフロー
1. 初回アクセス時に設定レコードが無ければ自動作成（Supabase edge function or API 内で upsert）。
2. プロフィール編集 → フォーム送信 → 成功トースト。
3. 通知やテーマ設定は Zustand AuthStore と連動し、即時反映。

### UI構成
- カードリスト（プロフィール / 通知 / セキュリティ / テーマ）。
- 詳細フォーム（モーダル or 右側ペイン）。
- スイッチ・セレクト・テキストフィールドも余白重視でシンプルに。
- カラーパレット: Base Mist + Ink + Cloud。Primary ボタンは Ink、トグルの ON 状態のみ Accent Calm。

### バリデーション
- `displayName`: 1-50 文字。
- `timezone`: IANA TZ のみ。
- `taxRate`: 0〜100。

### 連携
- テーマ設定は DesktopLayout のダークモードトグルと同期。
- 通貨設定は Revenue / Dashboard の金額表示書式を制御。

---

## 💰 Revenue App（売上管理）

### 目的
- 毎月の売上・支出を俯瞰し、最近の取引を最小ステップで登録できるようにする。
- 空白感を保つため、グラフや表も必要最小限の要素だけを表示。

### データ & API
- **テーブル**: `revenues`（`docs/database-schema.md:281-353`）。
- **API**: `GET/POST /api/revenues`, `GET/PATCH/DELETE /api/revenues/[id]`, `GET /api/revenues/summary`（`docs/api-design.md:421-615`）。

### コアフロー
1. 今月サマリー（合計・昨対・トレンド）。
2. 売上一覧（テーブル or カード）。並び替え: 日付/金額。
3. 新規登録フォーム（プロジェクト紐づけ / 金額 / 種別 income|expense / メモ）。
4. フィルター: 期間（日/月/年）、プロジェクト、通貨。

### UI構成
- サマリーカード → シンプルな棒グラフ → 取引リスト。
- Empty state: 「売上データがまだありません。最初の取引を追加しましょう。」。
- カラーパレット: Base Mist + Ink + Accent Warm。収支種別は同色濃淡（Warm90 / Warm40）で表現し、赤/緑などビビッドカラーは禁止。

### バリデーション
- `amount`: 必須、0 より大きい数値。支出は自動でマイナス化。
- `revenue_date`: 必須、`YYYY-MM-DD`。
- プロジェクト紐付け：任意。存在しない `project_id` は 400。

### 連携
- Dashboard へ KPI（今月売上 / 前月比）を提供。
- Projects 詳細画面の「予算 vs 実績」カードに `actual_cost` を更新。

---

## 📊 Dashboard App（ハイレベル可視化）

### 目的
- Projects / Revenue / Settings 情報を横断して、1 画面で状況を把握する。
- カードは最大 4 つ（プロジェクト数、今月売上、進行中プロジェクトの平均進捗、未処理タスクなど）。

### データ & API
- Projects・Revenue API を集約するサーバーアクション or `GET /api/dashboard/summary`（新設）で取得。
- KPI 計算例:
  - `projectCount = count(projects where status != 'archived')`
  - `monthlyRevenue = sum(revenues where DATE_TRUNC('month', revenue_date) = now_month)`

### コアフロー
1. 認証後に自動で最初に開かれるウィンドウ（ホーム）。
2. KPI カード → 最近のアクティビティ（プロジェクト作成/売上登録/設定更新）。
3. 「詳細を見る」CTA で各アプリへジャンプ。

### UI構成
- 2×2 グリッドの KPI カード、リストカード 1 つ。
- 空状態: 「まだデータが揃っていません。Projects と Revenue を設定するとここにサマリーが表示されます。」
- カラーパレット: Base Mist + Ink を基調とし、各 KPI に Accent Calm/Warm/Bloom を 1 枚ずつ割り当て（同画面で 3 色まで）。

### 連携
- Projects/Revenue/Settings の更新イベントを `dashboard_events` テーブル or Supabase Realtime で購読し、最新 KPI を表示。

---

## 📅 Calendar App（スケジュール）

### 目的
- プロジェクトの開始/終了、売上入金予定、手動で登録したイベントを 1 つのタイムラインで確認する。
- UI は余白が広い週表示 + 「今日」のカード。シンプルな色分けのみ。

### データ & API
- **既存データ**: `projects.start_date/end_date`, `revenues.revenue_date`。
- **新規テーブル提案**: `calendar_events`（id, title, start_at, end_at, location, type, project_id?, user_id, created_at）。Phase4 でマイグレーションを追加。
- **API**: `GET /api/calendar?from=&to=`, `POST /api/calendar`, `PATCH/DELETE /api/calendar/[id]`（新設）。

### コアフロー
1. 今日/今週の予定表示（カードリスト）。
2. 新規イベント作成（タイトル/日時/場所/タイプ）。
3. プロジェクト期限を自動で取り込み、遅延しているものをハイライト。

### UI構成
- 上部: 今日カード。
- 中央: イベントリスト（時間順）。
- 下部: 「+ 新しい予定を追加」ボタン。
- カラーパレット: Base Mist + Ink + Accent Bloom。イベントタグは Bloom 濃淡のみで種類を区別し、他色は使用しない。

### 連携
- Projects で `end_date` を更新したら Calendar に即反映。
- Revenue の入金予定日を `type = "payment"` として表示。

---

## 🏪 Store App（プラグインストア）

### 目的
- 追加アプリを検索・評価し、ワンクリックでインストールできる入口を提供。
- シンプルなリスト + 詳細モーダルで、余白多めのカードデザインを維持。

### データ & API
- **テーブル**: `plugins`, `plugin_installations`, `plugin_permissions`, `plugin_reviews`（`docs/database-schema.md:624-842`）。
- **API**: `GET /api/store/plugins`, `GET /api/store/plugins/[id]`, `POST /api/store/install`, `DELETE /api/store/install/[id]`, `GET/POST /api/store/reviews`（`docs/plugin-store-design.md`, `docs/api-design.md:808-1206`）。

### コアフロー
1. 検索バー & フィルター（カテゴリ/価格/評価）。
2. プラグインカード → 「インストール」押下で権限確認ダイアログ → インストール API → Desktop アイコンに追加。
3. 詳細モーダルでレビュー・権限を確認。

### UI構成
- トップ: 検索入力 + スペース豊富なプラグインカードリスト。
- 詳細: サイドパネル or フルウィンドウで説明/レビュー。
- Empty state: 「まだプラグインが公開されていません。」
- カラーパレット: Base Mist + Ink + Accent Calm（検索バー/ボタン）を基本とし、課金アイテムには Accent Warm の細線だけで価格を強調。

### 連携
- インストール結果を `store/desktopStore.ts` の `apps` 配列に反映し、Dock/Arrange に即表示。
- Permissions は `plugin_permissions` を参照し、インストール前にユーザーへ表示。

---

## ✅ 今後のドキュメント更新ガイド
- 各アプリの詳細 UI 仕様や API 変更は本ファイルに追記し、`docs/tasks.md` からリンクする。
- Calendar / Store の新規 API や DB 変更を行った際は、本ドキュメントの該当セクションにバージョン・変更日を記載する。
- フロント実装前にこのドキュメントを必読とし、齟齬があれば先に要件を更新すること。
