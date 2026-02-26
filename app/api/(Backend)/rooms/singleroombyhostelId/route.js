import { checkRole } from '@/lib/checkRole';
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import RoomServices from "../../../../../lib/services/roomservices/roomservices";

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(request.url);
        const hostelId = searchParams.get('hostelId');
        const roomid = searchParams.get('roomid');

        if (!hostelId) {
            return NextResponse.json({
                error: "hostelId is required",
                success: false
            }, { status: 400 });
        }
        if (!roomid) {
            return NextResponse.json({
                error: "roomid is required",
                success: false
            }, { status: 400 });
        }
        const isroomexists = await prisma.room.findUnique({
            where: { id: roomid }
        })

        if (!isroomexists) {
            return NextResponse.json({
                error: "Room record could not be located",
                success: false
            }, { status: 404 });
        }

        const roomData = await new RoomServices().getSingleRoomByHostelId(hostelId, roomid)
        return NextResponse.json({
            message: "Room fetched successfully",
            data: roomData,
            success: true
        })
    } catch (error) {
        console.error("GET Room Error:", error);
        return NextResponse.json({
            error: "Failed to fetch room",
            success: false
        }, { status: 500 })
    }
}