'use client';

import { RiDashboardLine, RiLineChartLine, RiUserLine, RiFileListLine } from 'react-icons/ri';

export function DashboardApp() {
  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Dashboard</h2>

      {/* 統計カード */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <RiFileListLine className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">プロジェクト数</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">12</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <RiLineChartLine className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">今月の売上</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">¥850K</p>
            </div>
          </div>
        </div>
      </div>

      {/* 最近のアクティビティ */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">最近のアクティビティ</h3>
        <div className="space-y-3">
          {['新規プロジェクト作成', '売上データ更新', '設定変更'].map((activity, i) => (
            <div key={i} className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center">
                <RiDashboardLine className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{activity}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
