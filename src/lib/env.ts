import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default(''),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('it_assets'),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CRON_SECRET_TOKEN: z.string().min(1, 'CRON_SECRET_TOKEN is required'),

  // Optional: Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  // Optional: Microsoft 365 SSO
  AZURE_AD_CLIENT_ID: z.string().optional(),
  AZURE_AD_CLIENT_SECRET: z.string().optional(),
  AZURE_AD_TENANT_ID: z.string().optional(),

  // Optional: Redis for rate limiting
  REDIS_URL: z.string().url().optional(),

  // Optional: App config
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export function getEnv(): Env {
  if (cachedEnv) return cachedEnv;

  // During Next.js build phase, skip validation and return defaults
  // Actual validation happens at runtime when the app starts
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    cachedEnv = envSchema.parse({
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/it_assets',
      DB_USER: process.env.DB_USER || 'postgres',
      DB_PASSWORD: process.env.DB_PASSWORD || '',
      DB_HOST: process.env.DB_HOST || 'localhost',
      DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432,
      DB_NAME: process.env.DB_NAME || 'it_assets',
      JWT_SECRET: process.env.JWT_SECRET || 'build-time-placeholder-secret-min-32-chars',
      CRON_SECRET_TOKEN: process.env.CRON_SECRET_TOKEN || 'build-time-placeholder-cron-secret',
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
      TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID,
      AZURE_AD_CLIENT_ID: process.env.AZURE_AD_CLIENT_ID,
      AZURE_AD_CLIENT_SECRET: process.env.AZURE_AD_CLIENT_SECRET,
      AZURE_AD_TENANT_ID: process.env.AZURE_AD_TENANT_ID,
      REDIS_URL: process.env.REDIS_URL,
      PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
      NODE_ENV: process.env.NODE_ENV || 'production',
    });
    return cachedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  cachedEnv = result.data;
  return cachedEnv;
}

// Validate on import in production (but not during build)
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE !== 'phase-production-build') {
  getEnv();
}