import { DashboardApp } from '@/components/apps/DashboardApp';
import { ProjectsApp } from '@/components/apps/ProjectsApp';
import { SettingsApp } from '@/components/apps/SettingsApp';
import { RevenueApp } from '@/components/apps/RevenueApp';
import { StoreApp } from '@/components/apps/StoreApp';
import { AgentApp } from '@/components/apps/AgentApp';
import { AnalyticsApp } from '@/components/apps/AnalyticsApp';
import { CalendarApp } from '@/components/apps/CalendarApp';

/**
 * アプリID（厳密な型定義で型安全性を向上）
 * 存在しないアプリIDへのアクセスはコンパイルエラーになる
 */
export type AppId = 'dashboard' | 'projects' | 'settings' | 'revenue' | 'store' | 'agent' | 'analytics' | 'calendar';

/**
 * アプリIDとコンポーネントのマッピング
 * 型安全性を保証するためAppId型を使用
 */
export const appComponents: Record<AppId, React.ComponentType> = {
  dashboard: DashboardApp,
  projects: ProjectsApp,
  settings: SettingsApp,
  revenue: RevenueApp,
  store: StoreApp,
  agent: AgentApp,
  analytics: AnalyticsApp,
  calendar: CalendarApp,
};
