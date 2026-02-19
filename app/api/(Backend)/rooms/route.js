import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import RoomServices from "../../../../lib/services/roomservices/roomservices";

export async function GET() {
    try {
        const roomData = await new RoomServices().getRooms()
        return NextResponse.json({
            message: "Rooms fetched successfully",
            data: roomData,
            success: true
        })
    } catch (error) {
        console.error("GET Rooms Error:", error);
        return NextResponse.json({
            error: "Failed to fetch rooms",
            success: false
        }, { status: 500 })
    }
}