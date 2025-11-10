'use client';

import { RiMoneyDollarCircleLine, RiArrowUpLine, RiArrowDownLine } from 'react-icons/ri';

export function RevenueApp() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
  const revenues = [650, 720, 680, 850, 920, 850];

  return (
    <div className="p-6 h-full overflow-auto bg-mist text-ink">
      <h2 className="text-2xl font-bold mb-6">Revenue</h2>

      {/* 今月の売上サマリー */}
      <div className="bg-surface border border-white/40 p-6 rounded-2xl shadow-sm shadow-black/5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-accent-warm/30 rounded-2xl flex items-center justify-center">
              <RiMoneyDollarCircleLine className="w-7 h-7 text-ink" />
            </div>
            <div>
              <p className="text-sm text-cloud">今月の売上</p>
              <p className="text-3xl font-bold">¥850,000</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-accent-warm">
            <RiArrowUpLine className="w-5 h-5" />
            <span className="font-semibold">+8.5%</span>
          </div>
        </div>

        {/* 簡易グラフ */}
        <div className="flex items-end gap-2 h-32">
          {revenues.map((revenue, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-cloud/30 rounded-t-3xl relative"
                style={{ height: `${(revenue / 1000) * 100}%` }}
              >
                <div className="absolute inset-0 bg-accent-warm/70 rounded-t-3xl" />
              </div>
              <span className="text-xs text-cloud">{months[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 最近の取引 */}
      <div className="bg-surface border border-white/40 p-4 rounded-2xl shadow-sm shadow-black/5">
        <h3 className="text-lg font-semibold mb-4">最近の取引</h3>
        <div className="space-y-3">
          {[
            { title: 'Webサイト制作', amount: 250000, type: 'income' },
            { title: 'サーバー費用', amount: -15000, type: 'expense' },
            { title: 'コンサルティング', amount: 180000, type: 'income' },
          ].map((transaction, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-cloud/10"
            >
              <span className="text-sm">{transaction.title}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`font-semibold ${
                    transaction.type === 'income'
                      ? 'text-accent-warm'
                      : 'text-accent-warm/70'
                  }`}
                >
                  {transaction.amount > 0 ? '+' : ''}¥{Math.abs(transaction.amount).toLocaleString()}
                </span>
                {transaction.type === 'income' ? (
                  <RiArrowUpLine className="w-4 h-4 text-accent-warm" />
                ) : (
                  <RiArrowDownLine className="w-4 h-4 text-accent-warm/70" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
