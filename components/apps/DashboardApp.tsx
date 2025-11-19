'use client';

import { RiDashboardLine, RiLineChartLine, RiUserLine, RiFileListLine } from 'react-icons/ri';

export function DashboardApp() {
  return (
    <div className="p-4 md:p-6 h-full overflow-auto bg-mist text-ink">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Dashboard</h2>

      {/* 統計カード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
        <div className="bg-surface border border-white/40 p-4 rounded-2xl shadow-sm shadow-black/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent-calm/30 flex items-center justify-center">
              <RiFileListLine className="w-6 h-6 text-ink" />
            </div>
            <div>
              <p className="text-sm text-cloud">プロジェクト数</p>
              <p className="text-xl md:text-2xl font-bold">12</p>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-white/40 p-4 rounded-2xl shadow-sm shadow-black/5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-accent-warm/30 flex items-center justify-center">
              <RiLineChartLine className="w-6 h-6 text-ink" />
            </div>
            <div>
              <p className="text-sm text-cloud">今月の売上</p>
              <p className="text-xl md:text-2xl font-bold">¥850K</p>
            </div>
          </div>
        </div>
      </div>

      {/* 最近のアクティビティ */}
      <div className="bg-surface border border-white/40 p-3 md:p-4 rounded-2xl shadow-sm shadow-black/5">
        <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">最近のアクティビティ</h3>
        <div className="space-y-3">
          {['新規プロジェクト作成', '売上データ更新', '設定変更'].map((activity, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-cloud/10"
            >
              <div className="w-8 h-8 rounded-full bg-accent-bloom/30 flex items-center justify-center">
                <RiDashboardLine className="w-4 h-4 text-ink" />
              </div>
              <p className="text-sm">{activity}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
