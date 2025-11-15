'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  createRef,
  type RefObject,
  type ReactNode,
} from 'react';
import {
  RiCpuLine,
  RiSignalTowerLine,
  RiSpeedLine,
  RiRadarLine,
  RiPulseLine,
} from 'react-icons/ri';
import { useDesktopStore, type QuadScreenId, QUAD_SCREEN_LABELS } from '@/store/desktopStore';

type StreamStatus = 'idle' | 'initializing' | 'live' | 'error' | 'unsupported';

interface StreamMetrics {
  bitrateKbps: number;
  packetRate: number;
  latencyMs: number;
  cpuLoad: number;
  fps: number;
  jitter: number;
}

interface StreamConfig {
  id: QuadScreenId;
  label: string;
  description: string;
  focusApp: string;
  paletteShift: number;
}

interface StreamState extends StreamConfig {
  status: StreamStatus;
  metrics: StreamMetrics;
}

interface SimulatedStreamContext {
  canvas: HTMLCanvasElement;
  animationFrameId: number;
  senderPc: RTCPeerConnection;
  receiverPc: RTCPeerConnection;
  sourceStream: MediaStream;
  mirroredStream?: MediaStream;
  fps: number;
  lastFrameTimestamp: number;
  lastBytesSent?: number;
  lastStatsTimestamp?: number;
  lastPacketsSent?: number;
}

const STREAM_CONFIGS: StreamConfig[] = [
  {
    id: 'topLeft',
    label: 'Screen 1',
    description: 'Salesforceオペレーション',
    focusApp: 'CRM自動入力',
    paletteShift: 12,
  },
  {
    id: 'topRight',
    label: 'Screen 2',
    description: '会計システム同期',
    focusApp: '経費精算Bot',
    paletteShift: 140,
  },
  {
    id: 'bottomLeft',
    label: 'Screen 3',
    description: 'Notionリサーチ',
    focusApp: '仕様ドラフト',
    paletteShift: 220,
  },
  {
    id: 'bottomRight',
    label: 'Screen 4',
    description: 'Figmaデザイン同期',
    focusApp: 'UIレビュー',
    paletteShift: 300,
  },
];

function canUseWebRTC(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  if (typeof RTCPeerConnection === 'undefined') {
    return false;
  }
  const canvas = document.createElement('canvas');
  return typeof canvas.captureStream === 'function';
}

function cleanupSimulatedContext(context?: SimulatedStreamContext) {
  if (!context) return;
  cancelAnimationFrame(context.animationFrameId);
  context.sourceStream.getTracks().forEach((track) => track.stop());
  context.mirroredStream?.getTracks().forEach((track) => track.stop());
  context.senderPc.close();
  context.receiverPc.close();
}

