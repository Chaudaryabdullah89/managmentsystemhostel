import { NextRequest, NextResponse } from 'next/server';

const raterLimitMap = new Map();

/**
 * Simple in-memory rate limiter based on sliding window.
 * @param {NextRequest} req
 * @param {number} limit Max requests per window
 * @param {number} windowMs Window duration in milliseconds
 */
export function rateLimiter(req, limit = 5, windowMs = 60 * 1000) {
    const ip = req.headers.get('x-forwarded-for') || req.ip || 'unknown_ip';

    // Default to a generous limit if IP isn't resolved properly (often happens in dev environments)
    if (ip === 'unknown_ip') return { success: true };

    const now = Date.now();

    if (!raterLimitMap.has(ip)) {
        raterLimitMap.set(ip, []);
    }

    const timestamps = raterLimitMap.get(ip);

    // Filter out timestamps older than the window
    const windowStart = now - windowMs;
    const validTimestamps = timestamps.filter(time => time > windowStart);

    if (validTimestamps.length >= limit) {
        // Too many requests
        return { success: false, error: 'Too many requests, please try again later.', status: 429 };
    }

    validTimestamps.push(now);
    raterLimitMap.set(ip, validTimestamps);

    return { success: true };
}
