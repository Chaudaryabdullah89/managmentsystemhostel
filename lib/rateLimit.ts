/**
 * Rate Limiter — Redis-backed with in-memory fallback.
 *
 * Primary:  Redis INCR + EXPIRE (shared across all serverless instances / survives cold starts)
 * Fallback: In-memory sliding-window Map (used when Redis is unavailable, e.g. local dev)
 *
 * Usage:
 *   const result = await rateLimiter(request, 3, 5 * 60 * 1000); // 3 req / 5 min
 *   if (!result.success) return NextResponse.json({ error: result.error }, { status: result.status });
 */

import type { NextRequest } from 'next/server';
import { checkRedisStatus, getRedisClient } from '@/lib/redis';

async function getRedis() {
    return getRedisClient();
}

// ── In-memory fallback ────────────────────────────────────────────────────────
const memoryStore = new Map<string, number[]>();

function memoryRateLimit(ip: string, limit: number, windowMs: number): RateLimitResult {
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (memoryStore.get(ip) || []).filter(t => t > windowStart);

    if (timestamps.length >= limit) {
        return { success: false, error: 'Too many requests, please try again later.', status: 429 };
    }

    timestamps.push(now);
    memoryStore.set(ip, timestamps);
    return { success: true };
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface RateLimitResult {
    success: boolean;
    error?: string;
    status?: number;
}

// ── Main export ───────────────────────────────────────────────────────────────
/**
 * Rate-limit by IP address.
 * @param req      NextRequest object
 * @param limit    Max allowed requests per window (default: 5)
 * @param windowMs Window duration in milliseconds (default: 60_000 = 1 minute)
 */
export async function rateLimiter(req: NextRequest, limit = 5, windowMs = 60_000): Promise<RateLimitResult> {
    // Resolve IP — prefer leftmost value in x-forwarded-for (closest to client)
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : (req as any).ip || 'unknown';

    // Skip rate limiting when IP cannot be determined (e.g. local dev without proxy)
    if (!ip || ip === 'unknown') return { success: true };

    const windowSeconds = Math.ceil(windowMs / 1000);
    const redisKey = `rl:${ip}:${limit}:${windowSeconds}`;

    // ── Redis path ─────────────────────────────────────────────────────────────
    if (checkRedisStatus()) {
        try {
            const redis = await getRedis();
            if (redis) {
                const current = await redis.incr(redisKey);

                // Set expiry only on first request in the window
                if (current === 1) {
                    await redis.expire(redisKey, windowSeconds);
                }

                if (current > limit) {
                    return { success: false, error: 'Too many requests, please try again later.', status: 429 };
                }

                return { success: true };
            }
        } catch (err) {
            console.warn('[rateLimit] Redis error, falling back to memory:', (err as Error).message);
        }
    }

    // ── In-memory fallback ─────────────────────────────────────────────────────
    return memoryRateLimit(ip, limit, windowMs);
}

/**
 * @deprecated Use the async `rateLimiter` instead.
 * Kept for backward-compat with routes that call the old synchronous API.
 * Falls back to in-memory only (no Redis) — plan to migrate call sites.
 */
export function rateLimiterSync(req: NextRequest, limit = 5, windowMs = 60_000): RateLimitResult {
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : (req as any).ip || 'unknown';
    if (!ip || ip === 'unknown') return { success: true };
    return memoryRateLimit(ip, limit, windowMs);
}
