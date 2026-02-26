import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import RoomServices from "@/lib/services/roomservices/roomservices";

export async function POST(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

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
