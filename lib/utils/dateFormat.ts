import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ja, enUS } from 'date-fns/locale';
import type { LanguageSettings } from '@/lib/hooks/useLanguageSettings';

/**
 * ユーザーの言語設定に基づいて日付をフォーマットする
 *
 * @param date - フォーマットする日付
 * @param settings - 言語設定
 * @param includeTime - 時刻を含めるかどうか（デフォルト: false）
 * @returns フォーマットされた日付文字列
 */
export function formatDate(
  date: Date | string,
  settings: LanguageSettings,
  includeTime: boolean = false
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const locale = settings.ui_language === 'ja' ? ja : enUS;

  // 日付フォーマットパターンを取得
  let datePattern: string;
  switch (settings.date_format) {
    case 'YYYY/MM/DD':
      datePattern = 'yyyy/MM/dd';
      break;
    case 'MM/DD/YYYY':
      datePattern = 'MM/dd/yyyy';
      break;
    case 'DD/MM/YYYY':
      datePattern = 'dd/MM/yyyy';
      break;
    default:
      datePattern = 'yyyy/MM/dd';
  }

  // 時刻フォーマットパターンを取得
  let timePattern = '';
  if (includeTime) {
    timePattern = settings.time_format === '24h' ? ' HH:mm' : ' hh:mm a';
  }

  const fullPattern = datePattern + timePattern;

  try {
    // タイムゾーンを考慮してフォーマット
    return formatInTimeZone(dateObj, settings.timezone, fullPattern, { locale });
  } catch (error) {
    console.error('日付フォーマットエラー:', error);
    // フォールバック: タイムゾーンなしでフォーマット
    return format(dateObj, fullPattern, { locale });
  }
}

/**
 * 日付と時刻を両方含めてフォーマットする
 *
 * @param date - フォーマットする日付
 * @param settings - 言語設定
 * @returns フォーマットされた日時文字列
 */
export function formatDateTime(
  date: Date | string,
  settings: LanguageSettings
): string {
  return formatDate(date, settings, true);
}

/**
 * 相対時間表示（例: 2時間前）
 *
 * @param date - フォーマットする日付
 * @param settings - 言語設定
 * @returns 相対時間文字列
 */
export function formatRelativeTime(
  date: Date | string,
  settings: LanguageSettings
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const isJa = settings.ui_language === 'ja';

  if (diffMinutes < 1) {
    return isJa ? 'たった今' : 'Just now';
  } else if (diffMinutes < 60) {
    return isJa ? `${diffMinutes}分前` : `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return isJa ? `${diffHours}時間前` : `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return isJa ? `${diffDays}日前` : `${diffDays}d ago`;
  } else {
    // 1週間以上前は通常の日付表示
    return formatDate(dateObj, settings, false);
  }
}
