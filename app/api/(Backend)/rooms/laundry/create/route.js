import { NextResponse } from "next/server";
import RoomServices from "@/lib/services/roomservices/roomservices";

export async function POST(request) {
    try {
        const body = await request.json();
        const log = await new RoomServices().createLaundryLog(body);
        return NextResponse.json({
            message: "Laundry log created successfully",
            data: log,
            success: true
        });
    } catch (error) {
        console.error("Create Laundry Log Error:", error);
        return NextResponse.json({
            error: "Failed to create laundry log",
            success: false
        }, { status: 500 });
    }
}
