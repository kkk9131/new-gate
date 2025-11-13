'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RiArrowLeftLine, RiCheckLine, RiLinksLine, RiRefreshLine } from 'react-icons/ri';
import type { IconType } from 'react-icons';
import { SiGithub, SiGooglecalendar, SiLinear, SiNotion, SiSlack } from 'react-icons/si';
import { useTranslation } from '@/lib/hooks/useTranslation';

const integrationIds = ['googleCalendar', 'github', 'slack', 'notion', 'linear'] as const;
type IntegrationId = (typeof integrationIds)[number];

interface IntegrationState {
  id: IntegrationId;
  connected: boolean;
  autoSync: boolean;
  lastSync: string;
  scopes: string[];
  category: 'calendar' | 'development' | 'communication' | 'knowledge';
}

interface IntegrationActivity {
  id: string;
  integrationId: IntegrationId;
  type: 'connected' | 'synced';
  timestamp: string;
}

const integrationMeta: Record<IntegrationId, { Icon: IconType; accent: string; badge: string }> = {
  googleCalendar: { Icon: SiGooglecalendar, accent: 'text-ink', badge: 'bg-cloud/30' },
  github: { Icon: SiGithub, accent: 'text-ink', badge: 'bg-cloud/30' },
  slack: { Icon: SiSlack, accent: 'text-ink', badge: 'bg-cloud/30' },
  notion: { Icon: SiNotion, accent: 'text-ink', badge: 'bg-cloud/30' },
  linear: { Icon: SiLinear, accent: 'text-ink', badge: 'bg-cloud/30' },
} as const;

