'use client';

import { useRouter } from 'next/navigation';
import { RiUserLine, RiNotificationLine, RiLockLine, RiPaletteLine, RiGlobalLine } from 'react-icons/ri';
import { IconType } from 'react-icons';
import { useTranslation } from '@/lib/hooks/useTranslation';

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
  const { t } = useTranslation();

  const sections: SettingSection[] = [
    {
      icon: RiUserLine,
      title: t.settings.profile,
      desc: t.settings.profileDesc,
      onClick: () => router.push('/profile')
    },
    {
      icon: RiNotificationLine,
      title: t.settings.notifications,
      desc: t.settings.notificationsDesc,
      onClick: () => router.push('/settings/notifications')
    },
    {
      icon: RiGlobalLine,
      title: t.settings.language,
      desc: t.settings.languageDesc,
      onClick: () => router.push('/settings/language')
    },
    {
      icon: RiLockLine,
      title: t.settings.security,
      desc: t.settings.securityDesc,
      onClick: () => router.push('/settings/security')
    },
    {
      icon: RiPaletteLine,
      title: t.settings.theme,
      desc: t.settings.themeDesc,
      onClick: () => console.log('テーマ設定を開く')
    },
  ];

  return (
    <div className="p-4 md:p-6 h-full overflow-auto bg-mist text-ink">
      <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">{t.settings.title}</h2>

      {/* 設定項目一覧 */}
      <div className="space-y-3 md:space-y-4">
        {sections.map((section, i) => {
          const Icon = section.icon;
          return (
            <button
              key={i}
              onClick={section.onClick}
              className="w-full bg-surface border border-white/40 p-3 md:p-4 rounded-2xl shadow-sm shadow-black/5 hover:shadow-black/10 transition-all text-left group"
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
