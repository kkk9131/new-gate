# 新時代SaaS MVP要件定義書 v2.0

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **バージョン**: 2.0（プラグインアーキテクチャ対応）
- **対象**: MVP（Minimum Viable Product）
- **目的**: プラグインプラットフォームの基盤構築

---

## 🎯 プロジェクト概要

### ビジョン

**「ユーザーに合わせて無限に進化するSaaSプラットフォームのMVP」**

Desktop OS風UIとプラグインシステムにより、ユーザーが必要な機能だけを選んでインストールできる柔軟なプラットフォームを構築します。

### MVP目標

**Phase 1: Desktop UI基盤 + デフォルトアプリ（プラグイン化）**
- ✅ Desktop OS風UI実装（Window管理、AppIconグリッド、4分割モード）
- ✅ デフォルトアプリ3つをプラグインとして実装（Projects, Settings, Revenue）
- ✅ Supabaseによるデータ永続化
- ✅ Vercelへのデプロイ

**Phase 2以降: プラグインエコシステム構築**（MVP後の拡張）
- プラグインシステム基盤
- プラグインストア
- AIエージェント自動化

### 設計思想の転換

```yaml
従来のMVP:
  - 単一画面のチャットUI
  - 機能が固定

新しいMVP:
  - Desktop OS風の拡張可能なUI
  - 基本機能をプラグイン化
  - 将来のプラグインストア展開を見据えた基盤構築
```

詳細は [プラットフォーム要件定義書](./platform-requirements.md) を参照してください。

---

## ⚙️ 技術スタック

### フロントエンド
| 技術 | バージョン | 役割 |
|------|-----------|------|
| Next.js | 16.x | フレームワーク（App Router） |
| React | 19.x | UIライブラリ |
| TypeScript | 5.9.x | 型安全性 |
| Tailwind CSS | 3.x | スタイリング |
| Zustand | 5.x | クライアント状態管理 |
| ChatKit | latest | チャットUI（OpenAI AgentKit） |

### バックエンド
| 技術 | 役割 |
|------|------|
| Next.js API Routes | RESTful APIエンドポイント |
| Next.js Server Actions | サーバーサイドロジック |
| Supabase | データベース（PostgreSQL）、認証 |
| Supabase Client | DB接続ライブラリ |

### インフラ・デプロイ
| 技術 | 役割 |
|------|------|
| Vercel | ホスティング・デプロイ |
| GitHub | バージョン管理 |

---

## 📦 機能要件

### 1. チャットUI（ChatKit）

#### 1.1 基本機能
- [ ] チャット画面の表示
- [ ] ユーザーメッセージの送信
- [ ] AIレスポンスの受信・表示
- [ ] メッセージ履歴の表示
- [ ] リアルタイムストリーミング表示

#### 1.2 コマンド解釈
チャットで以下の操作を実行可能に：
```
例）
「新しいプロジェクトを作成して」
→ プロジェクト作成画面/フローへ誘導

「今月の売上を教えて」
→ 売上データを取得して表示

「設定を変更したい」
→ 設定画面へ誘導
```

#### 1.3 技術仕様
- ChatKitコンポーネントの埋め込み
- `/api/create-session` エンドポイントでセッション管理
- OpenAI API経由でAIレスポンス生成
- メッセージ履歴をZustandで管理

---

### 2. プロジェクト管理

#### 2.1 機能一覧
- [ ] プロジェクト一覧表示
- [ ] プロジェクト作成
- [ ] プロジェクト詳細表示
- [ ] プロジェクト編集
- [ ] プロジェクト削除（ソフトデリート）
- [ ] プロジェクトステータス管理（進行中/完了/保留）

#### 2.2 データ項目
```typescript
interface Project {
  id: string;              // UUID
  name: string;            // プロジェクト名
  description: string;     // 説明
  status: 'active' | 'completed' | 'on_hold'; // ステータス
  startDate: Date;         // 開始日
  endDate: Date | null;    // 終了日（オプション）
  budget: number;          // 予算
  actualCost: number;      // 実費
  createdAt: Date;         // 作成日時
  updatedAt: Date;         // 更新日時
  userId: string;          // 作成ユーザーID（Supabase Auth）
  isDeleted: boolean;      // 削除フラグ
}
```

#### 2.3 チャット連携
- 「プロジェクト一覧を見せて」→ プロジェクト一覧取得
- 「○○プロジェクトを作成して」→ プロジェクト作成フロー開始
- 「△△プロジェクトの詳細」→ プロジェクト詳細表示
- 「××プロジェクトを完了にして」→ ステータス更新

---

### 3. 設定管理

#### 3.1 機能一覧
- [ ] ユーザー設定表示
- [ ] ユーザー設定編集
- [ ] アプリケーション設定表示
- [ ] アプリケーション設定編集

#### 3.2 設定項目

