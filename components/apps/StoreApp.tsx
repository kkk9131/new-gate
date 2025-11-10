'use client';

import { RiStoreLine, RiStarLine, RiDownloadLine } from 'react-icons/ri';

export function StoreApp() {
  const plugins = [
    { name: 'タスク管理プラグイン', rating: 4.8, downloads: 1250, price: '無料' },
    { name: '分析ダッシュボード', rating: 4.6, downloads: 890, price: '¥2,980' },
    { name: 'メール統合', rating: 4.9, downloads: 2100, price: '¥1,480' },
  ];

  return (
    <div className="p-6 h-full overflow-auto bg-mist text-ink">
      <h2 className="text-2xl font-bold mb-6">Plugin Store</h2>

      {/* 検索バー */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="プラグインを検索..."
          className="w-full px-4 py-3 bg-surface border border-cloud/40 rounded-2xl focus:outline-none focus:ring-2 focus:ring-ink/20"
        />
      </div>

      {/* プラグイン一覧 */}
      <div className="space-y-4">
        {plugins.map((plugin, i) => (
          <div
            key={i}
            className="bg-surface border border-white/40 p-4 rounded-2xl shadow-sm shadow-black/5 hover:shadow-black/10 transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-accent-calm/25 rounded-2xl flex items-center justify-center flex-shrink-0">
                <RiStoreLine className="w-8 h-8 text-ink" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1">{plugin.name}</h3>

                {/* 評価とダウンロード数 */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1 text-cloud">
                    <RiStarLine className="w-4 h-4 text-accent-calm" />
                    <span className="text-sm">{plugin.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-cloud">
                    <RiDownloadLine className="w-4 h-4" />
                    <span className="text-sm">{plugin.downloads}</span>
                  </div>
                </div>

                {/* 価格とボタン */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-ink">{plugin.price}</span>
                  <button className="px-4 py-2 bg-accent-sand hover:bg-accent-sand/80 text-ink rounded-full transition-colors text-sm font-medium">
                    インストール
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
