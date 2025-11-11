# Settingsアプリ要件定義

Settingsアプリの全設定項目の詳細仕様書

---

## 📋 設定カテゴリ一覧

1. **通知設定** - AIエージェント連携
2. **セキュリティ設定** - セッション・ログイン履歴管理
3. **言語設定** - 多言語対応
4. **タイムゾーン設定** - 日時表示
5. **プライバシー設定** - データ管理
6. **API設定** - 環境変数・APIキー管理
7. **インテグレーション** - 外部サービス連携

---

## 1. 通知設定

### 目的
AIエージェントのタスク完了時やシステムイベント発生時にユーザーへ通知を送る

### 機能要件

#### 1.1 通知方法の選択
- **メール通知**
  - 有効/無効切り替え
  - 通知先メールアドレス設定（デフォルト: 登録メールアドレス）
  - メールテンプレートプレビュー

- **ブラウザ通知（Push Notification）**
  - 有効/無効切り替え
  - 通知音の有効/無効
  - デスクトップ通知許可リクエスト

- **アプリ内通知**
  - 通知バッジ表示
  - 通知センター（未読通知一覧）

#### 1.2 通知カテゴリ
各カテゴリごとに個別ON/OFF可能

- **エージェントタスク完了**
  - タスク成功時
  - タスク失敗時
  - タスク実行中の重要イベント

- **システム通知**
  - セキュリティアラート（不審なログイン等）
  - プラットフォーム更新情報
  - メンテナンス予告

- **プロジェクト通知**
  - プロジェクト期限リマインダー
  - プロジェクトメンバー追加

#### 1.3 通知タイミング設定
- **即時通知** - イベント発生時すぐに通知
- **まとめて通知** - 1時間/3時間/6時間/1日ごとにまとめて通知
- **営業時間のみ通知** - 指定時間帯のみ通知（例: 9:00-18:00）

### UI設計

```
┌─────────────────────────────────────┐
│  通知設定                            │
├─────────────────────────────────────┤
│                                     │
│  通知方法                            │
│  ┌─────────────────────────────┐   │
│  │ [✓] メール通知              │   │
│  │ [✓] ブラウザ通知            │   │
│  │ [✓] アプリ内通知            │   │
│  └─────────────────────────────┘   │
│                                     │
│  通知カテゴリ                        │
│  ┌─────────────────────────────┐   │
│  │ エージェントタスク完了       │   │
│  │   [✓] 成功時                │   │
│  │   [✓] 失敗時                │   │
│  │                             │   │
│  │ システム通知                 │   │
│  │   [✓] セキュリティアラート   │   │
│  │   [ ] プラットフォーム更新   │   │
│  └─────────────────────────────┘   │
│                                     │
│  通知タイミング                      │
│  ○ 即時通知                         │
│  ○ まとめて通知 [1時間ごと ▼]      │
│  ○ 営業時間のみ [9:00-18:00]       │
│                                     │
│  [保存]                             │
└─────────────────────────────────────┘
```

### データベーススキーマ

```sql
-- user_settings テーブル（通知設定部分）
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 通知方法
  notification_email BOOLEAN DEFAULT true,
  notification_browser BOOLEAN DEFAULT true,
  notification_in_app BOOLEAN DEFAULT true,
  notification_sound BOOLEAN DEFAULT true,

  -- 通知カテゴリ
  notify_agent_task_success BOOLEAN DEFAULT true,
  notify_agent_task_failure BOOLEAN DEFAULT true,
  notify_security_alert BOOLEAN DEFAULT true,
  notify_platform_updates BOOLEAN DEFAULT false,
  notify_project_reminder BOOLEAN DEFAULT true,

  -- 通知タイミング
  notification_timing TEXT DEFAULT 'immediate', -- immediate | batched | business_hours
  notification_batch_interval INTEGER DEFAULT 60, -- 分単位
  notification_business_hours_start TIME DEFAULT '09:00',
  notification_business_hours_end TIME DEFAULT '18:00',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);
```

