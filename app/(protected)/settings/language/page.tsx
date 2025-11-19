'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RiArrowLeftLine, RiGlobalLine } from 'react-icons/ri';
import { format } from 'date-fns';
import { ja, enUS } from 'date-fns/locale';
import { useTranslation } from '@/lib/hooks/useTranslation';

/**
 * 言語設定の型定義
 */
interface LanguageSettings {
  ui_language: 'ja' | 'en';
  timezone: string;
  date_format: 'YYYY/MM/DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  time_format: '24h' | '12h';
}

/**
 * タイムゾーンの選択肢
 */
const TIMEZONES = [
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (東京)' },
  { value: 'America/New_York', label: 'America/New_York (ニューヨーク)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (ロサンゼルス)' },
  { value: 'Europe/London', label: 'Europe/London (ロンドン)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (パリ)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (上海)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (シンガポール)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (シドニー)' },
];

/**
 * 言語設定ページ
 *
 * UI言語、タイムゾーン、日付・時刻フォーマットの設定を提供します。
 */
export default function LanguagePage() {
  const router = useRouter();
  const { t, currentLanguage } = useTranslation();

  const [settings, setSettings] = useState<LanguageSettings>({
    ui_language: 'ja',
    timezone: 'Asia/Tokyo',
    date_format: 'YYYY/MM/DD',
    time_format: '24h',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 言語設定を取得
   */
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/language');
        if (!response.ok) throw new Error('言語設定の取得に失敗しました');

        const data = await response.json();
        setSettings(data);
      } catch (err: any) {
        console.error('言語設定取得エラー:', err);
        setError(err.message || '言語設定の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  /**
   * 言語設定を更新
   */
  const updateSettings = async (newSettings: Partial<LanguageSettings>) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/language', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '言語設定の更新に失敗しました');
      }

      // 設定を更新
      setSettings((prev) => ({ ...prev, ...newSettings }));
    } catch (err: any) {
      console.error('言語設定更新エラー:', err);
      setError(err.message || '言語設定の更新に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * デスクトップに戻る
   */
  const handleBack = () => {
    router.push('/');
  };

  /**
   * 日付フォーマットのプレビューを生成
   */
  const getDatePreview = (dateFormat: string) => {
    const now = new Date();
    const locale = settings.ui_language === 'ja' ? ja : enUS;
    switch (dateFormat) {
      case 'YYYY/MM/DD':
        return format(now, 'yyyy/MM/dd', { locale });
      case 'MM/DD/YYYY':
        return format(now, 'MM/dd/yyyy', { locale });
      case 'DD/MM/YYYY':
        return format(now, 'dd/MM/yyyy', { locale });
      default:
        return '';
    }
  };

  /**
   * 時刻フォーマットのプレビューを生成
   */
  const getTimePreview = (timeFormat: string) => {
    const now = new Date();
    const locale = settings.ui_language === 'ja' ? ja : enUS;
    return timeFormat === '24h'
      ? format(now, 'HH:mm', { locale })
      : format(now, 'hh:mm a', { locale });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mist flex items-center justify-center p-4">
        <p className="text-cloud">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* 戻るボタン */}
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-ink hover:text-accent-sand transition-colors font-medium"
        >
          <RiArrowLeftLine className="w-5 h-5" />
          <span>{t.common.backToDesktop}</span>
        </button>

        {/* 言語設定 */}
        <div className="bg-surface rounded-2xl shadow-panel p-8">
          <div className="flex items-center gap-2 mb-6">
            <RiGlobalLine className="w-6 h-6 text-accent-sand" />
            <h2 className="text-2xl font-bold text-ink">{t.language.title}</h2>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm mb-4"
            >
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* UI言語 */}
            <div>
              <h3 className="text-lg font-semibold text-ink mb-4">📱 {t.language.uiLanguage}</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-surface-strong rounded-xl hover:bg-mist transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="ui_language"
                    checked={settings.ui_language === 'ja'}
                    onChange={() => updateSettings({ ui_language: 'ja' })}
                    disabled={isSaving}
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-ink">{t.language.japanese}</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-surface-strong rounded-xl hover:bg-mist transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="ui_language"
                    checked={settings.ui_language === 'en'}
                    onChange={() => updateSettings({ ui_language: 'en' })}
                    disabled={isSaving}
                    style={{ accentColor: 'rgb(213 196 170)' }}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-ink">{t.language.english}</span>
                </label>
              </div>
            </div>

            {/* タイムゾーン */}
            <div>
              <h3 className="text-lg font-semibold text-ink mb-4">🌍 {t.language.timezone}</h3>
              <select
                value={settings.timezone}
                onChange={(e) => updateSettings({ timezone: e.target.value })}
                disabled={isSaving}
                className="w-full px-4 py-3 bg-surface-strong text-ink rounded-xl border border-cloud/20 focus:outline-none focus:ring-2 focus:ring-accent-sand transition-colors cursor-pointer"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 日付フォーマット */}
            <div>
              <h3 className="text-lg font-semibold text-ink mb-4">📅 {t.language.dateFormat}</h3>
              <div className="space-y-2">
                {[
                  { value: 'YYYY/MM/DD' as const, label: 'YYYY/MM/DD' },
                  { value: 'MM/DD/YYYY' as const, label: 'MM/DD/YYYY' },
                  { value: 'DD/MM/YYYY' as const, label: 'DD/MM/YYYY' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-3 bg-surface-strong rounded-xl hover:bg-mist transition-colors cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="date_format"
                      checked={settings.date_format === option.value}
                      onChange={() => updateSettings({ date_format: option.value })}
                      disabled={isSaving}
                      style={{ accentColor: 'rgb(213 196 170)' }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-ink flex-1">{option.label}</span>
                    <span className="text-cloud text-sm">
                      ({getDatePreview(option.value)})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 時刻フォーマット */}
            <div>
              <h3 className="text-lg font-semibold text-ink mb-4">🕐 {t.language.timeFormat}</h3>
              <div className="space-y-2">
                {[
                  { value: '24h' as const, label: t.language.time24h },
                  { value: '12h' as const, label: t.language.time12h },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-3 p-3 bg-surface-strong rounded-xl hover:bg-mist transition-colors cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="time_format"
                      checked={settings.time_format === option.value}
                      onChange={() => updateSettings({ time_format: option.value })}
                      disabled={isSaving}
                      style={{ accentColor: 'rgb(213 196 170)' }}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className="text-ink flex-1">{option.label}</span>
                    <span className="text-cloud text-sm">
                      ({getTimePreview(option.value)})
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* 情報メッセージ */}
            <div className="p-4 bg-accent-sand/10 rounded-xl text-sm text-ink">
              ℹ️ {t.language.autoSaveInfo}
            </div>

            {/* 保存中インジケーター */}
            {isSaving && (
              <div className="text-center text-cloud text-sm">{t.common.saving}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
