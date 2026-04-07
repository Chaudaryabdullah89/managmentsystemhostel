export const dynamic = 'force-dynamic';
import { ReportServices } from "@/lib/services/reportservices/reportservices";
import prisma from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getAllowedExpenseCategories } from "@/lib/expensePermissions";
import { getOrSetRouteCache } from "@/lib/routeCache";

export async function GET(request) {
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

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
            allowedCategories = getAllowedExpenseCategories(granularPerms);
        }

        const cacheKey = `reports:${auth.user.role}:${auth.user.id || auth.user.userId || auth.user.sub}:${period}:${hostelId || "global"}:${startDate || "na"}:${endDate || "na"}:${(allowedCategories || []).join(",")}`;
        const stats = await getOrSetRouteCache(cacheKey, 60 * 1000, async () => {
            if (hostelId) {
                return await ReportServices.getHostelStats(hostelId, period, startDate, endDate, allowedCategories);
            }
            return await ReportServices.getGlobalStats(period, startDate, endDate, allowedCategories);
        });

        return successResponse({ data: stats });
    } catch (error) {
        console.error("Reports API Error:", error);
        return errorResponse(error.message, 500, { error: error.message });
    }
}