### API設計

#### GET `/api/settings/notifications`
通知設定を取得

**Response:**
```json
{
  "notification_email": true,
  "notification_browser": true,
  "notification_in_app": true,
  "notification_sound": true,
  "notify_agent_task_success": true,
  "notify_agent_task_failure": true,
  "notification_timing": "immediate",
  "notification_batch_interval": 60,
  "notification_business_hours_start": "09:00",
  "notification_business_hours_end": "18:00"
}
```

#### PATCH `/api/settings/notifications`
通知設定を更新

**Request:**
```json
{
  "notification_email": false,
  "notify_agent_task_success": true
}
```

**Response:**
```json
{
  "message": "通知設定を更新しました",
  "settings": { ... }
}
```

---

## 2. セキュリティ設定

### 目的
アカウントのセキュリティを強化し、不正アクセスを防止・検知する

### 機能要件

#### 2.1 アクティブセッション管理
- **現在のセッション一覧表示**
  - 現在のデバイス（強調表示）
  - 他のアクティブセッション一覧
  - 各セッション情報：
    - デバイス名（Mac、iPhone、Windows等）
    - ブラウザ（Chrome、Safari、Firefox等）
    - IPアドレス
    - 国/都市（IPから推定）
    - ログイン日時
    - 最終アクセス日時

- **セッション操作**
  - 個別セッションのログアウト
  - 「全デバイスからログアウト」ボタン（現在のセッションを除く）
  - 確認ダイアログ表示

#### 2.2 ログイン履歴
- **過去のログイン記録表示**（最新50件）
  - ログイン日時
  - IPアドレス
  - 国/都市
  - デバイス/ブラウザ
  - ステータス（成功/失敗）
  - 失敗理由（パスワード誤り、アカウントロック等）

- **フィルタリング機能**
  - 成功/失敗でフィルター
  - 日付範囲でフィルター
  - デバイスでフィルター

- **エクスポート機能**
  - CSV形式でダウンロード

#### 2.3 セッション有効期間設定
- **自動ログアウト設定**
  - 30分/1時間/3時間/6時間/24時間/無効
  - 一定時間操作がない場合に自動ログアウト

### UI設計

```
┌─────────────────────────────────────┐
│  セキュリティ設定                    │
├─────────────────────────────────────┤
│                                     │
│  アクティブセッション                 │
│  ┌─────────────────────────────┐   │
│  │ 🖥️ Mac - Chrome            │   │
│  │   IPアドレス: 192.168.1.5   │   │
│  │   東京, 日本                │   │
│  │   最終アクセス: 2分前        │   │
│  │   [現在のデバイス]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📱 iPhone - Safari         │   │
│  │   IPアドレス: 203.0.113.42  │   │
│  │   大阪, 日本                │   │
│  │   最終アクセス: 1時間前      │   │
│  │   [ログアウト]              │   │
│  └─────────────────────────────┘   │
│                                     │
│  [全デバイスからログアウト]          │
│                                     │
│  ログイン履歴                        │
│  ┌─────────────────────────────┐   │
│  │ 2025-11-11 17:30           │   │
│  │ 192.168.1.5 | Mac - Chrome │   │
│  │ 東京, 日本 | [成功]        │   │
│  │                            │   │
│  │ 2025-11-10 09:15           │   │
│  │ 203.0.113.10 | Windows - Edge│ │
│  │ 不明 | [失敗: パスワード誤り] │   │
│  └─────────────────────────────┘   │
│                                     │
│  自動ログアウト                      │
│  [1時間 ▼]                          │
│                                     │
└─────────────────────────────────────┘
```

### データベーススキーマ

