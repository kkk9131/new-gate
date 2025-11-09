# プラグインストア設計書

## 📋 ドキュメント情報
- **作成日**: 2025-11-09
- **バージョン**: 1.0
- **対象**: プラグインストアUI/UX設計
- **目的**: ユーザーが簡単にプラグインを発見・インストールできる体験の構築

---

## 🎯 設計目標

```yaml
発見しやすさ:
  - 優れた検索機能
  - カテゴリ分類
  - レコメンデーション

信頼性:
  - レビュー・評価システム
  - 公式・認証バッジ
  - セキュリティスキャン結果表示

使いやすさ:
  - ワンクリックインストール
  - 自動アップデート
  - 簡単なアンインストール
```

---

## 🏗️ ストアUI構成

### トップページ

```
┌────────────────────────────────────────────────────┐
│  [Store Logo]  Plugin Store        [検索バー]  [🛒]│
├────────────────────────────────────────────────────┤
│                                                    │
│  🎉 おすすめプラグイン                             │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│  │[Icon]│ │[Icon]│ │[Icon]│ │[Icon]│            │
│  │ Name │ │ Name │ │ Name │ │ Name │            │
│  │ ★4.5 │ │ ★4.8 │ │ ★4.2 │ │ ★4.9 │            │
│  └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                    │
│  📊 カテゴリ別                                     │
│  [ビジネス] [分析] [コミュニケーション] [その他]  │
│                                                    │
│  🔥 人気ランキング                                │
│  1. CRM Manager        ★4.9  10,000 DL           │
│  2. Data Dashboard     ★4.7   8,500 DL           │
│  3. Email Suite        ★4.6   7,200 DL           │
│                                                    │
│  ✨ 新着プラグイン                                │
│  [プラグインカード一覧]                           │
│                                                    │
└────────────────────────────────────────────────────┘
```

### プラグイン詳細ページ

```
┌────────────────────────────────────────────────────┐
│  ← 戻る           Plugin Store                     │
├────────────────────────────────────────────────────┤
│  ┌────────┐                                        │
│  │        │  CRM Manager                           │
│  │ [Icon] │  by John Doe                           │
│  │ 80x80  │  ★★★★★ 4.9 (250 reviews)             │
│  └────────┘                                        │
│            [インストール] [デモを見る]             │
│                                                    │
│  📝 説明                                           │
│  顧客管理を効率化するプラグイン。                 │
│  連絡先管理、商談トラッキング、レポート生成...    │
│                                                    │
│  🖼️ スクリーンショット                            │
│  [Screenshot1] [Screenshot2] [Screenshot3]        │
│                                                    │
│  ℹ️ 詳細情報                                       │
│  カテゴリ: ビジネス                               │
│  バージョン: 2.1.0                                │
│  サイズ: 1.2 MB                                   │
│  最終更新: 2025-11-01                             │
│  互換性: Platform v1.0+                           │
│                                                    │
│  🔐 権限                                           │
│  ✓ ストレージ読み書き                             │
│  ✓ 通知表示                                       │
│  ✓ ネットワーク通信                               │
│                                                    │
│  💬 レビュー (250件)                              │
│  ★★★★★ 5.0  "最高のCRMプラグイン！"              │
│  by User123  2025-10-15                           │
│                                                    │
│  ★★★★☆ 4.0  "良いが、検索機能が欲しい"           │
│  by UserABC  2025-10-10                           │
│                                                    │
│  [もっと見る]                                     │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 検索結果ページ

```
┌────────────────────────────────────────────────────┐
│  [検索: "CRM"]                              [🛒]   │
├────────────────────────────────────────────────────┤
│  フィルター:                   並び替え: [人気順▼] │
│  [x] ビジネス                                      │
│  [ ] 分析                     50件見つかりました   │
│  [ ] コミュニケーション                           │
│                                                    │
│  価格:                                             │
│  [x] 無料                                          │
│  [ ] 有料                                          │
│                                                    │
│  評価:                                             │
│  [x] ★4以上                                        │
│  [ ] ★3以上                                        │
│                                                    │
├────────────────────────────────────────────────────┤
│  検索結果:                                         │
│                                                    │
│  ┌──────────────────────────────────┐            │
│  │ [Icon] CRM Manager        ★4.9  │            │
│  │ 顧客管理を効率化...             │            │
│  │ 無料  10,000 DL   [インストール] │            │
│  └──────────────────────────────────┘            │
│                                                    │
│  ┌──────────────────────────────────┐            │
│  │ [Icon] Simple CRM         ★4.5  │            │
│  │ シンプルなCRMツール...          │            │
│  │ 無料   5,000 DL   [インストール] │            │
│  └──────────────────────────────────┘            │
│                                                    │
│  [もっと見る]                                     │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 🔧 機能仕様

