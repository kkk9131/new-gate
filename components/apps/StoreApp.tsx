'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  RiArrowLeftLine,
  RiDownloadLine,
  RiFilter2Line,
  RiRocket2Line,
  RiSearchLine,
  RiShieldCheckLine,
  RiShoppingCartLine,
  RiStarFill,
  RiStarLine,
  RiStoreLine,
} from 'react-icons/ri';

type Plugin = {
  id: string;
  plugin_id: string;
  name: string;
  description: string; // summary
  long_description?: string;
  icon_url?: string;
  screenshots?: string[];
  author_name: string; // developer
  category: string;
  tags?: string[];
  latest_version: string; // version
  download_count: number; // downloads
  average_rating: number; // rating
  review_count: number; // reviews
  price: number;
  is_free: boolean;
  published_at: string; // lastUpdated
  // compatibility: string; // Not in DB yet
  // permissions: string[]; // Not in DB yet
};

type ToastState = { type: 'success' | 'error'; message: string } | null;


const categories = ['ビジネス', '分析', 'コミュニケーション', 'プロダクティビティ', 'その他'];

type ViewMode = 'home' | 'search' | 'detail';

export function StoreApp() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [keyword, setKeyword] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>(['ビジネス']);
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | '4' | '3'>('4');

  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ type, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchPlugins = async () => {
      if (isMounted) setIsLoading(true);

      try {
        const res = await fetch('/api/store/plugins');
        if (!res.ok) {
          throw new Error('Failed to fetch plugins');
        }
        const data = await res.json();
        if (isMounted) {
          setPlugins(data.plugins || []);
        }
      } catch (error) {
        console.error('Failed to fetch plugins:', error);
        if (isMounted) {
          showToast('error', 'プラグイン一覧の取得に失敗しました');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchPlugins();

    return () => {
      isMounted = false;
    };
  }, [showToast]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const filteredResults = useMemo(() => {
    return plugins.filter((plugin) => {
      const keywordMatch = keyword ? plugin.name.toLowerCase().includes(keyword.toLowerCase()) : true;
      const categoryMatch = activeCategories.length ? activeCategories.includes(plugin.category) : true;
      const priceMatch =
        priceFilter === 'all' ? true : priceFilter === 'free' ? plugin.is_free : !plugin.is_free;
      const ratingMatch = ratingFilter === 'all' ? true : plugin.average_rating >= Number(ratingFilter);
      return keywordMatch && categoryMatch && priceMatch && ratingMatch;
    });
  }, [plugins, keyword, activeCategories, priceFilter, ratingFilter]);

  const featured = plugins.slice(0, 4);
  const ranking = useMemo(() => {
    return [...plugins].sort((a, b) => b.download_count - a.download_count).slice(0, 3);
  }, [plugins]);
  const newArrivals = plugins.slice(-3);

  const handleInstall = async (plugin: Plugin) => {
    try {
      setInstallingId(plugin.id);
      const res = await fetch('/api/store/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plugin_id: plugin.plugin_id, version: plugin.latest_version }),
      });

      if (res.ok) {
        showToast('success', `${plugin.name} をインストールしました`);
      } else {
        const data = await res.json();
        showToast('error', data.error ? `インストール失敗: ${data.error}` : 'インストールに失敗しました');
      }
    } catch (error) {
      console.error('Install failed:', error);
      showToast('error', 'インストール中にエラーが発生しました');
    } finally {
      setInstallingId(null);
    }
  };

  const handleOpenDetail = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setViewMode('detail');
  };

  const handleSearch = () => {
    setViewMode('search');
  };

  const toggleCategory = (category: string) => {
    setActiveCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto bg-mist text-ink">
      <header className="flex items-center justify-between mb-4 md:mb-6">
        {viewMode === 'detail' ? (
          <button
            onClick={() => {
              setViewMode('home');
              setSelectedPlugin(null);
            }}
            className="flex items-center gap-2 text-sm text-cloud hover:text-ink"
          >
            <RiArrowLeftLine className="w-4 h-4" /> 戻る
          </button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-2 text-cloud text-sm">
          <RiShoppingCartLine className="w-5 h-5" />
          <span>マイプラグイン</span>
        </div>
      </header>

      <div className="bg-surface border border-white/40 rounded-3xl p-4 md:p-6 shadow-panel mb-4 md:mb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex-1">
            <h2 className="text-2xl md:text-3xl font-semibold mb-2">Plugin Store</h2>
            <p className="text-cloud text-sm">欲しい体験を追加する、デスクトップ拡張マーケット</p>
          </div>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <RiSearchLine className="w-4 h-4 text-cloud absolute left-3 top-3" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 rounded-2xl border border-cloud/40 bg-mist focus:outline-none focus:ring-2 focus:ring-accent-sand/40"
                placeholder="プラグインを検索..."
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded-2xl bg-accent-sand text-ink font-semibold"
            >
              検索
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="mb-4 rounded-3xl border border-white/40 bg-surface px-4 py-3 text-sm text-cloud animate-pulse">
          プラグイン情報を読み込み中です...
        </div>
      )}

      {viewMode === 'home' && (
        <div className="space-y-6 md:space-y-8">
          {/* おすすめ */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <RiRocket2Line className="text-accent-sand" />
              <h3 className="font-semibold">おすすめプラグイン</h3>
            </div>
            <div className="grid gap-3 md:gap-4 md:grid-cols-2 xl:grid-cols-4">
              {featured.map((plugin) => (
                <PluginCard key={plugin.id} plugin={plugin} onClick={() => handleOpenDetail(plugin)} />
              ))}
            </div>
          </section>

          {/* カテゴリ */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <RiFilter2Line className="text-accent-sand" />
              <h3 className="font-semibold">カテゴリで探す</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-4 py-2 rounded-full border text-sm ${activeCategories.includes(category)
                      ? 'bg-ink text-white'
                      : 'border-cloud/40 text-ink hover:border-ink/40'
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          {/* 人気ランキング */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <RiStarLine className="text-accent-sand" />
              <h3 className="font-semibold">人気ランキング</h3>
            </div>
            <div className="space-y-2 md:space-y-3">
              {ranking.map((plugin, index) => (
                <div
                  key={plugin.id}
                  className="flex items-center justify-between bg-surface border border-white/40 rounded-2xl p-3 md:p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-cloud font-semibold w-6">{index + 1}.</span>
                    <div>
                      <p className="font-semibold">{plugin.name}</p>
                      <p className="text-xs text-cloud">★{plugin.average_rating} / {plugin.download_count.toLocaleString()} DL</p>
                    </div>
                  </div>
                  <button
                    className="text-sm text-ink underline"
                    onClick={() => handleOpenDetail(plugin)}
                  >
                    詳細
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* 新着 */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <RiStoreLine className="text-accent-sand" />
              <h3 className="font-semibold">新着プラグイン</h3>
            </div>
            <div className="grid gap-3 md:gap-4 md:grid-cols-3">
              {newArrivals.map((plugin) => (
                <PluginCard key={plugin.id} plugin={plugin} onClick={() => handleOpenDetail(plugin)} compact />
              ))}
            </div>
          </section>
        </div>
      )}

      {viewMode === 'search' && (
        <div className="space-y-6">
          <div className="bg-surface border border-white/40 rounded-3xl p-4 md:p-5 shadow-panel">
            <div className="flex flex-wrap gap-4 text-sm">
              <FilterGroup title="カテゴリ">
                {categories.map((category) => (
                  <label key={category} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={activeCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                    />
                    {category}
                  </label>
                ))}
              </FilterGroup>
              <FilterGroup title="価格">
                {['all', 'free', 'paid'].map((type) => (
                  <label key={type} className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={priceFilter === type}
                      onChange={() => setPriceFilter(type as typeof priceFilter)}
                    />
                    {type === 'all' ? 'すべて' : type === 'free' ? '無料' : '有料'}
                  </label>
                ))}
              </FilterGroup>
              <FilterGroup title="評価">
                {['all', '4', '3'].map((rate) => (
                  <label key={rate} className="flex items-center gap-1">
                    <input
                      type="radio"
                      checked={ratingFilter === rate}
                      onChange={() => setRatingFilter(rate as typeof ratingFilter)}
                    />
                    {rate === 'all' ? '制限なし' : `★${rate}以上`}
                  </label>
                ))}
              </FilterGroup>
            </div>
          </div>

          <div className="text-sm text-cloud">{filteredResults.length}件のプラグインが見つかりました</div>

          <div className="space-y-4">
            {filteredResults.map((plugin) => (
              <PluginResultCard key={plugin.id} plugin={plugin} onClick={() => handleOpenDetail(plugin)} />
            ))}
          </div>
        </div>
      )}

      {viewMode === 'detail' && selectedPlugin && (
        <div className="space-y-6">
          <div className="bg-surface border border-white/40 rounded-3xl p-4 md:p-6 shadow-panel">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-20 h-20 rounded-3xl bg-accent-calm/30 flex items-center justify-center">
                  <RiStoreLine className="w-10 h-10 text-ink" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-semibold">{selectedPlugin.name}</h3>
                  <p className="text-sm text-cloud">by {selectedPlugin.author_name}</p>
                  <p className="text-sm text-cloud">
                    ★{selectedPlugin.average_rating} ({selectedPlugin.review_count} reviews)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="px-5 py-3 rounded-2xl border border-cloud/40 text-sm">デモを見る</button>
                <button
                  onClick={() => handleInstall(selectedPlugin)}
                  disabled={installingId === selectedPlugin.id}
                  className="px-5 py-3 rounded-2xl bg-ink text-white text-sm disabled:opacity-50"
                >
                  {installingId === selectedPlugin.id ? 'インストール中...' : 'インストール'}
                </button>
              </div>
            </div>
          </div>

          <section className="bg-surface border border-white/40 rounded-3xl p-4 md:p-6 shadow-panel space-y-4">
            <h4 className="font-semibold">説明</h4>
            <p className="text-cloud text-sm leading-relaxed">{selectedPlugin.description}</p>
          </section>

          <section className="bg-surface border border-white/40 rounded-3xl p-4 md:p-6 shadow-panel">
            <h4 className="font-semibold mb-4">詳細情報</h4>
            <dl className="grid grid-cols-2 gap-3 md:gap-4 text-sm text-cloud">
              <div>
                <dt className="text-xs uppercase tracking-wide text-cloud">カテゴリ</dt>
                <dd className="text-ink">{selectedPlugin.category}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-cloud">バージョン</dt>
                <dd className="text-ink">{selectedPlugin.latest_version}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-cloud">サイズ</dt>
                <dd className="text-ink">-</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-cloud">最終更新</dt>
                <dd className="text-ink">{new Date(selectedPlugin.published_at).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-cloud">互換性</dt>
                <dd className="text-ink">Platform v1.0+</dd>
              </div>
            </dl>
          </section>

          <section className="bg-surface border border-white/40 rounded-3xl p-4 md:p-6 shadow-panel">
            <h4 className="font-semibold mb-3">権限</h4>
            <ul className="space-y-2 text-sm">
              {/* Permissions not yet in DB, showing placeholder */}
              <li className="flex items-center gap-2 text-cloud">
                <RiShieldCheckLine className="text-accent-sand" /> 権限情報はまだありません
              </li>
            </ul>
          </section>

          <section className="bg-surface border border-white/40 rounded-3xl p-4 md:p-6 shadow-panel space-y-3">
            <h4 className="font-semibold">レビュー</h4>
            <div className="flex gap-3">
              <ReviewPill rating={5} text="最高のCRMプラグイン！" user="User123" date="2025-10-15" />
              <ReviewPill rating={4} text="良いが検索機能が欲しい" user="UserABC" date="2025-10-10" />
            </div>
            <button className="text-sm text-ink underline">もっと見る</button>
          </section>
        </div>
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`rounded-2xl px-5 py-3 shadow-panel text-sm text-white ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}

function PluginCard({ plugin, onClick, compact }: { plugin: Plugin; onClick: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="bg-surface border border-white/40 rounded-2xl p-3 md:p-4 text-left shadow-soft hover:shadow-panel transition-shadow"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-accent-calm/30 flex items-center justify-center">
          <RiStoreLine className="w-6 h-6 text-ink" />
        </div>
        <div>
          <p className="font-semibold">{plugin.name}</p>
          <p className="text-xs text-cloud">{plugin.category}</p>
        </div>
      </div>
      <p className="text-sm text-cloud mb-3 line-clamp-2">{plugin.description}</p>
      {!compact && (
        <div className="flex items-center justify-between text-sm text-cloud">
          <span>★{plugin.average_rating} ({plugin.review_count})</span>
          <span>{plugin.is_free ? '無料' : `¥${plugin.price}`}</span>
        </div>
      )}
    </button>
  );
}

function PluginResultCard({ plugin, onClick }: { plugin: Plugin; onClick: () => void }) {
  return (
    <div className="bg-surface border border-white/40 rounded-3xl p-4 md:p-5 shadow-soft flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-lg">{plugin.name}</h4>
          {plugin.tags?.map((badge) => (
            <span key={badge} className="text-xs px-2 py-1 rounded-full bg-cloud/20 text-cloud">
              {badge}
            </span>
          ))}
        </div>
        <p className="text-sm text-cloud mb-2">{plugin.description}</p>
        <div className="flex items-center gap-4 text-xs text-cloud">
          <span>★{plugin.average_rating}</span>
          <span>{plugin.is_free ? '無料' : `¥${plugin.price}`}</span>
          <span>{plugin.download_count.toLocaleString()} DL</span>
        </div>
      </div>
      <button className="px-4 py-2 rounded-2xl border border-cloud/40 text-sm" onClick={onClick}>
        詳細を見る
      </button>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-cloud">{title}</p>
      <div className="flex flex-col gap-1 text-ink">{children}</div>
    </div>
  );
}

function ReviewPill({ rating, text, user, date }: { rating: number; text: string; user: string; date: string }) {
  return (
    <div className="flex-1 rounded-2xl border border-cloud/40 p-3 md:p-4">
      <div className="flex items-center gap-1 text-sm text-accent-sand mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <RiStarFill key={i} className={`w-3 h-3 ${i < rating ? 'text-accent-sand' : 'text-cloud'}`} />
        ))}
      </div>
      <p className="text-sm text-ink mb-2">“{text}”</p>
      <p className="text-xs text-cloud">
        {user} ・ {date}
      </p>
    </div>
  );
}
