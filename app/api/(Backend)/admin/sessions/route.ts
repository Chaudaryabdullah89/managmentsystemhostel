import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import { successResponse, errorResponse } from "@/lib/apiResponse";

export async function GET(req: NextRequest) {
    const guard = await requireRoles(['ADMIN']);
    if (!guard.ok) return guard.response;

    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get("userId");
        const isActive = searchParams.get("isActive") !== "false";

        const sessions = await prisma.session.findMany({
            where: {
                ...(userId ? { userId } : {}),
                isActive
            },
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        image: true
                    }
                }
            },
            orderBy: {
                lastActive: 'desc'
            }
        });

        return successResponse({ sessions });
    } catch (error) {
        console.error(`[API] GET /api/admin/sessions - Error:`, error);
        return errorResponse("Failed to fetch global sessions", 500);
    }
}

export async function DELETE(req: NextRequest) {
    const guard = await requireRoles(['ADMIN']);
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const userId = searchParams.get("userId");

    try {
        if (sessionId) {
            await prisma.session.delete({
                where: { id: sessionId }
            });
            return successResponse({ message: "Session purged" });
        } else if (userId) {
            await prisma.session.deleteMany({
                where: { userId }
            });
            return successResponse({ message: `All sessions for user ${userId} purged` });
        } else {
            return errorResponse("Missing identifier", 400);
        }
    } catch (error) {
        console.error(`[API] DELETE /api/admin/sessions - Error:`, error);
        return errorResponse("Failed to purge session(s)", 500);
    }
}
