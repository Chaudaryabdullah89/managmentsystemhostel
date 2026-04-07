export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { getSystemSettings, getPermissionsForRole, DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { requireSelfOrRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function GET(req, { params }) {
    const { id } = await params;
    const guard = await requireSelfOrRoles(id, ['ADMIN']);
    if (!guard.ok) return guard.response;

    try {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                cnic: true,
                address: true,
                role: true,
                image: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
                updatedAt: true,
                hostelId: true,
                regNumber: true,
                canManageExpenses: true,
                canManageMess: true,
                canManageGeneral: true,
                canManageUtilities: true,
                canManageMaintenance: true,
                canManageSalaries: true,
                Hostel_User_hostelIdToHostel: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        email: true,
                        phone: true,
                    }
                }
            }
        });

        if (!user) {
            return errorResponse("User not found", 404);
        }

        // Fetch dynamic permissions + global settings in parallel (both cached via React.cache())
        const [rolePermissions, systemSettings] = await Promise.all([
            getPermissionsForRole(user.role),
            getSystemSettings(),
        ]);

        return successResponse({
            ...user,
            rolePermissions,
            systemSettings,
        });
    } catch (error) {
        console.error(`[API] GET /api/users/profile/${id} - Error:`, error);
        return errorResponse("Failed to fetch user", 500);
    }
}