```sql
-- セッション管理テーブル
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,

  device_name TEXT, -- Mac, iPhone, Windows等
  browser_name TEXT, -- Chrome, Safari, Firefox等
  ip_address INET,
  country TEXT,
  city TEXT,

  login_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  is_current BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_user_sessions_user_id (user_id),
  INDEX idx_user_sessions_expires_at (expires_at)
);

-- ログイン履歴テーブル
CREATE TABLE login_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  login_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address INET,
  country TEXT,
  city TEXT,
  device_name TEXT,
  browser_name TEXT,

  status TEXT NOT NULL, -- success | failed
  failure_reason TEXT, -- wrong_password | account_locked | etc.

  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_login_history_user_id (user_id),
  INDEX idx_login_history_login_at (login_at)
);

-- user_settings テーブル（セキュリティ設定部分）
ALTER TABLE user_settings ADD COLUMN session_timeout_minutes INTEGER DEFAULT 60;
```

### API設計

#### GET `/api/settings/security/sessions`
アクティブセッション一覧を取得

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "device_name": "Mac",
      "browser_name": "Chrome",
      "ip_address": "192.168.1.5",
      "country": "Japan",
      "city": "Tokyo",
      "login_at": "2025-11-11T17:30:00Z",
      "last_activity_at": "2025-11-11T17:45:00Z",
      "is_current": true
    }
  ]
}
```

#### DELETE `/api/settings/security/sessions/:sessionId`
特定のセッションをログアウト

**Response:**
```json
{
  "message": "セッションをログアウトしました"
}
```

#### POST `/api/settings/security/sessions/logout-all`
全セッションからログアウト（現在のセッションを除く）

**Response:**
```json
{
  "message": "全デバイスからログアウトしました",
  "logged_out_count": 3
}
```

#### GET `/api/settings/security/login-history`
ログイン履歴を取得

**Query Parameters:**
- `limit` (default: 50)
- `offset` (default: 0)
- `status` (optional: success | failed)

**Response:**
```json
{
  "history": [
    {
      "id": "uuid",
      "login_at": "2025-11-11T17:30:00Z",
      "ip_address": "192.168.1.5",
      "country": "Japan",
      "city": "Tokyo",
      "device_name": "Mac",
      "browser_name": "Chrome",
      "status": "success"
    }
  ],
  "total": 150
}
```

---

## 3. 言語設定

### 目的
ユーザーの好みの言語でUIを表示する

### 機能要件

#### 3.1 言語選択
- **対応言語**
  - 日本語 (ja)
  - English (en)
  - 将来的に追加可能な設計

- **言語切り替え**
  - 即座にUI全体が切り替わる
  - リロード不要
  - 設定を保存してセッション間で保持

#### 3.2 多言語対応の範囲
- UI全体（ボタン、ラベル、メッセージ等）
- エラーメッセージ
- 通知メッセージ
- メールテンプレート

### UI設計

```
┌─────────────────────────────────────┐
│  言語設定                            │
├─────────────────────────────────────┤
│                                     │
│  UIの表示言語を選択                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ○ 日本語 (Japanese)        │   │
│  │ ○ English                  │   │
│  └─────────────────────────────┘   │
│                                     │
│  選択した言語はすぐに反映されます     │
│                                     │
└─────────────────────────────────────┘
```

### データベーススキーマ

```sql
-- user_settings テーブル（言語設定部分）
ALTER TABLE user_settings ADD COLUMN language TEXT DEFAULT 'ja'; -- ja | en
```

### API設計

#### PATCH `/api/settings/language`
言語設定を更新

**Request:**
```json
{
  "language": "en"
}
```

**Response:**
```json
{
  "message": "言語設定を更新しました",
  "language": "en"
}
```

### 実装方法
- **next-i18next** または **next-intl** を使用
- 翻訳ファイルを `locales/ja.json`, `locales/en.json` で管理
- Zustand storeで現在の言語を管理

---

## 4. タイムゾーン設定

### 目的
ユーザーの地域に合わせた日時表示を提供する

### 機能要件

#### 4.1 タイムゾーン選択
- **主要タイムゾーン**
  - Asia/Tokyo (UTC+9)
  - America/New_York (UTC-5/-4)
  - America/Los_Angeles (UTC-8/-7)
  - Europe/London (UTC+0/+1)
  - その他IANA Timezone Database準拠

- **タイムゾーン検索**
  - 都市名で検索可能
  - 国名で検索可能

#### 4.2 日時表示への反映
- プロジェクト期限
- ログイン履歴の日時
- 通知の日時
- エージェントタスクの実行日時

### UI設計

```
┌─────────────────────────────────────┐
│  タイムゾーン設定                    │
├─────────────────────────────────────┤
│                                     │
│  タイムゾーンを選択                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [検索... 🔍]                │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Asia/Tokyo (UTC+9)         │   │
│  │ 現在時刻: 2025-11-11 17:45  │   │
│  └─────────────────────────────┘   │
│                                     │
│  よく使われるタイムゾーン             │
│  • America/New_York (UTC-5)        │
│  • Europe/London (UTC+0)           │
│  • Asia/Singapore (UTC+8)          │
│                                     │
│  [保存]                             │
└─────────────────────────────────────┘
```

### データベーススキーマ

```sql
-- user_settings テーブル（タイムゾーン設定部分）
ALTER TABLE user_settings ADD COLUMN timezone TEXT DEFAULT 'Asia/Tokyo';
```

### API設計

#### PATCH `/api/settings/timezone`
タイムゾーン設定を更新

**Request:**
```json
{
  "timezone": "America/New_York"
}
```

**Response:**
```json
{
  "message": "タイムゾーン設定を更新しました",
  "timezone": "America/New_York",
  "current_time": "2025-11-11T03:45:00-05:00"
}
```

### 実装方法
- **date-fns-tz** または **luxon** を使用
- すべての日時表示でユーザーのタイムゾーンを適用
- サーバー側ではUTCで保存、クライアント側でタイムゾーン変換

---

## 5. プライバシー設定

### 目的
ユーザーデータの管理と削除を可能にし、GDPRなどの規制に準拠する

### 機能要件

#### 5.1 データ共有設定
- **使用状況データの収集**
  - 有効/無効切り替え
  - 収集されるデータの説明

- **匿名分析データの提供**
  - 有効/無効切り替え
  - プラットフォーム改善のための匿名データ提供

#### 5.2 データエクスポート
- **全データのエクスポート**
  - JSON形式でダウンロード
  - 含まれるデータ：
    - プロフィール情報
    - プロジェクトデータ
    - 売上データ
    - 設定情報
    - ログイン履歴

- **エクスポート処理**
  - バックグラウンドで処理
  - 完了時にメール通知 + ダウンロードリンク
  - リンク有効期限: 7日間

#### 5.3 アカウント削除
- **アカウント削除機能**
  - 確認ダイアログ（二段階）
  - パスワード再入力必須
  - 削除内容の説明
  - 削除実行後の処理：
    - 全データを削除
    - 関連するセッションを無効化
    - 確認メール送信

- **削除猶予期間**
  - 削除リクエスト後30日間は復旧可能
  - 猶予期間中はログイン不可
  - 猶予期間終了後に完全削除

### UI設計

```
┌─────────────────────────────────────┐
│  プライバシー設定                    │
├─────────────────────────────────────┤
│                                     │
│  データ共有                          │
│  ┌─────────────────────────────┐   │
│  │ [✓] 使用状況データの収集    │   │
│  │     サービス改善のため      │   │
│  │                            │   │
│  │ [✓] 匿名分析データの提供    │   │
│  │     プラットフォーム改善    │   │
│  └─────────────────────────────┘   │
│                                     │
│  データエクスポート                  │
│  ┌─────────────────────────────┐   │
│  │ 全データをJSON形式で        │   │
│  │ ダウンロードできます        │   │
│  │                            │   │
│  │ [データをエクスポート]      │   │
│  └─────────────────────────────┘   │
│                                     │
│  ⚠️ 危険な操作                      │
│  ┌─────────────────────────────┐   │
│  │ アカウント削除              │   │
│  │                            │   │
│  │ すべてのデータが削除されます │   │
│  │ この操作は取り消せません    │   │
│  │                            │   │
│  │ [アカウントを削除]          │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### データベーススキーマ

