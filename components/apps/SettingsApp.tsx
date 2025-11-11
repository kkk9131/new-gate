'use client';

import { useRouter } from 'next/navigation';
import { RiUserLine, RiNotificationLine, RiLockLine, RiPaletteLine } from 'react-icons/ri';
import { IconType } from 'react-icons';

/**
 * 設定セクションの型定義
 */
interface SettingSection {
  icon: IconType;
  title: string;
  desc: string;
  onClick: () => void;
}

export function SettingsApp() {
  const router = useRouter();

  const sections: SettingSection[] = [
    {
      icon: RiUserLine,
      title: 'プロフィール',
      desc: 'アカウント情報の管理',
      onClick: () => router.push('/profile')
    },
    {
      icon: RiNotificationLine,
      title: '通知設定',
      desc: '通知とアラートの設定',
      onClick: () => console.log('通知設定を開く')
    },
    {
      icon: RiLockLine,
      title: 'セキュリティ',
      desc: 'パスワードとセキュリティ',
      onClick: () => console.log('セキュリティ設定を開く')
    },
    {
      icon: RiPaletteLine,
      title: 'テーマ設定',
      desc: '外観とカスタマイズ',
      onClick: () => console.log('テーマ設定を開く')
    },
  ];

  return (
    <div className="p-6 h-full overflow-auto bg-mist text-ink">
      <h2 className="text-2xl font-bold mb-6">Settings</h2>

      {/* 設定項目一覧 */}
      <div className="space-y-4">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <button
              key={i}
              onClick={section.onClick}
              className="w-full bg-surface border border-white/40 p-4 rounded-2xl shadow-sm shadow-black/5 hover:shadow-black/10 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cloud/20 text-ink">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-ink transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-cloud">{section.desc}</p>
                </div>
                <div className="text-cloud group-hover:text-ink transition-colors">
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
