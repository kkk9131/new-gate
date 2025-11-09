# API設計書

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **APIバージョン**: v1
- **ベースURL**: `/api`
- **認証方式**: Supabase JWT (Bearer Token)

---

## 🔐 認証

すべてのAPIエンドポイント（`/api/create-session`を除く）は認証が必要です。

### 認証ヘッダー
```http
Authorization: Bearer <supabase-jwt-token>
```

### 認証エラー
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証が必要です"
  }
}
```

---

## 📦 共通仕様

### レスポンス形式

#### 成功時
```json
{
  "data": { ... }  // または配列
}
```

#### エラー時
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": { ... }  // 詳細情報（オプション）
  }
}
```

### HTTPステータスコード

| コード | 意味 | 使用ケース |
|--------|------|-----------|
| 200 | OK | 成功（GET, PATCH, DELETE） |
| 201 | Created | 作成成功（POST） |
| 400 | Bad Request | リクエストが不正 |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 権限エラー |
| 404 | Not Found | リソースが存在しない |
| 500 | Internal Server Error | サーバーエラー |

### エラーコード一覧

| コード | 説明 |
|--------|------|
| UNAUTHORIZED | 認証エラー |
| FORBIDDEN | 権限不足 |
| NOT_FOUND | リソースが見つからない |
| VALIDATION_ERROR | バリデーションエラー |
| DATABASE_ERROR | データベースエラー |
| INTERNAL_ERROR | 内部エラー |

---

## 🗂️ プロジェクト管理API

### 1. プロジェクト一覧取得

#### エンドポイント
```
GET /api/projects
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| status | string | NO | - | ステータスフィルター（active/completed/on_hold） |
| limit | number | NO | 50 | 取得件数（最大100） |
| offset | number | NO | 0 | オフセット |

#### リクエスト例
```http
GET /api/projects?status=active&limit=20&offset=0
Authorization: Bearer <token>
```

#### レスポンス例（200 OK）
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "新規Webサイト構築",
      "description": "コーポレートサイトのリニューアル",
      "status": "active",
      "startDate": "2025-01-01",
      "endDate": "2025-03-31",
      "budget": 5000000,
      "actualCost": 2500000,
      "userId": "user-uuid",
      "isDeleted": false,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-15T12:00:00Z"
    }
  ]
}
```

---

### 2. プロジェクト作成

#### エンドポイント
```
POST /api/projects
```

#### リクエストボディ
```json
{
  "name": "プロジェクト名",
  "description": "説明（オプション）",
  "startDate": "2025-01-01",
  "endDate": "2025-03-31",  // オプション
  "budget": 5000000,
  "status": "active"  // オプション（デフォルト: active）
}
```

#### バリデーション

| フィールド | ルール |
|-----------|--------|
| name | 必須、1-255文字 |
| description | オプション |
| startDate | 必須、YYYY-MM-DD形式 |
| endDate | オプション、YYYY-MM-DD形式、startDate以降 |
| budget | 必須、0以上の数値 |
| status | オプション、active/completed/on_holdのいずれか |

#### レスポンス例（201 Created）
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "プロジェクト名",
    "description": "説明",
    "status": "active",
    "startDate": "2025-01-01",
    "endDate": "2025-03-31",
    "budget": 5000000,
    "actualCost": 0,
    "userId": "user-uuid",
    "isDeleted": false,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

#### エラー例（400 Bad Request）
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "バリデーションエラー",
    "details": {
      "name": "プロジェクト名は必須です",
      "budget": "予算は0以上の数値である必要があります"
    }
  }
}
```

---

### 3. プロジェクト詳細取得

#### エンドポイント
```
GET /api/projects/[id]
```

#### リクエスト例
```http
GET /api/projects/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "新規Webサイト構築",
    "description": "コーポレートサイトのリニューアル",
    "status": "active",
    "startDate": "2025-01-01",
    "endDate": "2025-03-31",
    "budget": 5000000,
    "actualCost": 2500000,
    "userId": "user-uuid",
    "isDeleted": false,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T12:00:00Z"
  }
}
```

#### エラー例（404 Not Found）
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "プロジェクトが見つかりません"
  }
}
```

