'use client';

import { RiStoreLine, RiStarLine, RiDownloadLine } from 'react-icons/ri';

export function StoreApp() {
  const plugins = [
    { name: 'タスク管理プラグイン', rating: 4.8, downloads: 1250, price: '無料' },
    { name: '分析ダッシュボード', rating: 4.6, downloads: 890, price: '¥2,980' },
    { name: 'メール統合', rating: 4.9, downloads: 2100, price: '¥1,480' },
  ];

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Plugin Store</h2>

      {/* 検索バー */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="プラグインを検索..."
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-white"
        />
      </div>

      {/* プラグイン一覧 */}
      <div className="space-y-4">
        {plugins.map((plugin, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                <RiStoreLine className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-1">{plugin.name}</h3>

                {/* 評価とダウンロード数 */}
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <RiStarLine className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{plugin.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RiDownloadLine className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{plugin.downloads}</span>
                  </div>
                </div>

                {/* 価格とボタン */}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800 dark:text-white">{plugin.price}</span>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium">
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