export default function IntegrationsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [integrations, setIntegrations] = useState<IntegrationState[]>([
    {
      id: 'googleCalendar',
      connected: true,
      autoSync: true,
      lastSync: '2024/03/12 09:24',
      scopes: ['events.read', 'events.write'],
      category: 'calendar',
    },
    {
      id: 'github',
      connected: true,
      autoSync: true,
      lastSync: '2024/03/12 08:10',
      scopes: ['repo', 'pull_request'],
      category: 'development',
    },
    {
      id: 'slack',
      connected: false,
      autoSync: false,
      lastSync: '-',
      scopes: ['chat:write'],
      category: 'communication',
    },
    {
      id: 'notion',
      connected: false,
      autoSync: false,
      lastSync: '-',
      scopes: ['pages.read'],
      category: 'knowledge',
    },
    {
      id: 'linear',
      connected: true,
      autoSync: false,
      lastSync: '2024/03/11 19:40',
      scopes: ['issues.read', 'issues.write'],
      category: 'development',
    },
  ]);

  const [activity, setActivity] = useState<IntegrationActivity[]>([
    { id: 'act-1', integrationId: 'googleCalendar', type: 'synced', timestamp: '2024/03/12 09:24' },
    { id: 'act-2', integrationId: 'github', type: 'synced', timestamp: '2024/03/12 08:10' },
    { id: 'act-3', integrationId: 'linear', type: 'connected', timestamp: '2024/03/11 19:40' },
  ]);

  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFeedback = (message: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(message);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2600);
  };

  const handleBack = () => router.push('/');

  const toggleConnection = (id: IntegrationId) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id ? { ...integration, connected: !integration.connected } : integration,
      ),
    );
    showFeedback(t.integrations.feedback.statusUpdated);
  };

  const toggleAutoSync = (id: IntegrationId) => {
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id ? { ...integration, autoSync: !integration.autoSync } : integration,
      ),
    );
  };

  const syncNow = (id: IntegrationId) => {
    const timestamp = new Date().toLocaleString();
    setIntegrations((prev) =>
      prev.map((integration) =>
        integration.id === id ? { ...integration, lastSync: timestamp, connected: true } : integration,
      ),
    );
    setActivity((prev) => [{ id: `act-${Date.now()}`, integrationId: id, type: 'synced', timestamp }, ...prev].slice(0, 5));
    showFeedback(t.integrations.feedback.syncing);
  };

  const connectedCount = integrations.filter((integration) => integration.connected).length;
  const connectedLabel = t.integrations.connectedCount.replace(
    '{count}',
    `${connectedCount}/${integrations.length}`,
  );

  return (
    <div className="min-h-screen bg-mist flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-ink hover:text-accent-sand transition-colors font-medium"
        >
          <RiArrowLeftLine className="w-5 h-5" />
          <span>{t.common.backToDesktop}</span>
        </button>

        <div className="space-y-6">
          <section className="bg-surface rounded-2xl shadow-panel p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <RiLinksLine className="w-6 h-6 text-accent-sand" />
                  <h1 className="text-2xl font-bold text-ink">{t.integrations.title}</h1>
                </div>
                <p className="text-cloud mt-2">{t.integrations.description}</p>
              </div>
              <div className="rounded-2xl bg-mist/60 px-4 py-3">
                <p className="text-sm text-cloud">{t.integrations.overview}</p>
                <p className="text-xl font-semibold text-ink">{connectedLabel}</p>
              </div>
            </div>

            {feedback && (
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {feedback}
              </div>
            )}
          </section>

          <section className="bg-surface rounded-2xl shadow-panel p-6 space-y-4">
            {integrations.map((integration) => {
              const meta = integrationMeta[integration.id];
              const copy = t.integrations.services[integration.id];
              const Icon = meta.Icon;
              const statusLabel = integration.connected
                ? t.integrations.status.connected
                : t.integrations.status.disconnected;

              return (
                <div
                  key={integration.id}
                  className="border border-white/30 rounded-2xl p-4 md:p-5 bg-surface-strong"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-4">
                      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${meta.badge}`}>
                        <Icon className={`w-6 h-6 ${meta.accent}`} />
                      </span>
                      <div>
                        <p className="text-sm text-cloud">
                          {t.integrations.categories[integration.category]}
                        </p>
                        <p className="text-lg font-semibold text-ink">{copy.name}</p>
                        <p className="text-sm text-cloud">{copy.desc}</p>
                      </div>
                    </div>
                    <span
                      className={`self-start rounded-full px-3 py-1 text-xs font-medium ${
                        integration.connected
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-cloud/20 text-cloud'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-cloud">{t.integrations.lastSync}</p>
                      <p className="text-lg font-semibold text-ink">{integration.lastSync}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-cloud">{t.integrations.autoSync}</p>
                      <label className="mt-1 inline-flex items-center gap-2 text-sm text-ink">
                        <input
                          type="checkbox"
                          checked={integration.autoSync}
                          onChange={() => toggleAutoSync(integration.id)}
                          className="h-5 w-5 cursor-pointer rounded"
                          style={{ accentColor: '#1f2937' }}
                        />
                        {integration.autoSync ? t.integrations.status.connected : t.integrations.status.disconnected}
                      </label>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-cloud">{t.integrations.scopes}</p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {integration.scopes.map((scope) => (
                          <span
                            key={scope}
                            className="rounded-full bg-mist/60 px-3 py-1 text-xs font-semibold text-ink"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-end">
                    <button
                      type="button"
                      onClick={() => toggleConnection(integration.id)}
                      className="rounded-full border border-white/40 px-4 py-2 text-sm text-ink hover:border-ink/70"
                    >
                      {integration.connected
                        ? t.integrations.actions.disconnect
                        : t.integrations.actions.connect}
                    </button>
                    <button
                      type="button"
                      onClick={() => syncNow(integration.id)}
                      className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-mist"
                    >
                      <RiRefreshLine className="w-4 h-4" />
                      {t.integrations.actions.syncNow}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="bg-surface rounded-2xl shadow-panel p-6">
            <div className="flex items-center gap-3">
              <RiCheckLine className="w-6 h-6 text-accent-sand" />
              <h2 className="text-xl font-semibold text-ink">{t.integrations.activityTitle}</h2>
            </div>

            {activity.length === 0 ? (
              <p className="mt-4 text-sm text-cloud">{t.integrations.activityEmpty}</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {activity.map((item) => {
                  const copy = t.integrations.services[item.integrationId];
                  const description =
                    item.type === 'synced'
                      ? `${copy.name} · ${t.integrations.manualSync}`
                      : `${copy.name} · ${t.integrations.actions.connect}`;
                  return (
                    <li
                      key={item.id}
                      className="rounded-2xl border border-white/20 bg-surface-strong px-4 py-3 text-sm text-ink"
                    >
                      <div className="flex items-center justify-between">
                        <span>{description}</span>
                        <span className="text-cloud">{item.timestamp}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
