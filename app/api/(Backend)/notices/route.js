import { isServiceEnabled, hasPermission } from '@/lib/permissions';
import NoticeService from "@/lib/services/noticeservices/noticeservices";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

const noticeService = new NoticeService();

export async function GET(request) {
    if (!await isServiceEnabled('enableNoticeBoard')) {
        return successResponse({ data: [] }); // Gracefully return empty if disabled
    }

    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const { searchParams } = new URL(request.url);
        let hostelId = searchParams.get('hostelId');
        if (hostelId === 'null' || hostelId === 'undefined') hostelId = null;
        const stats = searchParams.get('stats');

        if (stats) {
            const noticeStats = await noticeService.getNoticeStats(hostelId);
            return successResponse({ data: noticeStats });
        }

        let filter = {};
        const viewerRole = guard.user?.role;
        if (hostelId) {
            // Fetch notices for specific hostel OR global notices (hostelId null)
            filter = {
                OR: [
                    { hostelId: hostelId },
                    { hostelId: null }
                ]
            };
        }

        if (viewerRole) {
            filter = {
                AND: [
                    filter,
                    {
                        OR: [
                            { targetRoles: { isEmpty: true } },
                            { targetRoles: { has: viewerRole } },
                        ],
                    },
                ],
            };
        }

        const notices = await noticeService.getNotices(filter);
        return successResponse({ data: notices });
    } catch (error) {
        console.error("[API] GET /api/notices - Error:", error);
        return errorResponse(error.message, 500);
    }
}

export async function POST(request) {
    if (!await isServiceEnabled('enableNoticeBoard')) {
        return errorResponse('Notice board is currently disabled.', 503);
    }

    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    if (!await hasPermission('manage_notices')) {
        return errorResponse("Forbidden: You do not have permission to post notices.", 403);
    }

    try {
        const body = await request.json();

        // Validate author exists to prevent P2003
        if (body.authorId) {
            const user = await prisma.user.findUnique({ where: { id: body.authorId }, select: { id: true } });
            if (!user) return errorResponse("Author user does not exist. Your session might be stale.", 401);
        }

        // Validate hostelId if provided
        if (body.hostelId && body.hostelId !== 'all') {
            const hostel = await prisma.hostel.findUnique({ where: { id: body.hostelId }, select: { id: true } });
            if (!hostel) {
                // If not found, check if it's 'null' or 'undefined' string
                if (body.hostelId === 'null' || body.hostelId === 'undefined') {
                    body.hostelId = null;
                } else {
                    return errorResponse("Selected hostel does not exist.", 400);
                }
            }
        }

        const notice = await noticeService.createNotice(body);
        return successResponse({ data: notice });
    } catch (error) {
        console.error("Notice POST Error:", error);
        return errorResponse(error.message, 500);
    }
}

export async function PUT(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    if (!await hasPermission('manage_notices')) {
        return errorResponse("Forbidden: You do not have permission to update notices.", 403);
    }

    try {
        const body = await request.json();
        const { id, ...data } = body;
        const notice = await noticeService.updateNotice(id, data);
        return successResponse({ data: notice });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}

export async function DELETE(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    if (!await hasPermission('manage_notices')) {
        return errorResponse("Forbidden: You do not have permission to delete notices.", 403);
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return errorResponse("Notice ID is required", 400);
        const notice = await noticeService.deleteNotice(id);
        return successResponse({ data: notice });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
