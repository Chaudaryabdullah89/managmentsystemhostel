import { NextResponse } from "next/server";
import NoticeService from "@/lib/services/noticeservices/noticeservices";

const noticeService = new NoticeService();

export async function GET(request) {
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
    try {
        const body = await request.json();
        const notice = await noticeService.createNotice(body);
        return NextResponse.json({ success: true, data: notice });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
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
