// app/api/(Backend)/admin/security/report-threat/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import securityServices from "@/lib/services/securityServices";

export const dynamic = "force-dynamic";

export async function POST(request) {
    try {
        const body = await request.json();
        const { event, severity, description, userAgent } = body;

        // This endpoint is intentionally unauthenticated so the edge middleware can
        // self-report threats it detects on anonymous traffic. That also makes it
        // reachable by anyone on the internet, so we must NOT blindly trust a
        // caller-supplied `ip` field — otherwise `{ ip: "<victim-ip>", severity: "CRITICAL" }`
        // would get an arbitrary IP auto-blocked (a trivial DoS against, e.g., another admin).
        //
        // Only the middleware knows INTERNAL_API_SECRET, so only its call is allowed to
        // report on behalf of a different IP than the one making this request. Every other
        // caller can only ever report/block the IP it is actually making this request from.
        const internalSecret = process.env.INTERNAL_API_SECRET;
        const providedSecret = request.headers.get("x-internal-secret");
        const isTrustedInternalCall = Boolean(internalSecret) && providedSecret === internalSecret;

        const requestIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
            || request.headers.get("x-real-ip")
            || "0.0.0.0";

        const ip = isTrustedInternalCall && body.ip ? body.ip : requestIp;

        if (!ip) {
            return NextResponse.json({ success: false, message: "IP is required" }, { status: 400 });
        }

        // Record threat log and automatically block if severity is HIGH/CRITICAL
        const log = await securityServices.logIncident({
            ip,
            event,
            severity,
            description,
            userAgent
        });

        return NextResponse.json({ success: true, log });
    } catch (err) {
        console.error("Threat report logging error:", err.message);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