**ユーザー設定**
```typescript
interface UserSettings {
  id: string;
  userId: string;          // Supabase Auth User ID
  displayName: string;     // 表示名
  email: string;           // メールアドレス
  language: 'ja' | 'en';   // 言語設定
  timezone: string;        // タイムゾーン
  notificationEnabled: boolean; // 通知ON/OFF
  theme: 'light' | 'dark'; // テーマ
  createdAt: Date;
  updatedAt: Date;
}
```

**アプリケーション設定**
```typescript
interface AppSettings {
  id: string;
  userId: string;
  defaultCurrency: string; // デフォルト通貨（JPY, USD等）
  fiscalYearStart: number; // 会計年度開始月（1-12）
  taxRate: number;         // 消費税率（%）
  companyName: string;     // 会社名
  createdAt: Date;
  updatedAt: Date;
}
```

#### 3.3 チャット連携
- 「設定を変更したい」→ 設定画面へ
- 「表示名を○○に変更して」→ 表示名更新
- 「消費税率を10%にして」→ 税率更新

---

### 4. 売上確認

#### 4.1 機能一覧
- [ ] 売上データ一覧表示
- [ ] 期間別売上集計（日次/月次/年次）
- [ ] プロジェクト別売上集計
- [ ] 売上グラフ表示（簡易版）
- [ ] 売上データ登録
- [ ] 売上データ編集
- [ ] 売上データ削除

#### 4.2 データ項目
```typescript
interface Revenue {
  id: string;
  projectId: string;       // 紐づくプロジェクトID
  amount: number;          // 売上金額
  currency: string;        // 通貨
  date: Date;              // 売上計上日
  description: string;     // 説明
  category: string;        // カテゴリ（商品/サービス等）
  taxIncluded: boolean;    // 税込みフラグ
  taxAmount: number;       // 税額
  userId: string;          // 登録ユーザー
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}
```

#### 4.3 集計機能
```typescript
interface RevenueSummary {
  totalAmount: number;     // 総売上
  taxAmount: number;       // 総税額
  netAmount: number;       // 税抜き総額
  count: number;           // 件数
  period: {
    start: Date;
    end: Date;
  };
}
```

#### 4.4 チャット連携
- 「今月の売上を教えて」→ 月次集計表示
- 「○○プロジェクトの売上は？」→ プロジェクト別集計
- 「売上を登録したい」→ 売上登録フロー

---

## 🔐 非機能要件

<<<<<<< HEAD
### API化方針（AIエージェント統合対応）

**設計思想**
- AIエージェント統合後、可能な限りすべての操作をAPI経由で実行可能にする
- ChatUIからの操作とプログラマティックな操作の両方をサポート
- 将来的な自動化・バッチ処理への対応を考慮

**API設計原則**
- [ ] すべての機能をRESTful APIとして公開
- [ ] 統一されたレスポンス形式（`{ data: T }` または `{ error: {...} }`）
- [ ] 適切なHTTPメソッド使用（GET/POST/PATCH/DELETE）
- [ ] クエリパラメータによる柔軟なフィルタリング・ソート対応
- [ ] ページネーション対応（limit/offset）
- [ ] バルク操作APIの提供（将来実装）

**AIエージェント連携の考慮事項**
- [ ] APIレスポンスは構造化データとして提供（JSON）
- [ ] エラーメッセージは機械可読な形式で提供
- [ ] 冪等性の確保（同じリクエストを複数回実行しても安全）
- [ ] レート制限・スロットリングの実装（将来実装）
- [ ] APIバージョニング戦略（将来実装）

=======
>>>>>>> 295e1b7ee3c16689f5086896c400122000f3663f
### セキュリティ
- [ ] Supabase Row Level Security (RLS) 設定
- [ ] ユーザー認証（Supabase Auth）
- [ ] API RouteでのJWT検証
- [ ] XSS対策（Next.jsデフォルト対応）
- [ ] CSRF対策（Server Actions使用）
- [ ] 環境変数での機密情報管理

### パフォーマンス
- [ ] サーバーサイドレンダリング（SSR）活用
- [ ] データフェッチングの最適化
- [ ] 画像最適化（next/image）
- [ ] Lighthouse スコア 80+ 目標

### 可用性
- [ ] Vercel自動デプロイ設定
- [ ] エラーハンドリング実装
- [ ] フォールバックUI実装
- [ ] ローディング状態の表示

### 保守性
- [ ] TypeScript厳格モード
- [ ] ESLint設定
- [ ] コメント（日本語）記述
- [ ] コンポーネント単位の設計

---

## 🗄️ データベース設計概要

### テーブル構成（Supabase）

1. **projects** - プロジェクト管理
2. **user_settings** - ユーザー設定
3. **app_settings** - アプリケーション設定
4. **revenues** - 売上データ

※ 詳細は `database-schema.md` 参照

---

## 🌐 API設計概要

### RESTful API Endpoints

