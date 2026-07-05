// app/api/(Backend)/admin/security/check-ip/route.js
import { NextResponse } from "next/server";
import securityServices from "@/lib/services/securityServices";

export const dynamic = "force-dynamic";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const ip = searchParams.get("ip");

        if (!ip) {
            return NextResponse.json({ blocked: false, error: "IP query parameter is required" }, { status: 400 });
        }

        const check = await securityServices.isIpBlocked(ip);
        return NextResponse.json(check);
    } catch (err) {
        console.error("IP Block verification error:", err.message);
        return NextResponse.json({ blocked: false, error: err.message }, { status: 500 });
    }
}
