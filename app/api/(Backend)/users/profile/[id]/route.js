export const dynamic = 'force-dynamic';
import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSystemSettings, getPermissionsForRole, DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";

export async function GET(req, { params }) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const { id } = await params;

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
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Fetch dynamic permissions + global settings in parallel (both cached via React.cache())
        const [rolePermissions, systemSettings] = await Promise.all([
            getPermissionsForRole(user.role),
            getSystemSettings(),
        ]);

        return NextResponse.json({
            ...user,
            rolePermissions,
            systemSettings,
        });
    } catch (error) {
        console.error(`[API] GET /api/users/profile/${id} - Error:`, error);
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}
