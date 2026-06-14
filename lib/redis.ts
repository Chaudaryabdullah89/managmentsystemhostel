import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";

let redis: Redis | null = null;
let isRedisAvailable = false;

try {
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    reconnectOnError: () => true,
    // Avoid crashing on startup if Redis is down
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });

  redis.on("connect", () => {
    isRedisAvailable = true;
    console.log("Redis connected successfully.");
  });

  redis.on("error", (error) => {
    isRedisAvailable = false;
    console.error("Redis error:", error.message || error);
  });
} catch (err) {
  console.error("Failed to initialize Redis client:", err);
  redis = null;
  isRedisAvailable = false;
}

/**
 * Checks if Redis is currently connected and active.
 */
export function checkRedisStatus(): boolean {
  return isRedisAvailable && redis !== null;
}

/**
 * Fetch parsed JSON from Redis cache.
 * Falls back to null on any Redis failures.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis || !isRedisAvailable) return null;
  try {
    const cached = await redis.get(key);
    if (!cached) return null;
    return JSON.parse(cached) as T;
  } catch (err) {
    console.error(`Redis getCache failed for key ${key}:`, err);
    return null;
  }
}

/**
 * Set value in Redis cache with string serialization and TTL.
 * Fails silently on Redis errors to prevent breaking caller requests.
 */
export async function setCache(
  key: string,
  value: any,
  ttlSeconds: number = 300
): Promise<void> {
  if (!redis || !isRedisAvailable) return;
  try {
    const serialized = JSON.stringify(value);
    await redis.set(key, serialized, "EX", ttlSeconds);
  } catch (err) {
    console.error(`Redis setCache failed for key ${key}:`, err);
  }
}

/**
 * Delete a specific key or list of keys.
 */
export async function invalidateKeys(keys: string | string[]): Promise<void> {
  if (!redis || !isRedisAvailable) return;
  try {
    const keysArray = Array.isArray(keys) ? keys : [keys];
    if (keysArray.length > 0) {
      await redis.unlink(keysArray); // unlink is a non-blocking delete
    }
  } catch (err) {
    console.error(`Redis invalidateKeys failed:`, err);
  }
}

/**
 * Safely search and delete keys matching a pattern using SCAN to avoid blocking the event loop.
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  if (!redis || !isRedisAvailable) return;
  return new Promise<void>((resolve) => {
    if (!redis) return resolve();
    const stream = redis.scanStream({
      match: pattern,
      count: 100,
    });

    stream.on("data", async (keys: string[]) => {
      if (keys.length > 0 && redis && isRedisAvailable) {
        try {
          await redis.unlink(keys);
        } catch (unlinkErr) {
          console.error("Failed to unlink scanned keys:", unlinkErr);
        }
      }
    });

    stream.on("end", () => {
      resolve();
    });

    stream.on("error", (err) => {
      console.error(`Redis SCAN stream error for pattern ${pattern}:`, err);
      resolve(); // resolve to prevent crashing
    });
  });
}

export default redis;
