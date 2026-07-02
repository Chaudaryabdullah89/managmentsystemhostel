import { requireAuth } from '@/lib/apiAuth';
import { NextResponse } from "next/server";
import RoomServices from "@/lib/services/roomservices/roomservices";
import { errorResponse } from '@/lib/apiResponse';

export async function POST(request) {
    const auth = await requireAuth();
    if (!auth.success) return errorResponse(auth.error, auth.status);

    try {
        // ?force=true skips interval check and logs immediately for all occupied rooms
        const { searchParams } = new URL(request.url);
        const force = searchParams.get('force') === 'true';

        const results = await new RoomServices().syncAutomationLogs({ force });
        return NextResponse.json({
            message: force
                ? `Force sync: ${results.cleaning} cleaning & ${results.laundry} laundry logs created`
                : "Automation sync completed",
            data: results,
            success: true
        });
    } catch (error) {
        console.error("Automation Route Error:", error);
        return NextResponse.json({
            error: "Failed to run automation sync",
            message: error.message,
            success: false
        }, { status: 500 });
    }
}
