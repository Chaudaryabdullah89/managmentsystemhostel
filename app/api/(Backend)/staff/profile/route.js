import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
        }

        const staff = await prisma.staffProfile.findUnique({
            where: { userId },
            include: {
                User: {
                    select: {
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
                    take: 7
                }
            }
        });

        if (!staff) {
            return NextResponse.json({ success: false, error: "Staff profile not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: staff
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
