'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RiUserLine, RiNotificationLine, RiLockLine, RiPaletteLine, RiGlobalLine, RiShieldLine, RiAlertLine } from 'react-icons/ri';
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

  // 認証プロバイダー情報（プロフィールの注意マーク表示用）
  const [authProvider, setAuthProvider] = useState<'google' | 'email'>('email');
  const [hasPassword, setHasPassword] = useState(true);
  const [isLoadingProvider, setIsLoadingProvider] = useState(true);

  /**
   * 認証プロバイダー情報を取得
   * Googleユーザーでパスワード未設定の場合、プロフィールに注意マークを表示
   */
  useEffect(() => {
    const fetchAuthProvider = async () => {
      try {
        // タイムスタンプ付きクエリパラメータでキャッシュを完全に回避
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/settings/security/auth-provider?t=${timestamp}`, {
          cache: 'no-store', // キャッシュを無効化して常に最新データを取得
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        });
        if (!response.ok) throw new Error('認証プロバイダー情報の取得に失敗しました');
        const data = await response.json();
        setAuthProvider(data.provider);
        setHasPassword(data.hasPassword);
      } catch (err: any) {
        console.error('認証プロバイダー情報取得エラー:', err);
        // エラーが発生してもデフォルト値で続行
      } finally {
        setIsLoadingProvider(false);
      }
    };

    fetchAuthProvider();
  }, []);

  // プロフィールに注意マークを表示すべきか
  const shouldShowProfileAlert = authProvider === 'google' && !hasPassword;

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
      icon: RiShieldLine,
      title: t.settings.privacy,
      desc: t.settings.privacyDesc,
      onClick: () => router.push('/settings/privacy')
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
          const isProfileSection = i === 0; // プロフィールは最初のセクション
          const showAlert = isProfileSection && shouldShowProfileAlert && !isLoadingProvider;

          return (
            <button
              key={i}
              onClick={section.onClick}
              className="w-full bg-surface border border-white/40 p-3 md:p-4 rounded-2xl shadow-sm shadow-black/5 hover:shadow-black/10 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-cloud/20 text-ink relative">
                  <Icon className="w-6 h-6" />
                  {/* 注意マーク（Googleユーザーでパスワード未設定の場合のみ表示） */}
                  {showAlert && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                      <RiAlertLine className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold group-hover:text-ink transition-colors flex items-center gap-2">
                    {section.title}
                    {/* タイトル横にも小さい注意マークを表示 */}
                    {showAlert && (
                      <span className="text-xs text-red-500">
                        (パスワード未設定)
                      </span>
                    )}
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
