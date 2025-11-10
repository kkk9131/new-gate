'use client';

import { RiFolderLine, RiAddLine, RiMoreLine } from 'react-icons/ri';

export function ProjectsApp() {
  const projects = [
    { id: 1, name: 'ウェブサイトリニューアル', status: 'active', progress: 75 },
    { id: 2, name: 'モバイルアプリ開発', status: 'active', progress: 45 },
    { id: 3, name: 'マーケティングキャンペーン', status: 'completed', progress: 100 },
  ];

  const statusLabel: Record<string, string> = {
    active: '進行中',
    completed: '完了',
    on_hold: '保留',
  };

  const statusStyle: Record<string, string> = {
    active: 'bg-accent-calm/20 text-ink',
    completed: 'bg-cloud/30 text-cloud',
    on_hold: 'bg-cloud/40 text-ink',
  };

  return (
    <div className="p-6 h-full overflow-auto bg-mist text-ink">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Projects</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-accent-sand text-ink rounded-full transition-colors hover:bg-accent-sand/80">
          <RiAddLine className="w-5 h-5" />
          新規プロジェクト
        </button>
      </div>

      {/* プロジェクト一覧 */}
      <div className="space-y-4">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-surface border border-white/40 p-4 rounded-2xl shadow-sm shadow-black/5 hover:shadow-black/10 transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent-calm/20 flex items-center justify-center">
                  <RiFolderLine className="w-6 h-6 text-ink" />
                </div>
                <div>
                  <h3 className="font-semibold">{project.name}</h3>
                  <span className={`text-xs px-3 py-1 rounded-full ${statusStyle[project.status] ?? 'bg-cloud/30 text-ink'}`}>
                    {statusLabel[project.status] ?? '状態不明'}
                  </span>
                </div>
              </div>
              <button className="p-2 rounded-full text-cloud hover:bg-cloud/20">
                <RiMoreLine className="w-5 h-5" />
              </button>
            </div>

            {/* 進捗バー */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-cloud">
                <span>進捗</span>
                <span className="font-medium text-ink">{project.progress}%</span>
              </div>
              <div className="h-2 bg-cloud/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-calm rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
