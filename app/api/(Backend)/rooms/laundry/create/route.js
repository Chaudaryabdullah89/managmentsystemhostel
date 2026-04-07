import { requireAuth } from '@/lib/apiAuth';
import { NextResponse } from "next/server";
import RoomServices from "@/lib/services/roomservices/roomservices";
import { errorResponse } from '@/lib/apiResponse';

export async function POST(request) {
    const auth = await requireAuth();
    if (!auth.success) return errorResponse(auth.error, auth.status);

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
