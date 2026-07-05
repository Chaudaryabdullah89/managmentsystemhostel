// app/api/(Backend)/admin/security/logs/route.js
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export const dynamic = "force-dynamic";

export async function GET(request) {
    const guard = await requireRoles(["ADMIN"]);
    if (!guard.ok) return guard.response;

    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "100");
        const severity = searchParams.get("severity") || undefined;
        const event = searchParams.get("event") || undefined;

        // Fetch logs
        const logs = await prisma.securityLog.findMany({
            where: {
                severity: severity ? severity : undefined,
                event: event ? event : undefined,
            },
            orderBy: { createdAt: "desc" },
            take: limit
        });

        // Calculate severity stats
        const stats = await prisma.securityLog.groupBy({
            by: ["severity"],
            _count: { id: true }
        });

        // Format stats into easy-to-use key-value pairs
        const severityCounts = {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
            CRITICAL: 0
        };
        stats.forEach(s => {
            if (s.severity in severityCounts) {
                severityCounts[s.severity] = s._count.id;
            }
        });

        return successResponse({ logs, stats: severityCounts });
    } catch (error) {
        console.error("GET /api/admin/security/logs error:", error);
        return errorResponse(error.message, 500);
    }
}
