export const dynamic = 'force-dynamic';
import { requireAuth } from '@/lib/apiAuth';
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import RoomServices from "../../../../../lib/services/roomservices/roomservices";

export async function GET(request) {
    const auth = await requireAuth();
    if (!auth.success) return NextResponse.json({ error: auth.error || "Unauthorized", success: false }, { status: auth.status || 401 });

    try {
        const { searchParams } = new URL(request.url);
        const hostelId = searchParams.get('hostelId');
        const roomid = searchParams.get('roomid') || searchParams.get('roomId');

        if (!roomid) {
            return NextResponse.json({
                error: "Room ID is required",
                success: false
            }, { status: 400 });
        }

        const isroomexists = await prisma.room.findUnique({
            where: { id: roomid }
        });

        if (!isroomexists) {
            return NextResponse.json({
                error: "Room record could not be located",
                success: false
            }, { status: 404 });
        }

        const roomData = await new RoomServices().getSingleRoomByHostelId(hostelId || isroomexists.hostelId, roomid);
        return NextResponse.json({
            message: "Room fetched successfully",
            data: roomData,
            success: true
        });
    } catch (error) {
        console.error("GET Room Error:", error);
        return NextResponse.json({
            error: "Failed to fetch room",
            success: false
        }, { status: 500 });
    }
}