---

### 4. プロジェクト更新

#### エンドポイント
```
PATCH /api/projects/[id]
```

#### リクエストボディ（部分更新）
```json
{
  "name": "更新後のプロジェクト名",
  "status": "completed",
  "actualCost": 4500000
}
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "更新後のプロジェクト名",
    "description": "コーポレートサイトのリニューアル",
    "status": "completed",
    "startDate": "2025-01-01",
    "endDate": "2025-03-31",
    "budget": 5000000,
    "actualCost": 4500000,
    "userId": "user-uuid",
    "isDeleted": false,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-03-31T15:30:00Z"
  }
}
```

---

### 5. プロジェクト削除（ソフトデリート）

#### エンドポイント
```
DELETE /api/projects/[id]
```

#### リクエスト例
```http
DELETE /api/projects/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "message": "プロジェクトを削除しました",
    "id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## ⚙️ 設定管理API

### 6. ユーザー設定取得

#### エンドポイント
```
GET /api/settings/user
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "id": "setting-uuid",
    "userId": "user-uuid",
    "displayName": "山田太郎",
    "language": "ja",
    "timezone": "Asia/Tokyo",
    "theme": "light",
    "notificationEnabled": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### 7. ユーザー設定更新

#### エンドポイント
```
PATCH /api/settings/user
```

#### リクエストボディ（部分更新）
```json
{
  "displayName": "山田花子",
  "theme": "dark",
  "notificationEnabled": false
}
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "id": "setting-uuid",
    "userId": "user-uuid",
    "displayName": "山田花子",
    "language": "ja",
    "timezone": "Asia/Tokyo",
    "theme": "dark",
    "notificationEnabled": false,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-02-01T10:30:00Z"
  }
}
```

---

### 8. アプリ設定取得

#### エンドポイント
```
GET /api/settings/app
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "id": "app-setting-uuid",
    "userId": "user-uuid",
    "defaultCurrency": "JPY",
    "fiscalYearStart": 4,
    "taxRate": 10.00,
    "companyName": "株式会社サンプル",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### 9. アプリ設定更新

#### エンドポイント
```
PATCH /api/settings/app
```

#### リクエストボディ（部分更新）
```json
{
  "taxRate": 10.00,
  "companyName": "株式会社新サンプル"
}
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "id": "app-setting-uuid",
    "userId": "user-uuid",
    "defaultCurrency": "JPY",
    "fiscalYearStart": 4,
    "taxRate": 10.00,
    "companyName": "株式会社新サンプル",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-02-15T14:00:00Z"
  }
}
```

---

## 💰 売上確認API

### 10. 売上一覧取得

#### エンドポイント
```
GET /api/revenues
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| startDate | string | NO | - | 開始日（YYYY-MM-DD） |
| endDate | string | NO | - | 終了日（YYYY-MM-DD） |
| projectId | string | NO | - | プロジェクトID |
| limit | number | NO | 50 | 取得件数 |
| offset | number | NO | 0 | オフセット |

#### リクエスト例
```http
GET /api/revenues?startDate=2025-01-01&endDate=2025-01-31&limit=20
Authorization: Bearer <token>
```

#### レスポンス例（200 OK）
```json
{
  "data": [
    {
      "id": "revenue-uuid",
      "projectId": "project-uuid",
      "userId": "user-uuid",
      "amount": 1000000,
      "currency": "JPY",
      "revenueDate": "2025-01-15",
      "description": "Webサイト制作費",
      "category": "制作",
      "taxIncluded": true,
      "taxAmount": 90909,
      "isDeleted": false,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z"
    }
  ]
}
```

---

### 11. 売上登録

#### エンドポイント
```
POST /api/revenues
```

#### リクエストボディ
```json
{
  "projectId": "project-uuid",  // オプション
  "amount": 1000000,
  "currency": "JPY",  // オプション（デフォルト: JPY）
  "revenueDate": "2025-01-15",
  "description": "Webサイト制作費",
  "category": "制作",  // オプション
  "taxIncluded": true,
  "taxAmount": 90909
}
```

