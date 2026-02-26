import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
    const auth = await checkRole(['STAFF', 'ADMIN', 'SUPER_ADMIN', 'WARDEN']);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const hostelId = searchParams.get("hostelId");

        const where = {};
        if (hostelId) {
            where.User = {
                hostelId: hostelId
            };
        }

        const staff = await prisma.staffProfile.findMany({
            where,
            include: {
                User: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        image: true,
                        hostelId: true,
                        Hostel_User_hostelIdToHostel: {
                            select: { name: true }
                        }
                    }
                },
                attendance: {
                    orderBy: { checkIn: 'desc' },
                    take: 1
                }
            }
        });

        return NextResponse.json({
            success: true,
            data: staff
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
