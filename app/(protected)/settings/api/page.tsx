'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RiAddLine,
  RiArrowLeftLine,
  RiBarChart2Line,
  RiCheckboxCircleLine,
  RiCursorLine,
  RiKeyLine,
  RiRefreshLine,
  RiSettings3Line,
} from 'react-icons/ri';
import type { IconType } from 'react-icons';
import { SiAnthropic, SiGoogle, SiOpenai } from 'react-icons/si';
import { useTranslation } from '@/lib/hooks/useTranslation';
import { CursorLogo } from '@/components/icons/CursorLogo';

const providerIds = ['chatgpt', 'claude', 'gemini', 'cursor', 'custom'] as const;
type ProviderId = (typeof providerIds)[number];
type FeatureKey = 'embeddings' | 'reasoning' | 'streaming';

interface ProviderState {
  id: ProviderId;
  status: 'connected' | 'disconnected';
  latency: string;
  usage: string;
  maskedKey: string;
  lastRotated: string;
  features: Record<FeatureKey, boolean>;
}

interface CustomApi {
  id: string;
  name: string;
  baseUrl: string;
  key: string;
  autoSync: boolean;
}

const CursorIcon: IconType = (props) => <CursorLogo {...props} />;

const providerMeta: Record<ProviderId, { Icon: IconType; accent: string; badge: string }> = {
  chatgpt: { Icon: SiOpenai, accent: 'text-ink', badge: 'bg-cloud/30' },
  claude: { Icon: SiAnthropic, accent: 'text-ink', badge: 'bg-cloud/30' },
  gemini: { Icon: SiGoogle, accent: 'text-ink', badge: 'bg-cloud/30' },
  cursor: { Icon: CursorIcon, accent: 'text-ink', badge: 'bg-cloud/30' },
  custom: { Icon: RiSettings3Line, accent: 'text-ink', badge: 'bg-cloud/30' },
} as const;