#### レスポンス例（201 Created）
```json
{
  "data": {
    "id": "revenue-uuid",
    "projectId": "project-uuid",
    "userId": "user-uuid",
    "amount": 1000000,
    "currency": "JPY",
    "revenueDate": "2025-01-15",
    "description": "Webサイト制作費",
    "category": "制作",
    "taxIncluded": true,
    "taxAmount": 90909,
    "isDeleted": false,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

---

### 12. 売上詳細取得

#### エンドポイント
```
GET /api/revenues/[id]
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "id": "revenue-uuid",
    "projectId": "project-uuid",
    "userId": "user-uuid",
    "amount": 1000000,
    "currency": "JPY",
    "revenueDate": "2025-01-15",
    "description": "Webサイト制作費",
    "category": "制作",
    "taxIncluded": true,
    "taxAmount": 90909,
    "isDeleted": false,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

---

### 13. 売上更新

#### エンドポイント
```
PATCH /api/revenues/[id]
```

#### リクエストボディ（部分更新）
```json
{
  "amount": 1100000,
  "description": "Webサイト制作費（追加機能込み）"
}
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "id": "revenue-uuid",
    "projectId": "project-uuid",
    "userId": "user-uuid",
    "amount": 1100000,
    "currency": "JPY",
    "revenueDate": "2025-01-15",
    "description": "Webサイト制作費（追加機能込み）",
    "category": "制作",
    "taxIncluded": true,
    "taxAmount": 100000,
    "isDeleted": false,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-20T15:00:00Z"
  }
}
```

---

### 14. 売上削除

#### エンドポイント
```
DELETE /api/revenues/[id]
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "message": "売上を削除しました",
    "id": "revenue-uuid"
  }
}
```

---

### 15. 売上集計

#### エンドポイント
```
GET /api/revenues/summary
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| startDate | string | YES | - | 開始日（YYYY-MM-DD） |
| endDate | string | YES | - | 終了日（YYYY-MM-DD） |
| projectId | string | NO | - | プロジェクトID（指定時はプロジェクト別集計） |
| groupBy | string | NO | - | グループ化（month/project） |

#### リクエスト例
```http
GET /api/revenues/summary?startDate=2025-01-01&endDate=2025-01-31
Authorization: Bearer <token>
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "totalAmount": 5000000,
    "taxAmount": 454545,
    "netAmount": 4545455,
    "count": 5,
    "period": {
      "start": "2025-01-01",
      "end": "2025-01-31"
    }
  }
}
```

#### 月別グループ化例
```http
GET /api/revenues/summary?startDate=2025-01-01&endDate=2025-12-31&groupBy=month
```

```json
{
  "data": [
    {
      "month": "2025-01",
      "totalAmount": 5000000,
      "taxAmount": 454545,
      "netAmount": 4545455,
      "count": 5
    },
    {
      "month": "2025-02",
      "totalAmount": 3000000,
      "taxAmount": 272727,
      "netAmount": 2727273,
      "count": 3
    }
  ]
}
```

---

## 💬 ChatKit API

### 16. ChatKitセッション作成

#### エンドポイント
```
POST /api/create-session
```

#### 認証
このエンドポイントは認証不要（ChatKitが内部的に使用）

#### リクエストボディ
```json
{
  "userId": "user-uuid"  // オプション
}
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "sessionId": "session-uuid",
    "token": "chatkit-session-token",
    "expiresAt": "2025-01-01T12:00:00Z"
  }
}
```

---

## 🔧 実装ガイド

### ファイル構造（Next.js App Router）

```
app/
├── api/
│   ├── create-session/
│   │   └── route.ts          # ChatKitセッション作成
│   ├── projects/
│   │   ├── route.ts          # GET/POST /api/projects
│   │   └── [id]/
│   │       └── route.ts      # GET/PATCH/DELETE /api/projects/[id]
│   ├── settings/
│   │   ├── user/
│   │   │   └── route.ts      # GET/PATCH /api/settings/user
│   │   └── app/
│   │       └── route.ts      # GET/PATCH /api/settings/app
│   └── revenues/
│       ├── route.ts          # GET/POST /api/revenues
│       ├── summary/
│       │   └── route.ts      # GET /api/revenues/summary
│       └── [id]/
│           └── route.ts      # GET/PATCH/DELETE /api/revenues/[id]
```

### 共通ユーティリティ

#### 認証ミドルウェア
```typescript
// lib/auth.ts
import { createClient } from '@supabase/supabase-js';

