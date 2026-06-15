/**
 * Redis client — lazy-initialized.
 *
 * The client is created on FIRST USE, not at import time.
 * This prevents connection errors during Next.js build / static page generation,
 * where no Redis server is available.
 *
 * If REDIS_URL is not set, all cache operations are silently skipped (no-op).
 */

let _redis: import("ioredis").default | null = null;
let _isAvailable = false;
let _initialized = false;

export function getRedisClient(): import("ioredis").default | null {
  // Already attempted init — return cached result
  if (_initialized) return _redis;
  _initialized = true;

  const redisUrl = process.env.REDIS_URL;

  // No URL configured → skip Redis entirely (safe for build / local dev)
  if (!redisUrl) {
    return null;
  }

  try {
    const { default: Redis } = require("ioredis") as { default: typeof import("ioredis").default };

    _redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 2000,
      lazyConnect: true, // Don't connect until first command is issued
      retryStrategy(times) {
        if (times > 3) return null; // Give up after 3 retries to avoid infinite loops
        return Math.min(times * 200, 2000);
      },
    });

    _redis!.on("connect", () => {
      _isAvailable = true;
      console.log("Redis connected successfully.");
    });

    _redis!.on("error", (error) => {
      _isAvailable = false;
      console.error("Redis error:", error.message || error);
    });

    _redis!.on("close", () => {
      _isAvailable = false;
    });

  } catch (err) {
    console.error("Failed to initialize Redis client:", err);
    _redis = null;
    _isAvailable = false;
  }

  return _redis;
}

/**
 * Checks if Redis is currently connected and active.
 */
export function checkRedisStatus(): boolean {
  const client = getRedisClient();
  return _isAvailable && client !== null;
}

/**
 * Fetch parsed JSON from Redis cache.
 * Falls back to null if Redis is unavailable.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  if (!client) return null;
  try {
    // Ensure connected (lazyConnect mode)
    if (!_isAvailable) await client.connect().catch(() => {});
    if (!_isAvailable) return null;
    const cached = await client.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch (err) {
    console.error(`Redis getCache failed for key ${key}:`, err);
    return null;
  }
}

/**
 * Set value in Redis cache with TTL.
 * Fails silently if Redis is unavailable.
 */
export async function setCache(
  key: string,
  value: any,
  ttlSeconds: number = 300
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;
  try {
    if (!_isAvailable) await client.connect().catch(() => {});
    if (!_isAvailable) return;
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    console.error(`Redis setCache failed for key ${key}:`, err);
  }
}

/**
 * Delete specific keys (non-blocking unlink).
 */
export async function invalidateKeys(keys: string | string[]): Promise<void> {
  const client = getRedisClient();
  if (!client || !_isAvailable) return;
  try {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    if (keysArray.length > 0) await client.unlink(keysArray);
  } catch (err) {
    console.error(`Redis invalidateKeys failed:`, err);
  }
}

/**
 * Delete all keys matching a glob pattern using SCAN (non-blocking).
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  const client = getRedisClient();
  if (!client || !_isAvailable) return;

  return new Promise<void>((resolve) => {
    const stream = (client as any).scanStream({ match: pattern, count: 100 });

    stream.on("data", async (keys: string[]) => {
      if (keys.length > 0 && _isAvailable) {
        try {
          await client.unlink(keys);
        } catch (unlinkErr) {
          console.error("Failed to unlink scanned keys:", unlinkErr);
        }
      }
    });

    stream.on("end", resolve);

    stream.on("error", (err: Error) => {
      console.error(`Redis SCAN stream error for pattern ${pattern}:`, err);
      resolve();
    });
  });
}

export default { getRedisClient, checkRedisStatus, getCache, setCache, invalidateKeys, invalidatePattern };