export default function ApiSettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();

  const [defaultProvider, setDefaultProvider] = useState<ProviderId>('chatgpt');
  const [providers, setProviders] = useState<ProviderState[]>([
    {
      id: 'chatgpt',
      status: 'connected',
      latency: '120ms',
      usage: '1.2M tokens',
      maskedKey: 'sk-live-98af****62b',
      lastRotated: '2024/03/12 09:20',
      features: { embeddings: true, reasoning: true, streaming: true },
    },
    {
      id: 'claude',
      status: 'connected',
      latency: '160ms',
      usage: '620K tokens',
      maskedKey: 'sk-live-b771****1ac',
      lastRotated: '2024/03/02 14:05',
      features: { embeddings: true, reasoning: true, streaming: false },
    },
    {
      id: 'gemini',
      status: 'connected',
      latency: '180ms',
      usage: '310K tokens',
      maskedKey: 'sk-live-55de****9f1',
      lastRotated: '2024/02/22 21:00',
      features: { embeddings: true, reasoning: false, streaming: true },
    },
    {
      id: 'cursor',
      status: 'connected',
      latency: '95ms',
      usage: '42 automations',
      maskedKey: 'sk-live-887c****4d2',
      lastRotated: '2024/03/10 11:18',
      features: { embeddings: false, reasoning: false, streaming: true },
    },
    {
      id: 'custom',
      status: 'disconnected',
      latency: '—',
      usage: '—',
      maskedKey: 'sk-live-****',
      lastRotated: '-',
      features: { embeddings: true, reasoning: false, streaming: false },
    },
  ]);

  const [customApis, setCustomApis] = useState<CustomApi[]>([
    {
      id: 'rag-internal',
      name: 'Internal RAG',
      baseUrl: 'https://api.internal.ai/rag',
      key: 'rag-live-21c0****90',
      autoSync: true,
    },
  ]);
  const [newCustom, setNewCustom] = useState({ name: '', baseUrl: '', key: '' });
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const customIdRef = useRef(0);

  const featureLabels: Record<FeatureKey, string> = {
    embeddings: t.apiSettings.embeddings,
    reasoning: t.apiSettings.reasoning,
    streaming: t.apiSettings.streaming,
  };

  const showFeedback = (message: string) => {
    if (feedbackTimer.current) {
      clearTimeout(feedbackTimer.current);
    }
    setFeedback(message);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2600);
  };

  const handleBack = () => router.push('/');

  const handleToggleConnection = (id: ProviderId) => {
    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === id
          ? {
              ...provider,
              status: provider.status === 'connected' ? 'disconnected' : 'connected',
            }
          : provider,
      ),
    );
    showFeedback(t.apiSettings.feedback.connectionUpdated);
  };

  const handleRotateKey = (id: ProviderId) => {
    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === id
          ? {
              ...provider,
              maskedKey: `sk-live-${Math.random().toString(36).slice(2, 6)}****${Math.random().toString(36).slice(2, 4)}`,
              lastRotated: new Date().toLocaleString(),
            }
          : provider,
      ),
    );
    showFeedback(t.apiSettings.feedback.rotated);
  };

  const handleToggleFeature = (id: ProviderId, feature: FeatureKey) => {
    setProviders((prev) =>
      prev.map((provider) =>
        provider.id === id
          ? {
              ...provider,
              features: {
                ...provider.features,
                [feature]: !provider.features[feature],
              },
            }
          : provider,
      ),
    );
  };

  const handleAddCustom = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newCustom.name || !newCustom.baseUrl) {
      showFeedback(t.apiSettings.feedback.missingFields);
      return;
    }

    customIdRef.current += 1;

    const entry: CustomApi = {
      id: `custom-${customIdRef.current}`,
      name: newCustom.name,
      baseUrl: newCustom.baseUrl,
      key: newCustom.key || 'sk-live-****',
      autoSync: true,
    };

    setCustomApis((prev) => [entry, ...prev]);
    setNewCustom({ name: '', baseUrl: '', key: '' });
    showFeedback(t.apiSettings.feedback.customAdded);
  };

  const handleToggleCustomAutoSync = (id: string) => {
    setCustomApis((prev) =>
      prev.map((api) =>
        api.id === id
          ? {
              ...api,
              autoSync: !api.autoSync,
            }
          : api,
      ),
    );
  };

  const connectedCount = providers.filter((provider) => provider.status === 'connected').length;
  const selectedProvider = providers.find((provider) => provider.id === defaultProvider);
  const requestsToday = 184;
  const monthlyTokens = '4.2M';
  const autoSyncCount = customApis.filter((api) => api.autoSync).length;
  const autoSyncSummary = customApis.length ? `${autoSyncCount}/${customApis.length}` : '0';

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
                  <RiKeyLine className="w-6 h-6 text-accent-sand" />
                  <h1 className="text-2xl font-bold text-ink">{t.apiSettings.title}</h1>
                </div>
                <p className="text-cloud mt-2">{t.apiSettings.description}</p>
              </div>
              <div className="bg-mist/60 rounded-xl px-4 py-3">
                <p className="text-sm text-cloud">{t.apiSettings.providerHealth}</p>
                <p className="text-xl font-semibold text-ink">
                  {connectedCount} / {providers.length} {t.apiSettings.status.connected}
                </p>
              </div>
            </div>

            {feedback && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {feedback}
              </div>
            )}

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm text-cloud">{t.apiSettings.defaultProvider}</p>
                  <h2 className="text-lg font-semibold text-ink">{t.apiSettings.defaultProviderDesc}</h2>
                </div>
                <div className="flex items-center gap-2 text-sm text-cloud">
                  <RiCheckboxCircleLine className="w-4 h-4 text-emerald-500" />
                  <span>
                    {selectedProvider?.usage || '—'} · {selectedProvider?.latency || '—'}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                {providerIds.map((id) => {
                  const meta = providerMeta[id];
                  const copy = t.apiSettings.providers[id];
                  const isActive = defaultProvider === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setDefaultProvider(id)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                        isActive
                          ? 'border-ink bg-ink text-mist shadow-inner'
                          : 'border-white/40 bg-surface-strong text-ink hover:border-ink/60'
                      }`}
                    >
                      <meta.Icon className={`w-4 h-4 ${isActive ? 'text-mist' : meta.accent}`} />
                      <span>{copy.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="bg-surface rounded-2xl shadow-panel p-6 space-y-4">
            {providers.map((provider) => {
              const meta = providerMeta[provider.id];
              const copy = t.apiSettings.providers[provider.id];
              const Icon = meta.Icon;
              const statusLabel = t.apiSettings.status[provider.status];

              return (
                <div
                  key={provider.id}
                  className="border border-white/30 rounded-2xl p-4 md:p-5 bg-surface-strong"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-center gap-4">
                      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${meta.badge}`}>
                        <Icon className={`w-6 h-6 ${meta.accent}`} />
                      </span>
                      <div>
                        <p className="text-sm text-cloud">{copy.desc}</p>
                        <p className="text-base font-semibold text-ink">{copy.name}</p>
                      </div>
                    </div>
                    <span
                      className={`self-start rounded-full px-3 py-1 text-xs font-medium ${
                        provider.status === 'connected'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-cloud/20 text-cloud'
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-cloud">{t.apiSettings.latency}</p>
                      <p className="text-lg font-semibold text-ink">{provider.latency}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-cloud">{t.apiSettings.usage}</p>
                      <p className="text-lg font-semibold text-ink">{provider.usage}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-cloud">{t.apiSettings.lastRotated}</p>
                      <p className="text-lg font-semibold text-ink">{provider.lastRotated}</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-mist/30 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-cloud">{t.apiSettings.keyLabel}</p>
                    <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <code className="font-mono text-sm text-ink">{provider.maskedKey}</code>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleConnection(provider.id)}
                          className="rounded-full border border-white/40 px-3 py-1.5 text-sm text-ink hover:border-ink/70"
                        >
                          {provider.status === 'connected'
                            ? t.apiSettings.actions.disconnect
                            : t.apiSettings.actions.connect}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRotateKey(provider.id)}
                          disabled={provider.status !== 'connected'}
                          className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-sm text-mist disabled:bg-cloud/40"
                        >
                          <RiRefreshLine className="w-4 h-4" />
                          {t.apiSettings.actions.rotateKey}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wide text-cloud mb-2">{t.apiSettings.featureFlags}</p>
                    <div className="flex flex-wrap gap-2">
                      {(Object.keys(provider.features) as FeatureKey[]).map((feature) => (
                        <button
                          key={feature}
                          type="button"
                          onClick={() => handleToggleFeature(provider.id, feature)}
                          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                            provider.features[feature]
                              ? 'border-ink bg-ink text-mist'
                              : 'border-white/40 text-ink hover:border-ink/50'
                          }`}
                        >
                          {featureLabels[feature]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="bg-surface rounded-2xl shadow-panel p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-ink">{t.apiSettings.customApis}</h2>
                <p className="text-cloud">{t.apiSettings.customApisDesc}</p>
              </div>
              <div className="bg-mist/50 rounded-xl px-4 py-2">
                <p className="text-sm text-cloud">{t.apiSettings.autoSync}</p>
                <p className="text-lg font-semibold text-ink">{autoSyncSummary}</p>
              </div>
            </div>

            <form onSubmit={handleAddCustom} className="mt-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-sm text-cloud">
                  {t.apiSettings.customName}
                  <input
                    type="text"
                    value={newCustom.name}
                    onChange={(event) => setNewCustom((prev) => ({ ...prev, name: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/30 bg-surface-strong px-4 py-2.5 text-ink focus:border-ink"
                    placeholder="Internal LLM"
                  />
                </label>
                <label className="text-sm text-cloud">
                  {t.apiSettings.customBaseUrl}
                  <input
                    type="text"
                    value={newCustom.baseUrl}
                    onChange={(event) => setNewCustom((prev) => ({ ...prev, baseUrl: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/30 bg-surface-strong px-4 py-2.5 text-ink focus:border-ink"
                    placeholder="https://api.example.dev"
                  />
                </label>
                <label className="text-sm text-cloud">
                  {t.apiSettings.customKey}
                  <input
                    type="text"
                    value={newCustom.key}
                    onChange={(event) => setNewCustom((prev) => ({ ...prev, key: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/30 bg-surface-strong px-4 py-2.5 text-ink focus:border-ink"
                    placeholder="sk-live-xxxx"
                  />
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-mist"
                >
                  <RiAddLine className="w-4 h-4" />
                  {t.apiSettings.addCustom}
                </button>
              </div>
            </form>

            <div className="mt-6 space-y-3">
              {customApis.length === 0 && (
                <p className="text-sm text-cloud">{t.apiSettings.customEmpty}</p>
              )}
              {customApis.map((api) => (
                <div key={api.id} className="flex flex-col gap-3 rounded-2xl border border-white/20 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-base font-semibold text-ink">{api.name}</p>
                    <p className="font-mono text-sm text-cloud">{api.baseUrl}</p>
                    <p className="font-mono text-xs text-cloud/80">{api.key}</p>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="checkbox"
                      checked={api.autoSync}
                      onChange={() => handleToggleCustomAutoSync(api.id)}
                      className="h-5 w-5 cursor-pointer rounded"
                      style={{ accentColor: '#1f2937' }}
                    />
                    {t.apiSettings.autoSync}
                  </label>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-surface rounded-2xl shadow-panel p-6">
            <div className="flex items-center gap-3">
              <RiBarChart2Line className="w-6 h-6 text-accent-sand" />
              <h2 className="text-xl font-semibold text-ink">{t.apiSettings.previewTitle}</h2>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-white/20 bg-surface-strong px-4 py-4">
                <p className="text-sm text-cloud">{t.apiSettings.requestsToday}</p>
                <p className="text-2xl font-semibold text-ink">{requestsToday}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-surface-strong px-4 py-4">
                <p className="text-sm text-cloud">{t.apiSettings.monthlyTokens}</p>
                <p className="text-2xl font-semibold text-ink">{monthlyTokens}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-surface-strong px-4 py-4">
                <p className="text-sm text-cloud">{t.apiSettings.providerHealth}</p>
                <p className="text-2xl font-semibold text-ink">
                  {((connectedCount / providers.length) * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
