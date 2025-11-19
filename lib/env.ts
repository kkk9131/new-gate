import { z } from 'zod';

export const DEFAULT_SANDBOX_RATE_LIMIT = 120;
export const DEFAULT_SANDBOX_RATE_LIMIT_WINDOW = '60 s';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    SANDBOX_RATE_LIMIT: z.coerce.number().int().positive().default(DEFAULT_SANDBOX_RATE_LIMIT),
    SANDBOX_RATE_LIMIT_WINDOW: z.string().default(DEFAULT_SANDBOX_RATE_LIMIT_WINDOW),
  })
  .superRefine((data, ctx) => {
    const hasRedisUrl = Boolean(data.UPSTASH_REDIS_REST_URL);
    const hasRedisToken = Boolean(data.UPSTASH_REDIS_REST_TOKEN);

    if (hasRedisUrl !== hasRedisToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'UPSTASH_REDIS_REST_URL と UPSTASH_REDIS_REST_TOKEN はセットで設定してください',
        path: ['UPSTASH_REDIS_REST_URL'],
      });
    }
  });

const parsed = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  SANDBOX_RATE_LIMIT: process.env.SANDBOX_RATE_LIMIT,
  SANDBOX_RATE_LIMIT_WINDOW: process.env.SANDBOX_RATE_LIMIT_WINDOW,
});

export const env = parsed;

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
