export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/apiAuth';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse } from '@/lib/apiResponse';

export async function GET(request, context) {
    const auth = await requireAuth();
    if (!auth.success) return errorResponse(auth.error, auth.status);

    try {
        const { staffId } = await context.params;

        const staffProfile = await prisma.staffProfile.findUnique({
            where: { id: staffId },
            include: {
                User: {
                    include: {
                        Hostel_User_hostelIdToHostel: true
                    }
                },
                Salary: {
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!staffProfile) {
            return NextResponse.json({ success: false, error: "Staff Profile not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: staffProfile
        });

    } catch (error) {
        console.error("Staff Salary History Error:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch staff salary history" }, { status: 500 });
    }
}
