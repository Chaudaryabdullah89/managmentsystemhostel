const cacheStore = globalThis.__routeCacheStore || new Map();
globalThis.__routeCacheStore = cacheStore;

export async function getOrSetRouteCache(cacheKey, ttlMs, resolver) {
    const now = Date.now();
    const existing = cacheStore.get(cacheKey);
    if (existing && existing.expiresAt > now) {
        return existing.value;
    }

    const value = await resolver();
    cacheStore.set(cacheKey, {
        value,
        expiresAt: now + ttlMs,
    });
    return value;
}