export async function verifyAuth(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED');
  }

  const token = authHeader.substring(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error('UNAUTHORIZED');
  }

  return user;
}
```

#### エラーハンドラー
```typescript
// lib/error-handler.ts
export function handleAPIError(error: any) {
  if (error.message === 'UNAUTHORIZED') {
    return new Response(
      JSON.stringify({
        error: {
          code: 'UNAUTHORIZED',
          message: '認証が必要です'
        }
      }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // その他のエラー処理...
}
```

---

## 🔌 プラグインストアAPI（Phase 2）

### 17. プラグイン一覧取得

#### エンドポイント
```
GET /api/store/plugins
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| category | string | NO | - | カテゴリフィルター |
| search | string | NO | - | 検索キーワード |
| sortBy | string | NO | popular | ソート（popular/rating/recent） |
| limit | number | NO | 20 | 取得件数 |
| offset | number | NO | 0 | オフセット |

#### リクエスト例
```http
GET /api/store/plugins?category=business&sortBy=popular&limit=20
Authorization: Bearer <token>
```

#### レスポンス例（200 OK）
```json
{
  "data": [
    {
      "id": "plugin-uuid",
      "pluginId": "com.platform.revenue",
      "name": "売上管理プラグイン",
      "description": "売上データを管理",
      "iconUrl": "https://...",
      "category": "business",
      "latestVersion": "1.0.0",
      "averageRating": 4.5,
      "reviewCount": 120,
      "downloadCount": 5000,
      "price": 0,
      "isFree": true,
      "isOfficial": true,
      "authorName": "Platform Team"
    }
  ]
}
```

---

### 18. プラグイン詳細取得

#### エンドポイント
```
GET /api/store/plugins/[pluginId]
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "id": "plugin-uuid",
    "pluginId": "com.platform.revenue",
    "name": "売上管理プラグイン",
    "description": "売上データを管理",
    "longDescription": "詳細な説明...",
    "iconUrl": "https://...",
    "screenshots": ["https://...", "https://..."],
    "category": "business",
    "tags": ["売上", "会計"],
    "latestVersion": "1.0.0",
    "minPlatformVersion": "1.0.0",
    "averageRating": 4.5,
    "reviewCount": 120,
    "downloadCount": 5000,
    "installCount": 3000,
    "price": 0,
    "isFree": true,
    "isOfficial": true,
    "authorId": "author-uuid",
    "authorName": "Platform Team",
    "publishedAt": "2025-01-01T00:00:00Z",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-15T00:00:00Z"
  }
}
```

---

### 19. プラグインインストール

#### エンドポイント
```
POST /api/store/plugins/[pluginId]/install
```

#### リクエストボディ
```json
{
  "version": "1.0.0"  // オプション（デフォルト: latest）
}
```

#### レスポンス例（201 Created）
```json
{
  "data": {
    "id": "installation-uuid",
    "userId": "user-uuid",
    "pluginId": "com.platform.revenue",
    "installedVersion": "1.0.0",
    "isActive": true,
    "installedAt": "2025-01-20T10:00:00Z"
  }
}
```

---

### 20. プラグインアンインストール

#### エンドポイント
```
DELETE /api/store/plugins/[pluginId]/install
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "message": "プラグインをアンインストールしました",
    "pluginId": "com.platform.revenue"
  }
}
```

---

### 21. インストール済みプラグイン一覧

#### エンドポイント
```
GET /api/plugins/installed
```

#### レスポンス例（200 OK）
```json
{
  "data": [
    {
      "id": "installation-uuid",
      "pluginId": "com.platform.revenue",
      "installedVersion": "1.0.0",
      "isActive": true,
      "isAutoUpdate": false,
      "installedAt": "2025-01-20T10:00:00Z",
      "lastUsedAt": "2025-01-25T15:00:00Z"
    }
  ]
}
```

---

### 22. プラグイン有効化/無効化

#### エンドポイント
```
PATCH /api/plugins/[pluginId]/status
```

#### リクエストボディ
```json
{
  "isActive": false
}
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "pluginId": "com.platform.revenue",
    "isActive": false,
    "updatedAt": "2025-01-26T09:00:00Z"
  }
}
```

---

### 23. プラグインレビュー投稿

#### エンドポイント
```
POST /api/store/plugins/[pluginId]/reviews
```

#### リクエストボディ
```json
{
  "rating": 5,
  "title": "とても使いやすい",
  "comment": "売上管理が簡単になりました"
}
```

#### バリデーション

| フィールド | ルール |
|-----------|--------|
| rating | 必須、1-5の整数 |
| title | オプション、最大255文字 |
| comment | オプション |

#### レスポンス例（201 Created）
```json
{
  "data": {
    "id": "review-uuid",
    "pluginId": "com.platform.revenue",
    "userId": "user-uuid",
    "rating": 5,
    "title": "とても使いやすい",
    "comment": "売上管理が簡単になりました",
    "helpfulCount": 0,
    "createdAt": "2025-01-26T10:00:00Z"
  }
}
```

---

### 24. プラグインレビュー一覧取得

#### エンドポイント
```
GET /api/store/plugins/[pluginId]/reviews
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| sortBy | string | NO | recent | ソート（recent/helpful/rating） |
| limit | number | NO | 10 | 取得件数 |
| offset | number | NO | 0 | オフセット |

#### レスポンス例（200 OK）
```json
{
  "data": [
    {
      "id": "review-uuid",
      "pluginId": "com.platform.revenue",
      "userId": "user-uuid",
      "rating": 5,
      "title": "とても使いやすい",
      "comment": "売上管理が簡単になりました",
      "helpfulCount": 15,
      "createdAt": "2025-01-26T10:00:00Z",
      "updatedAt": "2025-01-26T10:00:00Z"
    }
  ]
}
```

---

## 🤖 エージェントシステムAPI（Phase 3）

### 25. エージェントタスク一覧取得

#### エンドポイント
```
GET /api/agents/tasks
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| isActive | boolean | NO | - | 有効フラグでフィルター |
| limit | number | NO | 50 | 取得件数 |
| offset | number | NO | 0 | オフセット |

#### レスポンス例（200 OK）
```json
{
  "data": [
    {
      "id": "task-uuid",
      "userId": "user-uuid",
      "name": "月次売上レポート自動生成",
      "description": "毎月1日に先月の売上レポートを生成してメール送信",
      "workflow": {
        "steps": [
          {
            "id": "fetch-revenues",
            "action": "plugin.call",
            "plugin": "com.platform.revenue",
            "method": "getRevenues",
            "params": {
              "startDate": "{{ lastMonth.start }}",
              "endDate": "{{ lastMonth.end }}"
            },
            "output": "revenues"
          }
        ]
      },
      "schedule": {
        "cron": "0 9 1 * *",
        "timezone": "Asia/Tokyo"
      },
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

---

### 26. エージェントタスク作成

#### エンドポイント
```
POST /api/agents/tasks
```

#### リクエストボディ
```json
{
  "name": "データバックアップ",
  "description": "毎週日曜日にデータをバックアップ",
  "workflow": {
    "steps": [
      {
        "id": "backup",
        "action": "plugin.call",
        "plugin": "com.platform.backup",
        "method": "createBackup",
        "output": "backupUrl"
      }
    ]
  },
  "schedule": {
    "cron": "0 2 * * 0",
    "timezone": "Asia/Tokyo"
  },
  "isActive": true
}
```

#### レスポンス例（201 Created）
```json
{
  "data": {
    "id": "task-uuid",
    "userId": "user-uuid",
    "name": "データバックアップ",
    "description": "毎週日曜日にデータをバックアップ",
    "workflow": { ... },
    "schedule": {
      "cron": "0 2 * * 0",
      "timezone": "Asia/Tokyo"
    },
    "isActive": true,
    "createdAt": "2025-01-26T12:00:00Z",
    "updatedAt": "2025-01-26T12:00:00Z"
  }
}
```

---

### 27. エージェントタスク詳細取得

#### エンドポイント
```
GET /api/agents/tasks/[taskId]
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "id": "task-uuid",
    "userId": "user-uuid",
    "name": "月次売上レポート自動生成",
    "description": "毎月1日に先月の売上レポートを生成してメール送信",
    "workflow": { ... },
    "schedule": {
      "cron": "0 9 1 * *",
      "timezone": "Asia/Tokyo"
    },
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z"
  }
}
```

---

### 28. エージェントタスク更新

#### エンドポイント
```
PATCH /api/agents/tasks/[taskId]
```

#### リクエストボディ（部分更新）
```json
{
  "name": "月次売上レポート自動生成（更新版）",
  "isActive": false
}
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "id": "task-uuid",
    "userId": "user-uuid",
    "name": "月次売上レポート自動生成（更新版）",
    "description": "毎月1日に先月の売上レポートを生成してメール送信",
    "workflow": { ... },
    "schedule": { ... },
    "isActive": false,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-26T14:00:00Z"
  }
}
```

---

### 29. エージェントタスク削除

#### エンドポイント
```
DELETE /api/agents/tasks/[taskId]
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "message": "タスクを削除しました",
    "id": "task-uuid"
  }
}
```

---

### 30. エージェントタスク手動実行

#### エンドポイント
```
POST /api/agents/tasks/[taskId]/execute
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "executionId": "execution-uuid",
    "taskId": "task-uuid",
    "status": "running",
    "startedAt": "2025-01-26T15:00:00Z"
  }
}
```

---

### 31. エージェント実行履歴取得

#### エンドポイント
```
GET /api/agents/tasks/[taskId]/executions
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| status | string | NO | - | ステータスフィルター（running/success/failed） |
| limit | number | NO | 10 | 取得件数 |
| offset | number | NO | 0 | オフセット |