```sql
-- user_settings テーブル（プライバシー設定部分）
ALTER TABLE user_settings ADD COLUMN collect_usage_data BOOLEAN DEFAULT true;
ALTER TABLE user_settings ADD COLUMN share_anonymous_data BOOLEAN DEFAULT true;

-- データエクスポートリクエストテーブル
CREATE TABLE data_export_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  status TEXT DEFAULT 'pending', -- pending | processing | completed | failed
  file_url TEXT,
  expires_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  INDEX idx_data_export_requests_user_id (user_id),
  INDEX idx_data_export_requests_status (status)
);

-- アカウント削除リクエストテーブル
CREATE TABLE account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  requested_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_deletion_at TIMESTAMPTZ, -- 30日後
  status TEXT DEFAULT 'pending', -- pending | cancelled | completed

  INDEX idx_account_deletion_requests_user_id (user_id),
  INDEX idx_account_deletion_requests_scheduled_deletion_at (scheduled_deletion_at)
);
```

### API設計

#### POST `/api/settings/privacy/export`
データエクスポートをリクエスト

**Response:**
```json
{
  "message": "データエクスポートをリクエストしました。完了時にメールで通知します。",
  "request_id": "uuid"
}
```

#### POST `/api/settings/privacy/delete-account`
アカウント削除をリクエスト

