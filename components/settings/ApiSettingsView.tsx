'use client';

import { useRef, useState, useEffect } from 'react';
import {
    RiAddLine,
    RiArrowLeftLine,
    RiBarChart2Line,
    RiCheckboxCircleLine,
    RiKeyLine,
    RiRefreshLine,
    RiSettings3Line,
    RiEyeLine,
    RiEyeOffLine,
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
    key: string; // Actual key (stored in localStorage)
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

interface ApiSettingsViewProps {
    onBack: () => void;
}

export function ApiSettingsView({ onBack }: ApiSettingsViewProps) {
    const { t } = useTranslation();

    const [defaultProvider, setDefaultProvider] = useState<ProviderId>('chatgpt');
    const [providers, setProviders] = useState<ProviderState[]>([
        {
            id: 'chatgpt',
            status: 'disconnected',
            latency: '—',
            usage: '—',
            key: '',
            lastRotated: '-',
            features: { embeddings: true, reasoning: true, streaming: true },
        },
        {
            id: 'claude',
            status: 'disconnected',
            latency: '—',
            usage: '—',
            key: '',
            lastRotated: '-',
            features: { embeddings: true, reasoning: true, streaming: true },
        },
        {
            id: 'gemini',
            status: 'disconnected',
            latency: '—',
            usage: '—',
            key: '',
            lastRotated: '-',
            features: { embeddings: true, reasoning: false, streaming: true },
        },
        // Others can be added later or kept as placeholders
    ]);

    const [showKey, setShowKey] = useState<Record<string, boolean>>({});
    const [feedback, setFeedback] = useState<string | null>(null);
    const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        const loadSettings = () => {
            const storedProviders = localStorage.getItem('llm_providers');
            if (storedProviders) {
                try {
                    const parsed = JSON.parse(storedProviders);
                    setProviders((prev) =>
                        prev.map((p) => {
                            const stored = parsed.find((sp: any) => sp.id === p.id);
                            return stored ? { ...p, ...stored } : p;
                        })
                    );
                } catch (e) {
                    console.error('Failed to parse stored providers', e);
                }
            }

            const storedDefault = localStorage.getItem('llm_default_provider');
            if (storedDefault && providerIds.includes(storedDefault as any)) {
                setDefaultProvider(storedDefault as ProviderId);
            }
        };
        loadSettings();
    }, []);

    // Save to localStorage whenever providers change
    useEffect(() => {
        const dataToSave = providers.map(p => ({
            id: p.id,
            status: p.status,
            key: p.key,
            lastRotated: p.lastRotated,
            features: p.features
        }));
        localStorage.setItem('llm_providers', JSON.stringify(dataToSave));
    }, [providers]);

    // Save default provider
    useEffect(() => {
        localStorage.setItem('llm_default_provider', defaultProvider);
    }, [defaultProvider]);

    const showFeedback = (message: string) => {
        if (feedbackTimer.current) {
            clearTimeout(feedbackTimer.current);
        }
        setFeedback(message);
        feedbackTimer.current = setTimeout(() => setFeedback(null), 2600);
    };

    const handleKeyChange = (id: ProviderId, newKey: string) => {
        setProviders((prev) =>
            prev.map((p) => (p.id === id ? { ...p, key: newKey, status: newKey ? 'connected' : 'disconnected' } : p))
        );
    };

    const toggleShowKey = (id: string) => {
        setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const connectedCount = providers.filter((provider) => provider.status === 'connected').length;
    const selectedProvider = providers.find((provider) => provider.id === defaultProvider);

    return (
        <div className="h-full overflow-y-auto bg-mist p-4 md:p-6">
            <div className="max-w-5xl mx-auto pb-20">
                <button
                    type="button"
                    onClick={onBack}
                    className="mb-4 flex items-center gap-2 text-ink hover:text-accent-sand transition-colors font-medium"
                >
                    <RiArrowLeftLine className="w-5 h-5" />
                    <span>{t.common.backToDesktop || 'Back'}</span>
                </button>

                <div className="space-y-6">
                    {/* Header Section */}
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
                            </div>
                            <div className="mt-4 flex flex-wrap gap-3">
                                {providers.map((p) => {
                                    const meta = providerMeta[p.id];
                                    const copy = t.apiSettings.providers[p.id] || { name: p.id };
                                    const isActive = defaultProvider === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setDefaultProvider(p.id)}
                                            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${isActive
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

                    {/* Providers List */}
                    <section className="bg-surface rounded-2xl shadow-panel p-6 space-y-4">
                        {providers.map((provider) => {
                            const meta = providerMeta[provider.id];
                            const copy = t.apiSettings.providers[provider.id] || { name: provider.id, desc: '' };
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
                                            className={`self-start rounded-full px-3 py-1 text-xs font-medium ${provider.status === 'connected'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-cloud/20 text-cloud'
                                                }`}
                                        >
                                            {statusLabel}
                                        </span>
                                    </div>

                                    <div className="mt-4 rounded-xl bg-mist/30 px-4 py-3">
                                        <p className="text-xs uppercase tracking-wide text-cloud">{t.apiSettings.keyLabel}</p>
                                        <div className="mt-1 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                            <div className="relative flex-1 max-w-md">
                                                <input
                                                    type={showKey[provider.id] ? "text" : "password"}
                                                    value={provider.key}
                                                    onChange={(e) => handleKeyChange(provider.id, e.target.value)}
                                                    placeholder="sk-..."
                                                    className="w-full bg-transparent border-none focus:ring-0 text-ink font-mono text-sm placeholder-cloud/50"
                                                />
                                                <button
                                                    onClick={() => toggleShowKey(provider.id)}
                                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-cloud hover:text-ink p-1"
                                                >
                                                    {showKey[provider.id] ? <RiEyeOffLine /> : <RiEyeLine />}
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {/* Actions can go here */}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </section>
                </div>
            </div>
        </div>
    );
}
