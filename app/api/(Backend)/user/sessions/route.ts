import { checkRole } from '@/lib/checkRole';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { useSession } from "../../auth/usesession";

export async function GET(req: NextRequest) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const authUser = await useSession();

    if (!authUser || !authUser.userId) {
        if (!authUser?.id) {
            console.warn(`[API] GET /api/user/sessions - Unauthorized attempt`);
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    const userId = authUser.userId || authUser.id;
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
        return NextResponse.json({ sessions });
    } catch (error) {
        console.error(`[API] GET /api/user/sessions - Error fetching sessions: ${error}`);
        return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const authUser = await useSession();
    if (!authUser || (!authUser.userId && !authUser.id)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.userId || authUser.id;
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
            return NextResponse.json({ success: true, message: "Session terminated" });
        } else {
            // Terminate all sessions
            await prisma.session.deleteMany({
                where: {
                    userId: userId as string
                }
            });
            return NextResponse.json({ success: true, message: "All sessions terminated" });
        }
    } catch (error) {
        console.error(`[API] DELETE /api/user/sessions - Error:`, error);
        return NextResponse.json({ error: "Failed to terminate session(s)" }, { status: 500 });
    }
}