**Request:**
```json
{
  "password": "user_password",
  "confirmation": "DELETE"
}
```

**Response:**
```json
{
  "message": "アカウント削除をリクエストしました。30日後に完全削除されます。",
  "scheduled_deletion_at": "2025-12-11T17:45:00Z"
}
```

#### POST `/api/settings/privacy/cancel-deletion`
アカウント削除をキャンセル

**Response:**
```json
{
  "message": "アカウント削除をキャンセルしました"
}
```

---

## 6. API設定

### 目的
外部APIキーを安全に管理し、AIエージェントやインテグレーションで使用する

### 機能要件

#### 6.1 APIキー管理
- **OpenAI API Key**
  - キーの登録/更新/削除
  - マスク表示（末尾4文字のみ表示）
  - テスト接続機能
  - 使用量の表示（可能な場合）

- **その他のAPI Key**
  - カスタムAPIキーの追加
  - キー名、値、説明を管理
  - 暗号化して保存

#### 6.2 セキュリティ機能
- **暗号化保存**
  - すべてのAPIキーを暗号化してデータベースに保存
  - 復号化はサーバーサイドでのみ実行

- **アクセスログ**
  - APIキー使用履歴の記録
  - 異常なアクセスの検知

#### 6.3 Supabase設定（Readonly）
- プロジェクトURL
- Anon Key
- サービスロールキー（マスク表示）

### UI設計

```
┌─────────────────────────────────────┐
│  API設定                            │
├─────────────────────────────────────┤
│                                     │
│  OpenAI API Key                     │
│  ┌─────────────────────────────┐   │
│  │ sk-...abc123 [表示] [削除]  │   │
│  │ [接続テスト] ✓ 接続成功      │   │
│  │                            │   │
│  │ または                      │   │
│  │ [新しいキーを追加]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  カスタムAPI Key                     │
│  ┌─────────────────────────────┐   │
│  │ [+ 新しいAPIキーを追加]     │   │
│  └─────────────────────────────┘   │
│                                     │
│  Supabase設定（読み取り専用）        │
│  ┌─────────────────────────────┐   │
│  │ Project URL:               │   │
│  │ https://xxx.supabase.co    │   │
│  │                            │   │
│  │ Anon Key:                  │   │
│  │ eyJh...xyz [コピー]        │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### データベーススキーマ

```sql
-- APIキー管理テーブル
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  key_name TEXT NOT NULL, -- openai | custom_name
  key_value_encrypted TEXT NOT NULL, -- 暗号化されたAPIキー
  description TEXT,

  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, key_name),
  INDEX idx_api_keys_user_id (user_id)
);

