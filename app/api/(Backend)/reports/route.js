export const dynamic = 'force-dynamic';
import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import { ReportServices } from "@/lib/services/reportservices/reportservices";
import prisma from "@/lib/prisma";

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || 'month';
        const hostelId = searchParams.get('hostelId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let isWardenMaster = auth.user.canManageExpenses;
        let granularPerms = {
            canManageMess: auth.user.canManageMess,
            canManageGeneral: auth.user.canManageGeneral,
            canManageUtilities: auth.user.canManageUtilities,
            canManageMaintenance: auth.user.canManageMaintenance,
            canManageSalaries: auth.user.canManageSalaries
        };

        // Sync Warden permissions from DB to avoid staleness issues
        if (auth.user.role === 'WARDEN') {
            const wardenProfile = await prisma.user.findUnique({
                where: { id: auth.user.id || auth.user.userId },
                select: {
                    canManageExpenses: true,
                    canManageMess: true,
                    canManageGeneral: true,
                    canManageUtilities: true,
                    canManageMaintenance: true,
                    canManageSalaries: true
                }
            });
            if (wardenProfile) {
                isWardenMaster = wardenProfile.canManageExpenses;
                granularPerms = wardenProfile;
            }
        }

        let allowedCategories = undefined;
        if (auth.user.role === 'WARDEN' && !isWardenMaster) {
            allowedCategories = [];
            if (granularPerms.canManageMess) allowedCategories.push('MESS');
            if (granularPerms.canManageGeneral) allowedCategories.push('GENERAL');
            if (granularPerms.canManageUtilities) allowedCategories.push('UTILITY_BILL');
            if (granularPerms.canManageMaintenance) allowedCategories.push('MAINTENANCE');
            if (granularPerms.canManageSalaries) allowedCategories.push('SALARY');

            if (allowedCategories.length === 0) {

                allowedCategories = ['NONE'];
            }
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
