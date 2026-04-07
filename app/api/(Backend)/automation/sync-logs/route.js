import { requireAuth } from '@/lib/apiAuth';
import { NextResponse } from "next/server";
import RoomServices from "@/lib/services/roomservices/roomservices";
import { errorResponse } from '@/lib/apiResponse';

export async function POST(request) {
    const auth = await requireAuth();
    if (!auth.success) return errorResponse(auth.error, auth.status);

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
