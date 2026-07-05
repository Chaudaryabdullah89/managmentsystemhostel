// app/api/(Backend)/admin/security/stream/route.js
// Server-Sent Events (SSE) endpoint for real-time IDS monitoring.
// Admin dashboard connects here; server pushes events as they happen.

import { NextResponse } from "next/server";
import { requireRoles } from "@/lib/apiAuth";
import { securityEventBus } from "@/lib/securityEventBus";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // Required for EventEmitter (not edge)

export async function GET(request) {
    const guard = await requireRoles(["ADMIN"]);
    if (!guard.ok) return guard.response;

    const encoder = new TextEncoder();

    // Build a ReadableStream that pushes SSE events
    const stream = new ReadableStream({
        start(controller) {
            const clientIp = request.headers.get("x-forwarded-for") || "0.0.0.0";
            console.log(`\x1b[35m[IDS SSE]\x1b[0m Admin client connected: ${clientIp}`);

            // Helper: send an SSE message
            const send = (event, data) => {
                try {
                    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
                    controller.enqueue(encoder.encode(payload));
                } catch (_) {
                    // Client disconnected — cleanup happens below
                }
            };

            // Send immediate welcome ping so the client knows it is connected
            send("connected", { message: "IDS Live Stream connected", ts: new Date().toISOString() });

            // Forward every threat event to this client
            const onEvent = (payload) => send("ids:event", payload);
            securityEventBus.on("ids:event", onEvent);

            // Heartbeat every 20s to keep the connection alive through proxies
            const heartbeat = setInterval(() => {
                send("heartbeat", { ts: new Date().toISOString() });
            }, 20_000);

            // Cleanup when the client disconnects
            request.signal.addEventListener("abort", () => {
                console.log(`\x1b[35m[IDS SSE]\x1b[0m Admin client disconnected: ${clientIp}`);
                securityEventBus.off("ids:event", onEvent);
                clearInterval(heartbeat);
                try { controller.close(); } catch (_) {}
            });
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type":  "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection":    "keep-alive",
            "X-Accel-Buffering": "no", // Disable Nginx buffering for SSE
        }
    });
}
