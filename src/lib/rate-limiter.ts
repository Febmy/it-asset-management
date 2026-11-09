import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from './env';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>;
  set(key: string, entry: RateLimitEntry): Promise<void>;
  increment(key: string): Promise<void>;
  delete(key: string): Promise<void>;
  cleanup(): Promise<void>;
  close(): Promise<void>;
}

class InMemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    // Prevent the interval from keeping the process alive
    this.cleanupInterval.unref?.();
  }

  async get(key: string): Promise<RateLimitEntry | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.resetTime) {
      this.store.delete(key);
      return null;
    }
    return entry;
  }

  async set(key: string, entry: RateLimitEntry): Promise<void> {
    this.store.set(key, entry);
  }

  async increment(key: string): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.count++;
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

let redisStoreInstance: RateLimitStore | null = null;

async function createRedisStore(): Promise<RateLimitStore | null> {
  const env = getEnv();
  if (!env.REDIS_URL) return null;

  try {
    // Dynamic import to avoid requiring ioredis if not installed
    const RedisModule = await import('ioredis');
    const Redis = RedisModule.default;
    const redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
      lazyConnect: true,
    });

    await redis.connect();

    return {
      async get(key: string) {
        const data = await redis.get(key);
        if (!data) return null;
        const entry = JSON.parse(data) as RateLimitEntry;
        if (Date.now() > entry.resetTime) {
          await redis.del(key);
          return null;
        }
        return entry;
      },

      async set(key: string, entry: RateLimitEntry) {
        const ttl = Math.ceil((entry.resetTime - Date.now()) / 1000);
        if (ttl > 0) {
          await redis.set(key, JSON.stringify(entry), 'EX', ttl);
        }
      },

      async increment(key: string) {
        const data = await redis.get(key);
        if (data) {
          const entry = JSON.parse(data) as RateLimitEntry;
          entry.count++;
          const ttl = Math.ceil((entry.resetTime - Date.now()) / 1000);
          if (ttl > 0) {
            await redis.set(key, JSON.stringify(entry), 'EX', ttl);
          }
        }
      },

      async delete(key: string) {
        await redis.del(key);
      },

      async cleanup() {
        // Redis handles TTL automatically, but we can scan for expired keys if needed
        // For now, rely on Redis TTL expiration
      },

      async close() {
        await redis.quit();
      },
    };
  } catch (error) {
    console.warn('Failed to initialize Redis store, falling back to in-memory:', error);
    return null;
  }
}

let storeInstance: RateLimitStore | null = null;

async function getStore(): Promise<RateLimitStore> {
  if (storeInstance) return storeInstance;

  // Try Redis first if configured
  const redisStore = await createRedisStore();
  if (redisStore) {
    storeInstance = redisStore;
    console.log('Rate limiter: Using Redis store');
    return storeInstance;
  }

  // Fallback to in-memory store
  storeInstance = new InMemoryStore();
  console.log('Rate limiter: Using in-memory store');
  return storeInstance;
}

function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

export async function createRateLimiter(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyPrefix } = config;
  const store = await getStore();

  return async function rateLimit(request: NextRequest): Promise<NextResponse | null> {
    const key = `${keyPrefix}:${getClientIdentifier(request)}`;
    const now = Date.now();

    const entry = await store.get(key);

    if (!entry || now > entry.resetTime) {
      await store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return null;
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return NextResponse.json(
        {
          success: false,
          message: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(maxRequests),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
          },
        }
      );
    }

    await store.increment(key);
    return null;
  };
}

// For backward compatibility, create synchronous versions that use in-memory store
// These are initialized lazily
let loginRateLimiterPromise: Promise<(request: NextRequest) => Promise<NextResponse | null>> | null = null;
let meRateLimiterPromise: Promise<(request: NextRequest) => Promise<NextResponse | null>> | null = null;

async function getLoginRateLimiter() {
  if (!loginRateLimiterPromise) {
    loginRateLimiterPromise = createRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts per 15 minutes
      keyPrefix: 'auth:login',
    });
  }
  return loginRateLimiterPromise;
}

async function getMeRateLimiter() {
  if (!meRateLimiterPromise) {
    meRateLimiterPromise = createRateLimiter({
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 requests per minute
      keyPrefix: 'auth:me',
    });
  }
  return meRateLimiterPromise;
}

// Export async functions that return the rate limiter
export async function loginRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const limiter = await getLoginRateLimiter();
  return limiter(request);
}

export async function meRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const limiter = await getMeRateLimiter();
  return limiter(request);
}

// Export store for potential manual cleanup (e.g., in tests)
export async function closeRateLimiterStore(): Promise<void> {
  if (storeInstance) {
    await storeInstance.close();
    storeInstance = null;
    loginRateLimiterPromise = null;
    meRateLimiterPromise = null;
  }
}