-- APIキー使用ログテーブル
CREATE TABLE api_key_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,

  used_at TIMESTAMPTZ DEFAULT NOW(),
  endpoint TEXT,
  status TEXT, -- success | failed
  error_message TEXT,

  INDEX idx_api_key_usage_logs_api_key_id (api_key_id),
  INDEX idx_api_key_usage_logs_used_at (used_at)
);
```

### API設計

#### GET `/api/settings/api-keys`
APIキー一覧を取得（マスク表示）

**Response:**
```json
{
  "keys": [
    {
      "id": "uuid",
      "key_name": "openai",
      "key_value_masked": "sk-...abc123",
      "description": "OpenAI API Key",
      "is_active": true,
      "last_used_at": "2025-11-11T17:30:00Z"
    }
  ]
}
```

#### POST `/api/settings/api-keys`
新しいAPIキーを追加

**Request:**
```json
{
  "key_name": "openai",
  "key_value": "sk-proj-...",
  "description": "OpenAI API Key for AI Agent"
}
```

**Response:**
```json
{
  "message": "APIキーを追加しました",
  "key": {
    "id": "uuid",
    "key_name": "openai",
    "key_value_masked": "sk-...xyz789"
  }
}
```

#### POST `/api/settings/api-keys/:keyId/test`
APIキーの接続テスト

**Response:**
```json
{
  "status": "success",
  "message": "接続に成功しました"
}
```

#### DELETE `/api/settings/api-keys/:keyId`
APIキーを削除

**Response:**
```json
{
  "message": "APIキーを削除しました"
}
```

---

## 7. インテグレーション

### 目的
外部サービスと連携してプラットフォームの機能を拡張する

### 機能要件

#### 7.1 連携可能サービス

**通知系**
- **Slack**
  - タスク完了通知
  - エージェント実行結果の送信
  - OAuth認証

- **Discord**
  - Webhook経由での通知送信
  - チャンネル選択

**開発系**
- **GitHub**
  - リポジトリ連携
  - Issue作成
  - Pull Request通知
  - OAuth認証

**生産性系**
- **Google Calendar**
  - プロジェクト期限の同期
  - スケジュール連携
  - OAuth認証

- **Notion**
  - プロジェクトデータの同期
  - データベース連携
  - OAuth認証

#### 7.2 連携機能
- **OAuth認証フロー**
  - 安全な認証プロセス
  - アクセストークンの暗号化保存
  - リフレッシュトークンの管理

- **連携状態管理**
  - 有効/無効の切り替え
  - 連携解除
  - 再認証

- **Webhook設定**
  - カスタムWebhookの登録
  - ペイロード設定
  - テスト送信

### UI設計

```
┌─────────────────────────────────────┐
│  インテグレーション                  │
├─────────────────────────────────────┤
│                                     │
│  連携サービス                        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 💬 Slack                   │   │
│  │    タスク完了通知を送信     │   │
│  │    [連携する]               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🎮 Discord                 │   │
│  │    Webhook経由で通知        │   │
│  │    [Webhookを設定]          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 🐙 GitHub                  │   │
│  │    リポジトリと連携中       │   │
│  │    ✓ 連携済み [解除]        │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📅 Google Calendar         │   │
│  │    スケジュール同期         │   │
│  │    [連携する]               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📝 Notion                  │   │
│  │    プロジェクトデータ同期   │   │
│  │    [連携する]               │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### データベーススキーマ

