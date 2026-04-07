import { requireAuth } from '@/lib/apiAuth';
import { NextResponse } from "next/server";
import RoomServices from "@/lib/services/roomservices/roomservices";
import { errorResponse } from '@/lib/apiResponse';

export async function POST(request) {
    const auth = await requireAuth();
    if (!auth.success) return errorResponse(auth.error, auth.status);

    try {
        const body = await request.json();
        const log = await new RoomServices().createCleaningLog(body);
        return NextResponse.json({
            message: "Cleaning log created successfully",
            data: log,
            success: true
        });
    } catch (error) {
        console.error("Create Cleaning Log Error:", error);
        return NextResponse.json({
            error: "Failed to create cleaning log",
            success: false
        }, { status: 500 });
    }
}
