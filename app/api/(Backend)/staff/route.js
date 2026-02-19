import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
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
