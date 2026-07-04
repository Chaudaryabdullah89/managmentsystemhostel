export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) return errorResponse("Missing token", 400);

    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: "global" },
            select: {
                maintenanceWardenToken: true,
                maintenanceGuestToken: true,
            }
        });

        if (settings) {
            if (token === settings.maintenanceWardenToken) {
                return successResponse({ valid: true, role: "WARDEN" });
            }
            if (token === settings.maintenanceGuestToken) {
                return successResponse({ valid: true, role: "GUEST" });
            }
        }

        return successResponse({ valid: false });
    } catch (e) {
        return errorResponse(e.message, 500);
    }
}
