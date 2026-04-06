import { checkRole } from '@/lib/checkRole';
import { isServiceEnabled, hasPermission } from '@/lib/permissions';
import { NextResponse } from "next/server";
import NoticeService from "@/lib/services/noticeservices/noticeservices";
import { prisma } from "@/lib/prisma";

const noticeService = new NoticeService();

export async function GET(request) {
    if (!await isServiceEnabled('enableNoticeBoard')) {
        return NextResponse.json({ success: true, data: [] }); // Gracefully return empty if disabled
    }

    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        let hostelId = searchParams.get('hostelId');
        if (hostelId === 'null' || hostelId === 'undefined') hostelId = null;
        const stats = searchParams.get('stats');

        if (stats) {
            const noticeStats = await noticeService.getNoticeStats(hostelId);
            return NextResponse.json({ success: true, data: noticeStats });
        }

        let filter = {};
        if (hostelId) {
            // Fetch notices for specific hostel OR global notices (hostelId null)
            filter = {
                OR: [
                    { hostelId: hostelId },
                    { hostelId: null }
                ]
            };
        }

        const notices = await noticeService.getNotices(filter);
        return NextResponse.json({ success: true, data: notices });
    } catch (error) {
        console.error("[API] GET /api/notices - Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    if (!await isServiceEnabled('enableNoticeBoard')) {
        return NextResponse.json({ success: false, message: 'Notice board is currently disabled.' }, { status: 503 });
    }

    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    if (!await hasPermission('manage_notices')) {
        return NextResponse.json({ success: false, message: "Forbidden: You do not have permission to post notices." }, { status: 403 });
    }

    try {
        const body = await request.json();

        // Validate author exists to prevent P2003
        if (body.authorId) {
            const user = await prisma.user.findUnique({ where: { id: body.authorId }, select: { id: true } });
            if (!user) return NextResponse.json({ success: false, error: "Author user does not exist. Your session might be stale." }, { status: 401 });
        }

        // Validate hostelId if provided
        if (body.hostelId && body.hostelId !== 'all') {
            const hostel = await prisma.hostel.findUnique({ where: { id: body.hostelId }, select: { id: true } });
            if (!hostel) {
                // If not found, check if it's 'null' or 'undefined' string
                if (body.hostelId === 'null' || body.hostelId === 'undefined') {
                    body.hostelId = null;
                } else {
                    return NextResponse.json({ success: false, error: "Selected hostel does not exist." }, { status: 400 });
                }
            }
        }

        const notice = await noticeService.createNotice(body);
        return NextResponse.json({ success: true, data: notice });
    } catch (error) {
        console.error("Notice POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    if (!await hasPermission('manage_notices')) {
        return NextResponse.json({ success: false, message: "Forbidden: You do not have permission to update notices." }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { id, ...data } = body;
        const notice = await noticeService.updateNotice(id, data);
        return NextResponse.json({ success: true, data: notice });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    if (!await hasPermission('manage_notices')) {
        return NextResponse.json({ success: false, message: "Forbidden: You do not have permission to delete notices." }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) throw new Error("Notice ID is required");
        const notice = await noticeService.deleteNotice(id);
        return NextResponse.json({ success: true, data: notice });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
