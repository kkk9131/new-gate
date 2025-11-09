'use client';

import { RiCalendarLine, RiTimeLine, RiMapPinLine } from 'react-icons/ri';

export function CalendarApp() {
  const events = [
    { title: 'プロジェクトミーティング', time: '10:00 - 11:00', location: 'オンライン', color: 'blue' },
    { title: 'クライアント打ち合わせ', time: '14:00 - 15:30', location: '会議室A', color: 'green' },
    { title: 'レビュー会議', time: '16:00 - 17:00', location: 'オンライン', color: 'purple' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Calendar</h2>

      {/* 今日の日付 */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-xl flex flex-col items-center justify-center">
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">11月</span>
            <span className="text-2xl font-bold text-red-600 dark:text-red-400">10</span>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">今日</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">2025年11月10日（日）</p>
          </div>
        </div>
      </div>

      {/* イベント一覧 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">今日の予定</h3>
        {events.map((event, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl border-l-4 ${colorMap[event.color]} shadow-sm`}
          >
            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">{event.title}</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <RiTimeLine className="w-4 h-4" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <RiMapPinLine className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 新規予定追加ボタン */}
      <button className="w-full mt-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-medium shadow-sm">
        + 新しい予定を追加
      </button>
    </div>
  );
}
