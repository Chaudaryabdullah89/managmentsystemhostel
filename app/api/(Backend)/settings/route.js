import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/checkRole";
import { DEFAULT_SETTINGS } from "@/lib/permissions";

export async function GET() {
    // Require authentication — system settings reveal feature flags that shouldn't be public
    const auth = await checkRole([]);
    if (!auth.success) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
        return NextResponse.json({
            success: true,
            settings: settings ? { ...DEFAULT_SETTINGS, ...settings } : DEFAULT_SETTINGS,
        });
    } catch (error) {
        console.error("GET /api/settings error:", error);
        return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
    }
}

export async function PUT(req) {
    const auth = await checkRole(["ADMIN"]);
    if (!auth.success) {
        return NextResponse.json({ success: false, message: "Forbidden: Admin access required." }, { status: 403 });
    }

    try {
        const body = await req.json();

        // Whitelist only known settings keys (prevents mass-assignment)
        const allowed = Object.keys(DEFAULT_SETTINGS);
        const data = {};
        for (const key of allowed) {
            if (key in body) {
                data[key] = body[key];
            }
        }

        if (Object.keys(data).length === 0) {
            return NextResponse.json({ success: false, message: "No valid settings fields provided." }, { status: 400 });
        }

        const settings = await prisma.systemSettings.upsert({
            where: { id: "global" },
            update: data,
            create: { id: "global", ...DEFAULT_SETTINGS, ...data },
        });

        return NextResponse.json({ success: true, settings });
    } catch (error) {
        console.error("PUT /api/settings error:", error);
        return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
    }
}
