export const dynamic = 'force-dynamic';
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
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let allowedCategories = undefined;
        if (auth.user.role === 'WARDEN' && !auth.user.canManageExpenses) {
            allowedCategories = [];
            if (auth.user.canManageMess) allowedCategories.push('MESS');
            if (auth.user.canManageGeneral) allowedCategories.push('GENERAL');
            if (auth.user.canManageUtilities) allowedCategories.push('UTILITY_BILL');
            if (auth.user.canManageMaintenance) allowedCategories.push('MAINTENANCE');
            if (auth.user.canManageSalaries) allowedCategories.push('SALARY');
        }

        let stats;
        if (hostelId) {
            stats = await ReportServices.getHostelStats(hostelId, period, startDate, endDate, allowedCategories);
        } else {
            stats = await ReportServices.getGlobalStats(period, startDate, endDate, allowedCategories);
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
