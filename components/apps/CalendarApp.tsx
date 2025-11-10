'use client';

import { RiCalendarLine, RiTimeLine, RiMapPinLine } from 'react-icons/ri';

export function CalendarApp() {
  const events = [
    { title: 'プロジェクトミーティング', time: '10:00 - 11:00', location: 'オンライン', color: 'blue' },
    { title: 'クライアント打ち合わせ', time: '14:00 - 15:30', location: '会議室A', color: 'green' },
    { title: 'レビュー会議', time: '16:00 - 17:00', location: 'オンライン', color: 'purple' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'border-accent-bloom/60 bg-accent-bloom/15',
    green: 'border-accent-bloom/40 bg-accent-bloom/10',
    purple: 'border-accent-bloom/30 bg-accent-bloom/5',
  };

  return (
    <div className="p-6 h-full overflow-auto bg-mist text-ink">
      <h2 className="text-2xl font-bold mb-6">Calendar</h2>

      {/* 今日の日付 */}
      <div className="bg-surface border border-white/40 p-4 rounded-2xl shadow-sm shadow-black/5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 bg-accent-bloom/30 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-xs text-cloud font-medium">11月</span>
            <span className="text-2xl font-bold">10</span>
          </div>
          <div>
            <p className="text-sm text-cloud">今日</p>
            <p className="text-xl font-bold">2025年11月10日（日）</p>
          </div>
        </div>
      </div>

      {/* イベント一覧 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">今日の予定</h3>
        {events.map((event, i) => (
          <div
            key={i}
            className={`p-4 rounded-2xl border-l-4 ${colorMap[event.color]} shadow-sm`}
          >
            <h4 className="font-semibold mb-2">{event.title}</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-cloud">
                <RiTimeLine className="w-4 h-4" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-cloud">
                <RiMapPinLine className="w-4 h-4" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 新規予定追加ボタン */}
      <button className="w-full mt-6 py-3 bg-accent-sand text-ink rounded-full transition-colors hover:bg-accent-sand/80 font-medium">
        + 新しい予定を追加
      </button>
    </div>
  );
}
