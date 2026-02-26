import { checkRole } from '@/lib/checkRole';
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import RoomServices from "../../../../../lib/services/roomservices/roomservices";

export async function POST(req) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const body = await req.json();
        const room = await new RoomServices().createRoom(body)
        return NextResponse.json({
            message: "Room created successfully",
            data: room,
            success: true
        })
    } catch (error) {
        console.error("POST Create Room Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}