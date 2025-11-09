'use client';

import { RiMoneyDollarCircleLine, RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri';

export function RevenueApp() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
  const revenues = [650, 720, 680, 850, 920, 850];

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Revenue</h2>

      {/* 今月の売上サマリー */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <RiMoneyDollarCircleLine className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">今月の売上</p>
              <p className="text-3xl font-bold text-gray-800 dark:text-white">¥850,000</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <RiArrowUpLine className="w-5 h-5" />
            <span className="font-semibold">+8.5%</span>
          </div>
        </div>

        {/* 簡易グラフ */}
        <div className="flex items-end gap-2 h-32">
          {revenues.map((revenue, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg relative" style={{ height: `${(revenue / 1000) * 100}%` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 最近の取引 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">最近の取引</h3>
        <div className="space-y-3">
          {[
            { title: 'Webサイト制作', amount: 250000, type: 'income' },
            { title: 'サーバー費用', amount: -15000, type: 'expense' },
            { title: 'コンサルティング', amount: 180000, type: 'income' },
          ].map((transaction, i) => (
            <div key={i} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <span className="text-sm text-gray-700 dark:text-gray-300">{transaction.title}</span>
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${
                  transaction.type === 'income'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}¥{Math.abs(transaction.amount).toLocaleString()}
                </span>
                {transaction.type === 'income' ? (
                  <RiArrowUpLine className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <RiArrowDownLine className="w-4 h-4 text-red-600 dark:text-red-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
