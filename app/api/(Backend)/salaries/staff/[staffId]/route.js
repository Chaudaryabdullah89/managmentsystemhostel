import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request, context) {
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
