'use client';

import { RiBarChartBoxLine, RiEyeLine, RiMouseLine, RiTimeLine } from 'react-icons/ri';

export function AnalyticsApp() {
  const metrics = [
    { icon: RiEyeLine, label: 'ページビュー', value: '12,543', change: '+12.5%', color: 'blue' },
    { icon: RiMouseLine, label: 'クリック数', value: '3,821', change: '+8.2%', color: 'green' },
    { icon: RiTimeLine, label: '平均滞在時間', value: '4:32', change: '+15.3%', color: 'purple' },
  ];

  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-600 dark:text-blue-400' },
    green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', icon: 'text-green-600 dark:text-green-400' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', icon: 'text-purple-600 dark:text-purple-400' },
  };

  return (
    <div className="p-4 md:p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-6">Analytics</h2>

      {/* メトリクスカード */}
      <div className="grid grid-cols-1 gap-3 md:gap-4 mb-4 md:mb-6">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          const colors = colorMap[metric.color];
          return (
            <div key={i} className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">{metric.value}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${colors.text}`}>{metric.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* グラフエリア（簡易版） */}
      <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-sm">
        <h3 className="text-base md:text-lg font-semibold text-gray-800 dark:text-white mb-3 md:mb-4">週次トレンド</h3>
        <div className="flex items-end gap-2 h-40">
          {[65, 78, 82, 95, 88, 92, 100].map((value, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-lg relative" style={{ height: `${value}%` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-pink-600 to-pink-400 rounded-t-lg" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {['月', '火', '水', '木', '金', '土', '日'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
