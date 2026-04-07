export const dynamic = 'force-dynamic';
import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { getPermissionsForRole, getSystemSettings } from "@/lib/permissions";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function GET() {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const userId = auth.user?.id || auth.user?.userId || auth.user?.sub;
        if (!userId) {
            return errorResponse("Invalid session", 401);
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                hostelId: true,
                lastLogin: true,
                canManageExpenses: true,
                canManageMess: true,
                canManageGeneral: true,
                canManageUtilities: true,
                canManageMaintenance: true,
                canManageSalaries: true,
            }
        });

        if (!user) {
            return errorResponse("User not found", 404);
        }

        const [rolePermissions, systemSettings] = await Promise.all([
            getPermissionsForRole(user.role),
            getSystemSettings(),
        ]);

        return successResponse({
            user: {
                ...user,
                rolePermissions,
                systemSettings,
            }
        });
    } catch (error) {
        return errorResponse("Failed to load session", 500);
    }
}
