import { requireAuth } from '@/lib/apiAuth';
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import RoomServices from "../../../../../lib/services/roomservices/roomservices";
import { errorResponse } from '@/lib/apiResponse';

export async function POST(req) {
    const auth = await requireAuth();
    if (!auth.success) return errorResponse(auth.error, auth.status);

    try {
        const body = await req.json();

        // Security: Wardens can ONLY update rooms in their assigned hostel
        if (auth.user.role === 'WARDEN') {
            let wardenHostelId = auth.user.hostelId;
            if (!wardenHostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = wardenProfile?.hostelId;
            }

            const room = await prisma.room.findUnique({
                where: { id: body.id },
                select: { hostelId: true }
            });

            if (room && room.hostelId !== wardenHostelId) {
                return NextResponse.json({ success: false, error: "Access Denied: You cannot update rooms in other hostels." }, { status: 403 });
            }
        }

        const room = await new RoomServices().updateRoom(body)
        return NextResponse.json({
            message: "Room updated successfully",
            data: room,
            success: true
        })
    } catch (error) {
        console.error("POST Edit Room Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
