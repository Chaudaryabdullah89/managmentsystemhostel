import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import { ReportServices } from "@/lib/services/reportservices/reportservices";

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'month';
        const hostelId = searchParams.get('hostelId');

        let stats;
        if (hostelId) {
            stats = await ReportServices.getHostelStats(hostelId, period);
        } else {
            stats = await ReportServices.getGlobalStats(period);
        }

        return NextResponse.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error("Reports API Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