### 1. 検索機能

#### キーワード検索
```typescript
interface SearchQuery {
  keyword: string;        // 検索キーワード
  category?: string[];    // カテゴリフィルター
  priceType?: 'free' | 'paid' | 'all';
  minRating?: number;     // 最低評価
  sortBy?: 'popular' | 'recent' | 'rating' | 'downloads';
  page?: number;
  limit?: number;
}

// 検索API
const results = await searchPlugins({
  keyword: 'CRM',
  category: ['business'],
  minRating: 4.0,
  sortBy: 'popular',
  page: 1,
  limit: 20
});
```

#### 検索候補（サジェスト）
```typescript
// ユーザーが入力中にリアルタイム候補表示
const suggestions = await getSearchSuggestions('CR');
// ["CRM", "CRM Manager", "Customer Relations"]
```

### 2. インストール機能

#### ワンクリックインストール
```typescript
const installPlugin = async (pluginId: string) => {
  // 1. 権限確認ダイアログ表示
  const permissions = await getPluginPermissions(pluginId);
  const confirmed = await showPermissionDialog(permissions);

  if (!confirmed) return;

  // 2. ダウンロード開始
  const downloadTask = await startDownload(pluginId);

  // 3. 進捗表示
  downloadTask.onProgress((progress) => {
    updateProgressBar(progress); // 0-100%
  });

  // 4. インストール実行
  await downloadTask.complete();
  await activatePlugin(pluginId);

  // 5. 完了通知
  showNotification('インストールが完了しました！', 'success');

  // 6. デスクトップにアイコン追加
  addAppIconToDesktop(pluginId);
};
```

#### 権限確認ダイアログ
```
┌──────────────────────────────────┐
│  権限の確認                      │
├──────────────────────────────────┤
│  このプラグインは以下の権限を    │
│  要求しています：               │
│                                  │
│  ✓ ストレージの読み書き          │
│    データを保存・読み込みます   │
│                                  │
│  ✓ 通知の表示                    │
│    通知を表示します             │
│                                  │
│  ✓ ネットワーク通信              │
│    外部APIにアクセスします      │
│                                  │
│  [キャンセル]  [許可してインストール] │
└──────────────────────────────────┘
```

### 3. レビュー・評価システム

#### レビュー投稿
```typescript
interface Review {
  pluginId: string;
  userId: string;
  rating: number;        // 1-5
  title: string;
  comment: string;
  createdAt: Date;
  helpful: number;       // 役に立ったカウント
}

// レビュー投稿
const submitReview = async (review: Omit<Review, 'createdAt' | 'helpful'>) => {
  await api.post('/api/store/reviews', review);
  showNotification('レビューを投稿しました', 'success');
};
```

#### 評価集計
```typescript
interface RatingSummary {
  average: number;       // 平均評価
  total: number;         // 総レビュー数
  distribution: {
    5: number;           // ★5の数
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
```

### 4. カテゴリ分類

```typescript
enum PluginCategory {
  BUSINESS = 'business',          // ビジネス管理
  ANALYTICS = 'analytics',        // データ分析
  COMMUNICATION = 'communication',// コミュニケーション
  DEVELOPMENT = 'development',    // 開発ツール
  UTILITY = 'utility',            // ユーティリティ
  PRODUCTIVITY = 'productivity',  // 生産性向上
  FINANCE = 'finance',            // 財務管理
  MARKETING = 'marketing',        // マーケティング
  OTHER = 'other',                // その他
}

// カテゴリ別取得
const plugins = await getPluginsByCategory(PluginCategory.BUSINESS);
```

### 5. 自動アップデート

