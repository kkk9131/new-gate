import { useLanguageSettings } from './useLanguageSettings';
import { translations, type Language } from '@/lib/i18n/translations';

/**
 * 翻訳フック
 *
 * ユーザーの言語設定に基づいて翻訳テキストを取得する
 */
export function useTranslation() {
  const { settings, isLoading } = useLanguageSettings();

  // 言語設定に基づいて翻訳を取得
  const t = translations[settings.ui_language as Language];

  return { t, isLoading, currentLanguage: settings.ui_language };
}