```sql
-- インテグレーション設定テーブル
CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  service_name TEXT NOT NULL, -- slack | discord | github | google_calendar | notion
  is_active BOOLEAN DEFAULT true,

  -- OAuth認証情報（暗号化）
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,

  -- サービス固有の設定（JSON）
  config JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, service_name),
  INDEX idx_integrations_user_id (user_id)
);

-- Webhook設定テーブル
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  webhook_url TEXT NOT NULL,
  webhook_name TEXT,
  description TEXT,

  -- イベントタイプ（どのイベントで発火するか）
  event_types TEXT[] DEFAULT '{}', -- agent_task_completed | project_created | etc.

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX idx_webhooks_user_id (user_id)
);
```

### API設計

#### GET `/api/settings/integrations`
インテグレーション一覧を取得

**Response:**
```json
{
  "integrations": [
    {
      "id": "uuid",
      "service_name": "github",
      "is_active": true,
      "config": {
        "repository": "username/repo"
      },
      "created_at": "2025-11-10T10:00:00Z"
    }
  ]
}
```

#### POST `/api/settings/integrations/:service/connect`
サービスとの連携を開始（OAuth開始）

**Response:**
```json
{
  "auth_url": "https://github.com/login/oauth/authorize?client_id=..."
}
```

#### POST `/api/settings/integrations/:service/disconnect`
サービスとの連携を解除

**Response:**
```json
{
  "message": "連携を解除しました"
}
```

#### POST `/api/settings/webhooks`
Webhookを追加

**Request:**
```json
{
  "webhook_url": "https://discord.com/api/webhooks/...",
  "webhook_name": "Discord Notification",
  "event_types": ["agent_task_completed"]
}
```

**Response:**
```json
{
  "message": "Webhookを追加しました",
  "webhook": {
    "id": "uuid",
    "webhook_url": "https://discord.com/api/webhooks/...",
    "webhook_name": "Discord Notification"
  }
}
```

---

## 📊 実装優先順位

### Phase 1: 基盤整備（1-2日）
1. ✅ `user_settings` テーブル作成
2. ✅ `user_sessions` テーブル作成
3. ✅ `login_history` テーブル作成
4. ✅ 基本APIエンドポイント実装

### Phase 2: 通知設定（2-3日）
1. ✅ 通知設定UI実装
2. ✅ 通知設定API実装
3. ✅ ブラウザ通知機能実装
4. ✅ メール通知テンプレート作成

### Phase 3: セキュリティ設定（2-3日）
1. ✅ セッション管理UI実装
2. ✅ セッション管理API実装
3. ✅ ログイン履歴UI実装
4. ✅ ログイン履歴API実装

### Phase 4: その他設定（2-3日）
1. ✅ 言語設定実装（next-intl導入）
2. ✅ タイムゾーン設定実装
3. ✅ プライバシー設定UI実装
4. ✅ データエクスポート機能実装
5. ✅ アカウント削除機能実装

### Phase 5: API設定（1-2日）
1. ✅ APIキー管理UI実装
2. ✅ APIキー暗号化機能実装
3. ✅ 接続テスト機能実装

### Phase 6: インテグレーション（3-4日）
1. ✅ インテグレーションUI実装
2. ✅ OAuth認証フロー実装
3. ✅ Slack/Discord連携実装
4. ✅ GitHub/Google Calendar/Notion連携実装
5. ✅ Webhook機能実装

---

## 🔐 セキュリティ考慮事項

### データ保護
- すべてのAPIキーを暗号化して保存
- OAuthトークンを暗号化して保存
- パスワード再入力による二段階認証

### アクセス制御
- RLS（Row Level Security）の活用
- ユーザーごとのデータ分離
- セッション管理の厳格化

### 監査ログ
- 重要な操作のログ記録
- セキュリティイベントの追跡
- 異常検知の仕組み

---

## 📝 備考

- すべての設定は即座に保存される（自動保存）
- 設定変更時には成功/失敗のトースト通知を表示
- エラーハンドリングを適切に実装
- ローディング状態を明確に表示
- レスポンシブ対応（デスクトップのみ対応予定）
