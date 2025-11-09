'use client';

import { RiRobotLine, RiPlayLine, RiPauseLine, RiTimeLine } from 'react-icons/ri';

export function AgentApp() {
  const tasks = [
    { name: '月次レポート生成', status: 'running', progress: 65, nextRun: '毎月1日' },
    { name: 'データバックアップ', status: 'paused', progress: 0, nextRun: '毎日午前2時' },
    { name: '売上集計', status: 'completed', progress: 100, nextRun: '毎週月曜日' },
  ];

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">AI Agent</h2>

      {/* エージェントタスク一覧 */}
      <div className="space-y-4">
        {tasks.map((task, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  task.status === 'running'
                    ? 'bg-blue-100 dark:bg-blue-900/30'
                    : task.status === 'paused'
                    ? 'bg-gray-100 dark:bg-gray-700'
                    : 'bg-green-100 dark:bg-green-900/30'
                }`}>
                  <RiRobotLine className={`w-5 h-5 ${
                    task.status === 'running'
                      ? 'text-blue-600 dark:text-blue-400'
                      : task.status === 'paused'
                      ? 'text-gray-600 dark:text-gray-400'
                      : 'text-green-600 dark:text-green-400'
                  }`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{task.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <RiTimeLine className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{task.nextRun}</span>
                  </div>
                </div>
              </div>

              {/* 制御ボタン */}
              <button className={`p-2 rounded-lg transition-colors ${
                task.status === 'running'
                  ? 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/50'
                  : 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50'
              }`}>
                {task.status === 'running' ? (
                  <RiPauseLine className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                ) : (
                  <RiPlayLine className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </button>
            </div>

            {/* ステータスバッジ */}
            <span className={`inline-block text-xs px-2 py-1 rounded-full mb-3 ${
              task.status === 'running'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : task.status === 'paused'
                ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              {task.status === 'running' ? '実行中' : task.status === 'paused' ? '一時停止' : '完了'}
            </span>

            {/* 進捗バー */}
            {task.status === 'running' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">進捗</span>
                  <span className="font-medium text-gray-800 dark:text-white">{task.progress}%</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 新規タスク作成ボタン */}
      <button className="w-full mt-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-colors font-medium shadow-sm">
        + 新しいエージェントタスクを作成
      </button>
    </div>
  );
}
