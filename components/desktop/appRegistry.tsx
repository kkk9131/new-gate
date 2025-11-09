import { DashboardApp } from '@/components/apps/DashboardApp';
import { ProjectsApp } from '@/components/apps/ProjectsApp';
import { SettingsApp } from '@/components/apps/SettingsApp';
import { RevenueApp } from '@/components/apps/RevenueApp';
import { StoreApp } from '@/components/apps/StoreApp';
import { AgentApp } from '@/components/apps/AgentApp';
import { AnalyticsApp } from '@/components/apps/AnalyticsApp';
import { CalendarApp } from '@/components/apps/CalendarApp';

export const appComponents: Record<string, React.ComponentType> = {
  dashboard: DashboardApp,
  projects: ProjectsApp,
  settings: SettingsApp,
  revenue: RevenueApp,
  store: StoreApp,
  agent: AgentApp,
  analytics: AnalyticsApp,
  calendar: CalendarApp,
};