#### レスポンス例（200 OK）
```json
{
  "data": [
    {
      "id": "execution-uuid",
      "taskId": "task-uuid",
      "status": "success",
      "startedAt": "2025-01-01T09:00:00Z",
      "completedAt": "2025-01-01T09:03:15Z",
      "executionTimeMs": 195000,
      "results": {
        "total": 5000000,
        "pdfUrl": "https://..."
      },
      "errorMessage": null
    }
  ]
}
```

---

### 32. エージェント実行詳細取得

#### エンドポイント
```
GET /api/agents/executions/[executionId]
```

#### レスポンス例（200 OK）
```json
{
  "data": {
    "id": "execution-uuid",
    "taskId": "task-uuid",
    "status": "success",
    "startedAt": "2025-01-01T09:00:00Z",
    "completedAt": "2025-01-01T09:03:15Z",
    "executionTimeMs": 195000,
    "results": {
      "total": 5000000,
      "pdfUrl": "https://..."
    },
    "errorMessage": null,
    "stepLogs": [
      {
        "id": "log-uuid",
        "stepId": "fetch-revenues",
        "status": "success",
        "startedAt": "2025-01-01T09:00:00Z",
        "completedAt": "2025-01-01T09:01:00Z",
        "executionTimeMs": 60000,
        "output": {
          "revenues": [ ... ]
        }
      },
      {
        "id": "log-uuid-2",
        "stepId": "aggregate-data",
        "status": "success",
        "startedAt": "2025-01-01T09:01:00Z",
        "completedAt": "2025-01-01T09:01:05Z",
        "executionTimeMs": 5000,
        "output": {
          "total": 5000000
        }
      }
    ]
  }
}
```

---

## 📚 関連ドキュメント

### プラットフォーム関連
- [プラットフォーム要件定義書](./platform-requirements.md)
- [MVP要件定義書](./mvp-requirements.md)

### プラグインシステム関連
- [プラグインアーキテクチャ](./plugin-architecture.md)
- [プラグインストア設計](./plugin-store-design.md)
- [開発者ガイド](./developer-guide.md)
- [Core API仕様](./core-api-spec.md)

### エージェントシステム関連
- [エージェントシステム設計](./agent-system-design.md)

### 実装関連
- [データベーススキーマ設計](./database-schema.md)
- [実装タスクリスト](./tasks.md)
