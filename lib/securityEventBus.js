// lib/securityEventBus.js
// Global in-memory event bus for real-time IDS streaming via SSE.
// Persists across requests in a single Node.js process.

import { EventEmitter } from "events";

// Singleton — attach to globalThis to survive hot reloads in dev
if (!globalThis.__securityEventBus) {
    globalThis.__securityEventBus = new EventEmitter();
    globalThis.__securityEventBus.setMaxListeners(50); // support up to 50 concurrent admin tabs
}

export const securityEventBus = globalThis.__securityEventBus;

/** Broadcast a security event to all connected SSE clients */
export function broadcastSecurityEvent(payload) {
    securityEventBus.emit("ids:event", payload);
}
