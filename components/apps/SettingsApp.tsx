'use client';

import { RiUserLine, RiNotificationLine, RiLockLine, RiPaletteLine } from 'react-icons/ri';

export function SettingsApp() {
  const sections = [
    { icon: RiUserLine, title: 'プロフィール', desc: 'アカウント情報の管理', color: 'blue' },
    { icon: RiNotificationLine, title: '通知設定', desc: '通知とアラートの設定', color: 'green' },
    { icon: RiLockLine, title: 'セキュリティ', desc: 'パスワードとセキュリティ', color: 'red' },
    { icon: RiPaletteLine, title: 'テーマ設定', desc: '外観とカスタマイズ', color: 'purple' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="p-6 h-full overflow-auto bg-gray-50 dark:bg-gray-900">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings</h2>

      {/* 設定項目一覧 */}
      <div className="space-y-4">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <button
              key={i}
              className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorMap[section.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{section.desc}</p>
                </div>
                <div className="text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                  →
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
