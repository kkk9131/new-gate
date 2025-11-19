import { Ratelimit, type RateLimitResponse } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env, isProduction } from './env';

const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : undefined;

if (!redis) {
  const message = '[RateLimit] Upstash Redis が未設定のため、Sandbox API のレート制限は無効化されています。';
  if (!isProduction) {
    console.warn(message);
  } else {
    console.error(message);
  }
}

const sandboxLimiter = redis
  ? new Ratelimit({
      redis,
      analytics: true,
      prefix: 'ratelimit:sandbox',
      limiter: Ratelimit.slidingWindow(env.SANDBOX_RATE_LIMIT, env.SANDBOX_RATE_LIMIT_WINDOW),
    })
  : null;

export async function limitSandboxRequest(identifier: string): Promise<RateLimitResponse | null> {
  if (!sandboxLimiter) return null;
  return sandboxLimiter.limit(identifier);
}

export function buildRateLimitHeaders(result: RateLimitResponse | null) {
  if (!result) return {} as Record<string, string>;

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.reset.toString(),
  };

  if (!result.success) {
    const retryAfterSeconds = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
    headers['Retry-After'] = retryAfterSeconds.toString();
  }

  return headers;
}