#### プロジェクト管理
- `GET /api/projects` - プロジェクト一覧取得
- `POST /api/projects` - プロジェクト作成
- `GET /api/projects/[id]` - プロジェクト詳細取得
- `PATCH /api/projects/[id]` - プロジェクト更新
- `DELETE /api/projects/[id]` - プロジェクト削除（ソフトデリート）

#### 設定管理
- `GET /api/settings/user` - ユーザー設定取得
- `PATCH /api/settings/user` - ユーザー設定更新
- `GET /api/settings/app` - アプリ設定取得
- `PATCH /api/settings/app` - アプリ設定更新

#### 売上確認
- `GET /api/revenues` - 売上一覧取得（クエリパラメータで期間指定）
- `POST /api/revenues` - 売上登録
- `GET /api/revenues/[id]` - 売上詳細取得
- `PATCH /api/revenues/[id]` - 売上更新
- `DELETE /api/revenues/[id]` - 売上削除
- `GET /api/revenues/summary` - 売上集計

#### ChatKit
- `POST /api/create-session` - ChatKitセッション作成

※ 詳細は `api-design.md` 参照

---

## 🎨 UI/UX方針

### レイアウト構成（MVP）
```
┌─────────────────────────────────┐
│         Header                   │
├─────────────────────────────────┤
│                                  │
│                                  │
│        Chat UI (ChatKit)        │
│                                  │
│                                  │
└─────────────────────────────────┘
```

### 将来の拡張（4分割UI）
```
┌──────────────┬──────────────┐
│   Screen 1   │   Screen 2   │
│              │              │
├──────────────┼──────────────┤
│   Screen 3   │   Screen 4   │
│              │              │
└──────────────┴──────────────┘
```

### デザイン原則
- **シンプル**: 最小限の操作で目的達成
- **直感的**: チャットベースの自然な対話
- **レスポンシブ**: モバイル対応（将来）
- **アクセシブル**: WCAG 2.1 AA準拠（将来）

---

## 🚀 デプロイメント戦略

### 開発フロー
1. **ローカル開発**: `npm run dev`
2. **ビルド確認**: `npm run build`
3. **Gitコミット**: featureブランチで開発
4. **GitHubプッシュ**: `git push origin feature/xxx`
5. **Vercelプレビュー**: 自動デプロイでプレビュー確認
6. **mainマージ**: レビュー後mainへマージ
7. **本番デプロイ**: main更新で自動本番デプロイ

### 環境変数（Vercel設定）
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

---

## 📈 成功指標（KPI）

### 技術的KPI
- [ ] ビルド成功率 100%
- [ ] Lighthouse Performance スコア 80+
- [ ] TypeScript型エラー 0件
- [ ] ESLintエラー 0件

### 機能的KPI
- [ ] 全3機能（プロジェクト・設定・売上）が動作
- [ ] ChatUI経由で全操作が実行可能
- [ ] データの永続化が正常動作
- [ ] Vercelへのデプロイ成功

---

## 📅 マイルストーン（参考）

### Phase 1: 環境構築（1日目）
- Supabase セットアップ
- ChatKit インストール・設定
- 認証設定

### Phase 2: 基盤実装（2-3日目）
- データベーススキーマ作成
- API Routes実装
- 基本的なCRUD操作

### Phase 3: 機能実装（4-5日目）
- プロジェクト管理機能
- 設定管理機能
- 売上確認機能

### Phase 4: ChatUI統合（6日目）
- ChatKit統合
- AIコマンド解釈実装
- 各機能とチャットの連携

### Phase 5: テスト・デプロイ（7日目）
- 動作確認
- バグ修正
- Vercelデプロイ
- 最終検証

---

## 🔄 今後の拡張計画

### MVP後の機能追加候補
- 見積機能
- メール送信機能
- 4分割UI実装
- 複数スクリーン動的生成
- ダッシュボード・分析機能
- モバイルアプリ
- 多言語対応
- チーム機能・権限管理

---

## 📚 関連ドキュメント

### プラットフォーム全体
- **[プラットフォーム要件定義書](./platform-requirements.md)** - 全体ビジョンと将来計画
- [Desktop UI設計](./desktop-ui-design.md) - UI詳細仕様

### プラグインシステム（Phase 2以降）
- [プラグインアーキテクチャ](./plugin-architecture.md) - プラグイン設計
- [開発者ガイド](./developer-guide.md) - プラグイン開発手順
- [プラグインストア設計](./plugin-store-design.md) - ストアUI
- [Core API仕様](./core-api-spec.md) - プラグイン用API

### AIエージェント（Phase 3以降）
- [エージェントシステム設計](./agent-system-design.md) - 自動化システム

### MVP実装
- [データベーススキーマ設計](./database-schema.md) - DB設計
- [API設計書](./api-design.md) - API仕様
- [実装タスクリスト](./tasks.md) - 開発計画
