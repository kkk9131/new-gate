import { useState, useEffect } from 'react';

/**
 * 言語設定の型定義
 */
export interface LanguageSettings {
  ui_language: 'ja' | 'en';
  timezone: string;
  date_format: 'YYYY/MM/DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY';
  time_format: '24h' | '12h';
}

/**
 * 言語設定を取得・管理するカスタムフック
 *
 * @returns 言語設定とローディング状態
 */
export function useLanguageSettings() {
  const [settings, setSettings] = useState<LanguageSettings>({
    ui_language: 'ja',
    timezone: 'Asia/Tokyo',
    date_format: 'YYYY/MM/DD',
    time_format: '24h',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/language');
        if (!response.ok) {
          throw new Error('言語設定の取得に失敗しました');
        }

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

  return { settings, isLoading, error };
}
