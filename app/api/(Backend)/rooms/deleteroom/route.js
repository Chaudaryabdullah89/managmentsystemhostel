import { checkRole } from '@/lib/checkRole';
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import RoomServices from "../../../../../lib/services/roomservices/roomservices";

export async function DELETE(req) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { searchParams } = new URL(req.url);
        const roomId = searchParams.get('roomId');

        if (!roomId) {
            return NextResponse.json({
                success: false,
                error: "Room ID is required"
            }, { status: 400 });
        }

        const room = await new RoomServices().deleteRoom(roomId)
        return NextResponse.json({
            message: "Room decommissioned successfully",
            data: room,
            success: true
        })
    } catch (error) {
        console.error("DELETE Room Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
