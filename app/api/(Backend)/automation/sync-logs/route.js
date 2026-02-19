import { NextResponse } from "next/server";
import RoomServices from "@/lib/services/roomservices/roomservices";

export async function POST(request) {
    try {
        const results = await new RoomServices().syncAutomationLogs();
        return NextResponse.json({
            message: "Automation sync completed",
            data: results,
            success: true
        });
    } catch (error) {
        console.error("Automation Route Error:", error);
        return NextResponse.json({
            error: "Failed to run automation sync",
            success: false
        }, { status: 500 });
    }
}
