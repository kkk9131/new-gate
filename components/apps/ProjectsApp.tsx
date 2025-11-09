'use client';

import { RiFolderLine, RiAddLine, RiMoreLine } from 'react-icons/ri';

export function ProjectsApp() {
  const projects = [
    { id: 1, name: 'ウェブサイトリニューアル', status: 'active', progress: 75 },
    { id: 2, name: 'モバイルアプリ開発', status: 'active', progress: 45 },
    { id: 3, name: 'マーケティングキャンペーン', status: 'completed', progress: 100 },
  ];

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Projects</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
          <RiAddLine className="w-5 h-5" />
          新規プロジェクト
        </button>
      </div>

      {/* プロジェクト一覧 */}
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <RiFolderLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{project.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    project.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {project.status === 'active' ? '進行中' : '完了'}
                  </span>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <RiMoreLine className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* 進捗バー */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">進捗</span>
                <span className="font-medium text-gray-800 dark:text-white">{project.progress}%</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
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
