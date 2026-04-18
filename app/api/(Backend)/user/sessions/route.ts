export const dynamic = 'force-dynamic';
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const authUser = guard.user;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    // Only Admin can fetch other users' sessions
    const userId = (targetUserId && authUser.role === 'ADMIN') ? targetUserId : (authUser.userId || authUser.id || authUser.sub);
    
    if (!userId) return errorResponse("User ID required", 400);

    try {
        const cookieStore = await cookies();
        const currentToken = cookieStore.get('token')?.value;

        const rawSessions = await prisma.session.findMany({
            where: {
                userId: userId as string,
                isActive: true
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
                token: true,
            }
        });

        const sessions = rawSessions.map(s => ({
            ...s,
            isCurrent: s.token === currentToken,
            token: undefined, 
        }));

        return successResponse({ sessions });
    } catch (error) {
        console.error(`[API] GET /api/user/sessions - Error: ${error}`);
        return errorResponse("Failed to fetch sessions", 500);
    }
}

export async function DELETE(req: NextRequest) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const authUser = guard.user;
    
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const targetUserId = searchParams.get("userId");

    try {
        if (sessionId) {
            const session = await prisma.session.findUnique({
                where: { id: sessionId }
            });

            if (!session) return errorResponse("Session not found", 404);

            // Allow if it's own session OR if requester is ADMIN
            const isOwnSession = session.userId === (authUser.userId || authUser.id || authUser.sub);
            if (!isOwnSession && authUser.role !== 'ADMIN') {
                return errorResponse("Forbidden", 403);
            }

            // Decided to delete instead of just deactivate for cleanliness, 
            // but we could also do update({ isActive: false })
            await prisma.session.delete({
                where: { id: sessionId }
            });
            
            return successResponse({ message: "Session terminated" });
        } else if (targetUserId) {
            // Terminate all sessions for a specific user (Admin only)
            if (authUser.role !== 'ADMIN') return errorResponse("Forbidden", 403);

            await prisma.session.deleteMany({
                where: { userId: targetUserId }
            });

            return successResponse({ message: `All sessions for user ${targetUserId} terminated` });
        } else {
            // Self-termination options
            const userId = authUser.userId || authUser.id || authUser.sub;
            const excludeCurrent = searchParams.get("excludeCurrent") === "true";
            const cookieStore = await cookies();
            const currentToken = cookieStore.get('token')?.value;

            await prisma.session.deleteMany({
                where: {
                    userId: userId as string,
                    ...(excludeCurrent && currentToken ? { token: { not: currentToken } } : {})
                }
            });
            return successResponse({ message: excludeCurrent ? "Other sessions terminated" : "All sessions terminated" });
        }
    } catch (error) {
        console.error(`[API] DELETE /api/user/sessions - Error:`, error);
        return errorResponse("Failed to terminate session(s)", 500);
    }
}
