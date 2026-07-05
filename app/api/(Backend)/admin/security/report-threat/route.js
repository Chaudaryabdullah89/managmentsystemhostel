// app/api/(Backend)/admin/security/report-threat/route.js
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import securityServices from "@/lib/services/securityServices";

export const dynamic = "force-dynamic";

export async function POST(request) {
    try {
        const { ip, event, severity, description, userAgent } = await request.json();

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