```typescript
// アップデート確認（バックグラウンドで定期実行）
const checkUpdates = async () => {
  const installedPlugins = await getInstalledPlugins();

  for (const plugin of installedPlugins) {
    const latestVersion = await getLatestVersion(plugin.id);

    if (isNewerVersion(latestVersion, plugin.version)) {
      // アップデート通知
      showUpdateNotification(plugin, latestVersion);
    }
  }
};

// 自動アップデート実行
const autoUpdate = async (pluginId: string) => {
  const updateTask = await startUpdate(pluginId);

  updateTask.onProgress((progress) => {
    updateProgressBar(progress);
  });

  await updateTask.complete();
  showNotification('アップデート完了', 'success');
};
```

---

## 🎨 UIコンポーネント

### PluginCard（プラグインカード）

```typescript
interface PluginCardProps {
  plugin: {
    id: string;
    name: string;
    description: string;
    icon: string;
    rating: number;
    downloads: number;
    price: number;
    isInstalled: boolean;
  };
  onInstall: (id: string) => void;
}

export function PluginCard({ plugin, onInstall }: PluginCardProps) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition">
      <img src={plugin.icon} alt={plugin.name} className="w-16 h-16" />

      <h3 className="text-lg font-bold mt-2">{plugin.name}</h3>

      <p className="text-sm text-gray-600 mt-1">
        {plugin.description}
      </p>

      <div className="flex items-center mt-2">
        <StarRating rating={plugin.rating} />
        <span className="text-sm text-gray-500 ml-2">
          {plugin.downloads.toLocaleString()} DL
        </span>
      </div>

      <button
        onClick={() => onInstall(plugin.id)}
        disabled={plugin.isInstalled}
        className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
      >
        {plugin.isInstalled ? 'インストール済み' : 'インストール'}
      </button>
    </div>
  );
}
```

### SearchBar（検索バー）

```typescript
export function SearchBar({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length >= 2) {
      const results = await getSearchSuggestions(value);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
        placeholder="プラグインを検索..."
        className="w-full px-4 py-2 border rounded-lg"
      />

      {suggestions.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-white border rounded-lg shadow-lg">
          {suggestions.map((s) => (
            <div
              key={s}
              onClick={() => {
                setQuery(s);
                onSearch(s);
                setSuggestions([]);
              }}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 📊 データベース設計

### pluginsテーブル
```sql
-- ストア掲載プラグイン情報
CREATE TABLE store_plugins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基本情報
  plugin_id VARCHAR(255) NOT NULL UNIQUE,  -- com.example.plugin
  name VARCHAR(255) NOT NULL,
  description TEXT,
  long_description TEXT,
  icon_url TEXT,
  screenshots TEXT[],

  -- 開発者情報
  author_id UUID REFERENCES auth.users(id),
  author_name VARCHAR(255),
  author_email VARCHAR(255),

  -- カテゴリ・タグ
  category VARCHAR(50),
  tags TEXT[],

  -- バージョン管理
  latest_version VARCHAR(20),
  min_platform_version VARCHAR(20),

  -- 統計情報
  download_count INT DEFAULT 0,
  install_count INT DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0.0,
  review_count INT DEFAULT 0,

  -- 価格
  price DECIMAL(10, 2) DEFAULT 0.0,
  is_free BOOLEAN DEFAULT TRUE,

  -- ステータス
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_official BOOLEAN DEFAULT FALSE,

  -- タイムスタンプ
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### reviewsテーブル
```sql
CREATE TABLE plugin_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  plugin_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),

  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255),
  comment TEXT,

  helpful_count INT DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(plugin_id, user_id)  -- 1ユーザー1レビュー
);
```

---

## 🚀 API仕様

### プラグイン一覧取得
```
GET /api/store/plugins?category=business&sortBy=popular&page=1&limit=20
```

### プラグイン詳細取得
```
GET /api/store/plugins/:pluginId
```

### プラグインインストール
```
POST /api/store/plugins/:pluginId/install
```

### レビュー投稿
```
POST /api/store/plugins/:pluginId/reviews
```

### レビュー一覧取得
```
GET /api/store/plugins/:pluginId/reviews?page=1&limit=10
```

---

## 📚 関連ドキュメント

- [プラットフォーム要件定義](./platform-requirements.md)
- [プラグインアーキテクチャ](./plugin-architecture.md)
- [開発者ガイド](./developer-guide.md)
- [データベーススキーマ](./database-schema.md)
- [API設計書](./api-design.md)
