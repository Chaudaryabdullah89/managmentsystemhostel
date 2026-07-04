export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS } from "@/lib/permissions";
import { requireAuth, requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { revalidateTag } from "next/cache";

export async function GET() {
    // Require authentication — system settings reveal feature flags that shouldn't be public
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const settings = await prisma.systemSettings.findUnique({ where: { id: "global" } });
        const mergedSettings = settings ? { ...DEFAULT_SETTINGS, ...settings } : { ...DEFAULT_SETTINGS };

        // Fallback SMTP fields to environment variables if not defined in the database
        if (!mergedSettings.smtpHost) mergedSettings.smtpHost = process.env.EMAIL_HOST || "smtp.gmail.com";
        if (!mergedSettings.smtpPort) mergedSettings.smtpPort = Number(process.env.EMAIL_PORT) || 587;
        if (mergedSettings.smtpSecure === null || mergedSettings.smtpSecure === undefined) {
            mergedSettings.smtpSecure = process.env.EMAIL_SECURE === "true";
        }
        if (!mergedSettings.smtpUser) mergedSettings.smtpUser = process.env.EMAIL_USER || "";
        if (!mergedSettings.smtpPass) mergedSettings.smtpPass = process.env.EMAIL_PASS || "";
        if (!mergedSettings.smtpSender) mergedSettings.smtpSender = process.env.EMAIL_USER || "";

        // Dynamically generate and persist maintenance bypass tokens if missing
        let tokenUpdateNeeded = false;
        let wardenToken = mergedSettings.maintenanceWardenToken;
        let guestToken = mergedSettings.maintenanceGuestToken;

        if (!wardenToken) {
            wardenToken = "wd-" + Math.random().toString(36).substring(2, 10);
            mergedSettings.maintenanceWardenToken = wardenToken;
            tokenUpdateNeeded = true;
        }
        if (!guestToken) {
            guestToken = "gst-" + Math.random().toString(36).substring(2, 10);
            mergedSettings.maintenanceGuestToken = guestToken;
            tokenUpdateNeeded = true;
        }

        if (tokenUpdateNeeded) {
            try {
                await prisma.systemSettings.upsert({
                    where: { id: "global" },
                    update: {
                        maintenanceWardenToken: wardenToken,
                        maintenanceGuestToken: guestToken,
                    },
                    create: {
                        id: "global",
                        ...DEFAULT_SETTINGS,
                        maintenanceWardenToken: wardenToken,
                        maintenanceGuestToken: guestToken,
                    }
                });
            } catch (err) {
                console.warn("[Settings API] Failed to auto-persist bypass tokens:", err.message);
            }
        }

        return successResponse({
            settings: mergedSettings,
        });
    } catch (error) {
        console.error("GET /api/settings error:", error);
        return errorResponse("Server Error", 500);
    }
}

export async function PUT(req) {
    const guard = await requireRoles(["ADMIN"]);
    if (!guard.ok) return guard.response;

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
            return errorResponse("No valid settings fields provided.", 400);
        }

        // Validate and normalize AI Settings
        if ('aiTemperature' in data) {
            data.aiTemperature = Math.max(0, Math.min(1, parseFloat(data.aiTemperature) ?? 0.5));
        }
        if ('aiModel' in data) {
            const allowedModels = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemini-2.0-flash"];
            if (!allowedModels.includes(data.aiModel)) {
                data.aiModel = "llama-3.3-70b-versatile";
            }
        }

        // Validate and normalize SMTP settings
        if ('smtpPort' in data) {
            data.smtpPort = data.smtpPort !== null && data.smtpPort !== "" ? Number(data.smtpPort) : null;
        }
        if ('smtpSecure' in data) {
            data.smtpSecure = data.smtpSecure === true || data.smtpSecure === "true";
        }

        const settings = await prisma.systemSettings.upsert({
            where: { id: "global" },
            update: data,
            create: { id: "global", ...DEFAULT_SETTINGS, ...data },
        });

        // Invalidate settings cache so changes take effect immediately
        revalidateTag("settings");

        return successResponse({ settings });
    } catch (error) {
        console.error("PUT /api/settings error:", error);
        return errorResponse("Server Error", 500);
    }
}
