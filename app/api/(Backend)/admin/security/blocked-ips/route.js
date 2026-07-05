// app/api/(Backend)/admin/security/blocked-ips/route.js
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import securityServices from "@/lib/services/securityServices";

export const dynamic = "force-dynamic";

export async function GET() {
    const guard = await requireRoles(["ADMIN"]);
    if (!guard.ok) return guard.response;

    try {
        // Run verification checks which automatically purges expired blocks
        await prisma.blockedIp.deleteMany({
            where: { expiresAt: { lt: new Date() } }
        });

        const blockedIps = await prisma.blockedIp.findMany({
            orderBy: { createdAt: "desc" }
        });

        return successResponse({ blockedIps });
    } catch (error) {
        console.error("GET /api/admin/security/blocked-ips error:", error);
        return errorResponse(error.message, 500);
    }
}

export async function POST(request) {
    const guard = await requireRoles(["ADMIN"]);
    if (!guard.ok) return guard.response;

    try {
        const { ip, reason, durationHours } = await request.json();

        if (!ip) {
            return errorResponse("IP address is required", 400);
        }

        const expiresAt = durationHours 
            ? new Date(Date.now() + parseFloat(durationHours) * 60 * 60 * 1000)
            : null; // null represents permanent

        const block = await securityServices.blockIp(ip, reason || "Manual Admin block", expiresAt);
        
        // Log the action to SecurityLogs
        await securityServices.logIncident({
            ip: "127.0.0.1",
            event: "IP_MANUALLY_BLOCKED",
            severity: "LOW",
            description: `Admin manually blocked IP: ${ip}. Reason: ${reason || "None"}. Expires: ${expiresAt || "Permanent"}`
        });

        return successResponse({ success: true, block });
    } catch (error) {
        console.error("POST /api/admin/security/blocked-ips error:", error);
        return errorResponse(error.message, 500);
    }
}

export async function DELETE(request) {
    const guard = await requireRoles(["ADMIN"]);
    if (!guard.ok) return guard.response;

    try {
        const { searchParams } = new URL(request.url);
        const ip = searchParams.get("ip");

        if (!ip) {
            return errorResponse("IP address query parameter is required", 400);
        }

        await securityServices.unblockIp(ip);

        // Log the action to SecurityLogs
        await securityServices.logIncident({
            ip: "127.0.0.1",
            event: "IP_MANUALLY_UNBLOCKED",
            severity: "LOW",
            description: `Admin manually unblocked IP: ${ip}`
        });

        return successResponse({ success: true, message: `IP ${ip} unblocked successfully` });
    } catch (error) {
        console.error("DELETE /api/admin/security/blocked-ips error:", error);
        return errorResponse(error.message, 500);
    }
}
