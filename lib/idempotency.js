const idempotencyStore = globalThis.__idempotencyStore || new Map();
globalThis.__idempotencyStore = idempotencyStore;

function buildKey(scope, userId, requestKey) {
    if (!requestKey) return null;
    return `${scope}:${userId || "anonymous"}:${requestKey}`;
}

export async function withIdempotency({ scope, userId, requestKey, ttlMs = 5 * 60 * 1000, action }) {
    const key = buildKey(scope, userId, requestKey);
    const now = Date.now();

    if (!key) {
        const result = await action();
        return { replayed: false, result };
    }

    const cached = idempotencyStore.get(key);
    if (cached && cached.expiresAt > now) {
        return { replayed: true, result: cached.result };
    }

    const result = await action();
    idempotencyStore.set(key, {
        result,
        expiresAt: now + ttlMs,
    });
    return { replayed: false, result };
}
