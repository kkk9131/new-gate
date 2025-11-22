import { ProjectsApp } from '@/components/apps/ProjectsApp';
import { SettingsApp } from '@/components/apps/SettingsApp';
import { RevenueApp } from '@/components/apps/RevenueApp';
import { StoreApp } from '@/components/apps/StoreApp';
import { CalendarApp } from '@/components/apps/CalendarApp';

/**
 * アプリIDとコンポーネントのマッピング（Single Source of Truth）
 *
 * このオブジェクトがアプリIDの唯一の真実の情報源となります。
 * 新しいアプリを追加する際は、このオブジェクトに追加するだけで、
 * AppId型が自動的に更新されます。
 *
 * @example
 * // 新しいアプリを追加する場合
 * export const appComponents = {
 *   ...existing apps,
 *   newApp: NewAppComponent, // ← ここに追加するだけ
 * } as const;
 */
export const appComponents = {
  projects: ProjectsApp,
  settings: SettingsApp,
  revenue: RevenueApp,
  store: StoreApp,
  calendar: CalendarApp,
} as const;

/**
 * アプリID型（appComponentsから自動生成）
 *
 * appComponentsのキーから自動的に型を生成するため、
 * 手動でのメンテナンスが不要で、型の不整合が防げます。
 *
 * 存在しないアプリIDへのアクセスはコンパイルエラーになります。
 */
export type AppId = keyof typeof appComponents;
