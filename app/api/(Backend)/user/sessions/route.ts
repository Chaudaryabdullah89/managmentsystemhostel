export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const authUser = guard.user;
    const userId = authUser.userId || authUser.id || authUser.sub;
    if (!userId) return errorResponse("Unauthorized", 401);
    console.log(`[API] GET /api/user/sessions - Fetching sessions for user: ${userId}`);

    try {
        const sessions = await prisma.session.findMany({
            where: {
                userId: userId as string
            },
            orderBy: {
                lastActive: 'desc'
            },
            select: {
                id: true,
                device: true,
                ipAddress: true,
                lastActive: true,
                isActive: true,
                createdAt: true,
            }
        });

        console.log(`[API] GET /api/user/sessions - Found ${sessions.length} sessions for user: ${userId}`);
        return successResponse({ sessions });
    } catch (error) {
        console.error(`[API] GET /api/user/sessions - Error fetching sessions: ${error}`);
        return errorResponse("Failed to fetch sessions", 500);
    }
}

export async function DELETE(req: NextRequest) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const authUser = guard.user;
    const userId = authUser.userId || authUser.id || authUser.sub;
    if (!userId) return errorResponse("Unauthorized", 401);
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    try {
        if (sessionId) {
            // Terminate specific session
            await prisma.session.delete({
                where: {
                    id: sessionId,
                    userId: userId as string
                }
            });
            return successResponse({ message: "Session terminated" });
        } else {
            // Terminate all sessions
            await prisma.session.deleteMany({
                where: {
                    userId: userId as string
                }
            });
            return successResponse({ message: "All sessions terminated" });
        }
    } catch (error) {
        console.error(`[API] DELETE /api/user/sessions - Error:`, error);
        return errorResponse("Failed to terminate session(s)", 500);
    }
}