async function createSimulatedLoopback(config: StreamConfig): Promise<SimulatedStreamContext> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx || typeof canvas.captureStream !== 'function') {
    throw new Error('Canvas capture is not supported');
  }

  const sourceStream = canvas.captureStream(30);
  const senderPc = new RTCPeerConnection();
  const receiverPc = new RTCPeerConnection();
  const baseTimestamp = performance.now();

  const context: SimulatedStreamContext = {
    canvas,
    animationFrameId: 0,
    senderPc,
    receiverPc,
    sourceStream,
    fps: 30,
    lastFrameTimestamp: baseTimestamp,
  };

  const draw = (time: number) => {
    const now = performance.now();
    const delta = now - context.lastFrameTimestamp;
    context.lastFrameTimestamp = now;
    if (delta > 0) {
      context.fps = Math.min(60, Number((1000 / delta).toFixed(1)));
    }

    const hueA = (config.paletteShift + time / 20) % 360;
    const hueB = (config.paletteShift + 160 + time / 30) % 360;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, `hsla(${hueA}, 70%, 55%, 0.85)`);
    gradient.addColorStop(1, `hsla(${hueB}, 70%, 45%, 0.8)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    for (let x = 0; x < canvas.width; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 120) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '28px "Inter", sans-serif';
    ctx.fillText(config.label, 32, 50);
    ctx.font = '22px "Inter", sans-serif';
    ctx.fillText(config.focusApp, 32, 90);

    context.animationFrameId = requestAnimationFrame(draw);
  };

  context.animationFrameId = requestAnimationFrame(draw);

  senderPc.onicecandidate = (event) => {
    if (event.candidate) {
      void receiverPc.addIceCandidate(event.candidate);
    }
  };
  receiverPc.onicecandidate = (event) => {
    if (event.candidate) {
      void senderPc.addIceCandidate(event.candidate);
    }
  };

  sourceStream.getTracks().forEach((track) => senderPc.addTrack(track, sourceStream));

  const offer = await senderPc.createOffer();
  await senderPc.setLocalDescription(offer);
  await receiverPc.setRemoteDescription(offer);
  const answer = await receiverPc.createAnswer();
  await receiverPc.setLocalDescription(answer);
  await senderPc.setRemoteDescription(answer);

  const mirroredStream = await new Promise<MediaStream>((resolve) => {
    let resolved = false;
    const timeout = window.setTimeout(() => {
      if (resolved) return;
      resolved = true;
      console.warn('[WebRTC] remote track timeout, falling back to source stream');
      resolve(sourceStream);
    }, 5000);

    receiverPc.ontrack = (event) => {
      if (resolved) return;
      resolved = true;
      window.clearTimeout(timeout);
      resolve(event.streams[0]);
    };
  });

  context.mirroredStream = mirroredStream;
  return context;
}

interface SummaryStatProps {
  icon: ReactNode;
  label: string;
  value: string;
}

function SummaryStat({ icon, label, value }: SummaryStatProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/30 bg-white/5 px-3 py-2 text-xs text-cloud">
      <span className="text-lg text-accent-sand">{icon}</span>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] uppercase tracking-wide text-cloud/70">{label}</span>
        <span className="text-sm font-semibold text-ink">{value}</span>
      </div>
    </div>
  );
}

interface WebRTCQuadWorkspaceProps {
  className?: string;
}

export function WebRTCQuadWorkspace({ className = '' }: WebRTCQuadWorkspaceProps) {
  const activeScreen = useDesktopStore((state) => state.activeQuadScreen);
  const setActiveScreen = useDesktopStore((state) => state.setActiveQuadScreen);

  const [streams, setStreams] = useState<StreamState[]>(() =>
    STREAM_CONFIGS.map((config) => ({
      ...config,
      status: 'idle',
      metrics: {
        bitrateKbps: 0,
        packetRate: 0,
        latencyMs: 0,
        cpuLoad: 0,
        fps: 0,
        jitter: 0,
      },
    }))
  );

  const videoRefs = useMemo<Record<QuadScreenId, RefObject<HTMLVideoElement>>>(() => ({
    topLeft: createRef<HTMLVideoElement>(),
    topRight: createRef<HTMLVideoElement>(),
    bottomLeft: createRef<HTMLVideoElement>(),
    bottomRight: createRef<HTMLVideoElement>(),
  }), []);

  const contextsRef = useRef<Record<QuadScreenId, SimulatedStreamContext | undefined>>({
    topLeft: undefined,
    topRight: undefined,
    bottomLeft: undefined,
    bottomRight: undefined,
  });

  const mountedRef = useRef(false);

  const safeSetStreams = useCallback((updater: (prev: StreamState[]) => StreamState[]) => {
    if (!mountedRef.current) return;
    setStreams(updater);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!canUseWebRTC()) {
      safeSetStreams((prev) =>
        prev.map((stream) => ({
          ...stream,
          status: 'unsupported',
        }))
      );
      return () => {
        mountedRef.current = false;
      };
    }

    let cancelled = false;

    const startStream = async (config: StreamConfig, index: number) => {
      safeSetStreams((prev) =>
        prev.map((stream) =>
          stream.id === config.id
            ? { ...stream, status: 'initializing' }
            : stream
        )
      );

      try {
        // 起動を段階的にして初期CPU負荷を緩和
        await new Promise((resolve) => setTimeout(resolve, index * 150));
        if (cancelled) return;
        const context = await createSimulatedLoopback(config);
        if (cancelled) {
          cleanupSimulatedContext(context);
          return;
        }

        contextsRef.current[config.id] = context;
        const videoElement = videoRefs[config.id].current;
        if (videoElement && context.mirroredStream) {
          videoElement.srcObject = context.mirroredStream;
          videoElement.muted = true;
          videoElement.playsInline = true;
          void videoElement.play().catch(() => undefined);
        }

        safeSetStreams((prev) =>
          prev.map((stream) =>
            stream.id === config.id
              ? { ...stream, status: 'live' }
              : stream
          )
        );
      } catch (error) {
        console.error('[WebRTC] stream error', config.id, error);
        safeSetStreams((prev) =>
          prev.map((stream) =>
            stream.id === config.id
              ? { ...stream, status: 'error' }
              : stream
          )
        );
      }
    };

    STREAM_CONFIGS.forEach((config, index) => {
      void startStream(config, index);
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
      Object.values(contextsRef.current).forEach((context) => cleanupSimulatedContext(context));
      (Object.values(videoRefs) as RefObject<HTMLVideoElement>[]).forEach((ref) => {
        if (ref.current) {
          ref.current.srcObject = null;
        }
      });
      contextsRef.current = {
        topLeft: undefined,
        topRight: undefined,
        bottomLeft: undefined,
        bottomRight: undefined,
      };
    };
  }, [safeSetStreams, videoRefs]);

  useEffect(() => {
    if (!canUseWebRTC()) return;

    const interval = window.setInterval(async () => {
      const updates: Record<QuadScreenId, Partial<StreamMetrics>> = {
        topLeft: {},
        topRight: {},
        bottomLeft: {},
        bottomRight: {},
      };

      await Promise.all(
        STREAM_CONFIGS.map(async (config) => {
          const context = contextsRef.current[config.id];
          if (!context) return;

          const sender = context.senderPc.getSenders()[0];
          if (!sender) return;
          const stats = await sender.getStats();

          let bitrateKbps = 0;
          let packetRate = 0;
          let latencyMs = 0;
          let jitter = 0;

          stats.forEach((report) => {
            if (report.type === 'outbound-rtp' && !report.isRemote) {
              const prevBytes = context.lastBytesSent ?? report.bytesSent;
              const prevTimestamp = context.lastStatsTimestamp ?? report.timestamp;
              const prevPackets = context.lastPacketsSent ?? report.packetsSent;
              const deltaTime = (report.timestamp - prevTimestamp) / 1000;
              if (deltaTime > 0) {
                bitrateKbps = ((report.bytesSent - prevBytes) * 8) / deltaTime / 1000;
                packetRate = (report.packetsSent - prevPackets) / deltaTime;
              }
              context.lastBytesSent = report.bytesSent;
              context.lastStatsTimestamp = report.timestamp;
              context.lastPacketsSent = report.packetsSent;
            }
            if (report.type === 'candidate-pair' && report.state === 'succeeded' && typeof report.currentRoundTripTime === 'number') {
              latencyMs = report.currentRoundTripTime * 1000;
            }
            if (report.type === 'outbound-rtp' && typeof report.jitter === 'number') {
              jitter = report.jitter * 1000;
            }
          });

          const fps = context.fps;
          const cpuLoad = Math.min(95, Math.max(12, Math.round((bitrateKbps / 2000) * 45 + (30 / Math.max(fps, 1)) * 30)));

          updates[config.id] = {
            bitrateKbps: Number(bitrateKbps.toFixed(0)),
            packetRate: Number(packetRate.toFixed(1)),
            latencyMs: Number(latencyMs.toFixed(1)),
            jitter: Number(jitter.toFixed(1)),
            cpuLoad,
            fps: Number(fps.toFixed(1)),
          };
        })
      );

      safeSetStreams((prev) =>
        prev.map((stream) => {
          const delta = updates[stream.id];
          if (!delta || Object.keys(delta).length === 0) {
            return stream;
          }
          return {
            ...stream,
            metrics: {
              ...stream.metrics,
              ...delta,
            },
          };
        })
      );
    }, 1200);

    return () => window.clearInterval(interval);
  }, [safeSetStreams]);

  const summary = useMemo(() => {
    const live = streams.filter((stream) => stream.status === 'live');
    if (!live.length) {
      return { totalBitrate: 0, avgLatency: 0, avgCpu: 0 };
    }
    const totalBitrate = live.reduce((sum, stream) => sum + stream.metrics.bitrateKbps, 0);
    const avgLatency = live.reduce((sum, stream) => sum + stream.metrics.latencyMs, 0) / live.length;
    const avgCpu = live.reduce((sum, stream) => sum + stream.metrics.cpuLoad, 0) / live.length;
    return {
      totalBitrate,
      avgLatency,
      avgCpu,
    };
  }, [streams]);

  return (
    <section className={`flex h-full w-full flex-col gap-4 ${className}`}>
      <header className="flex flex-wrap items-center gap-4 rounded-3xl border border-white/30 bg-white/5 px-6 py-4 shadow-panel">
        <div>
          <p className="text-xs uppercase tracking-wide text-cloud/70">SFU Load Monitor</p>
          <p className="text-lg font-semibold text-ink">WebRTC 4面 PoC</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SummaryStat icon={<RiSignalTowerLine className="h-4 w-4" />} label="合計ビットレート" value={`${summary.totalBitrate.toFixed(0)} kbps`} />
          <SummaryStat icon={<RiSpeedLine className="h-4 w-4" />} label="平均レイテンシ" value={`${summary.avgLatency.toFixed(1)} ms`} />
          <SummaryStat icon={<RiCpuLine className="h-4 w-4" />} label="平均CPU" value={`${summary.avgCpu.toFixed(0)} %`} />
        </div>
        <div className="ml-auto flex items-center gap-2 rounded-full border border-white/30 px-3 py-1.5 text-xs text-cloud/80">
          <RiPulseLine className="h-4 w-4 text-accent-sand" />
          <span>Focus: {QUAD_SCREEN_LABELS[activeScreen]}</span>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        {streams.map((stream) => {
          const videoRef = videoRefs[stream.id];
          const isActive = stream.id === activeScreen;
          const statusTheme = getStatusStyles(stream.status);
          return (
            <div
              key={stream.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveScreen(stream.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setActiveScreen(stream.id);
                }
              }}
              className={`relative flex min-h-[280px] flex-col overflow-hidden rounded-3xl border border-white/30 bg-gray-950/40 text-white shadow-soft transition-all duration-200 ${
                isActive ? 'ring-2 ring-emerald-400/70 shadow-panel' : 'ring-0'
              }`}
            >
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover opacity-70"
                muted
                playsInline
                autoPlay
              />
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900/20 via-gray-900/50 to-gray-950/80" aria-hidden />

              <div className="relative z-10 flex h-full flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-white/70">{stream.label}</p>
                    <p className="text-lg font-semibold text-white">{stream.focusApp}</p>
                    <p className="text-xs text-white/60">{stream.description}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusTheme}`}>
                    {formatStatus(stream.status)}
                  </span>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3 text-xs text-white/80">
                  <MetricBadge label="Bitrate" value={`${stream.metrics.bitrateKbps} kbps`} icon={<RiSignalTowerLine className="h-4 w-4" />} />
                  <MetricBadge label="Packets/s" value={stream.metrics.packetRate.toFixed(1)} icon={<RiRadarLine className="h-4 w-4" />} />
                  <MetricBadge label="Latency" value={`${stream.metrics.latencyMs.toFixed(1)} ms`} icon={<RiSpeedLine className="h-4 w-4" />} />
                  <MetricBadge label="Jitter" value={`${stream.metrics.jitter.toFixed(1)} ms`} icon={<RiPulseLine className="h-4 w-4" />} />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>CPU負荷</span>
                    <span className="font-semibold text-white">{stream.metrics.cpuLoad}% / {stream.metrics.fps} fps</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                      style={{ width: `${Math.min(stream.metrics.cpuLoad, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function formatStatus(status: StreamStatus) {
  switch (status) {
    case 'live':
      return 'LIVE';
    case 'initializing':
      return '起動中';
    case 'error':
      return 'Error';
    case 'unsupported':
      return 'Unsupported';
    default:
      return 'Idle';
  }
}

function getStatusStyles(status: StreamStatus) {
  switch (status) {
    case 'live':
      return 'border-emerald-400/60 bg-emerald-400/20 text-emerald-50';
    case 'initializing':
      return 'border-amber-300/60 bg-amber-300/10 text-amber-50';
    case 'error':
      return 'border-rose-400/60 bg-rose-400/10 text-rose-100';
    case 'unsupported':
      return 'border-gray-400/60 bg-gray-500/20 text-gray-100';
    default:
      return 'border-white/40 bg-white/20 text-white';
  }
}

interface MetricBadgeProps {
  label: string;
  value: string;
  icon: ReactNode;
}

function MetricBadge({ label, value, icon }: MetricBadgeProps) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-black/30 px-3 py-2">
      <span className="text-accent-sand">{icon}</span>
      <div className="flex flex-col text-[11px] text-white/70">
        <span className="uppercase tracking-wide">{label}</span>
        <span className="text-sm font-semibold text-white">{value}</span>
      </div>
    </div>
  );
}
