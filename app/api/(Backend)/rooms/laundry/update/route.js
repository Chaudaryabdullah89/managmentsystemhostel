import { requireAuth } from '@/lib/apiAuth';
import { NextResponse } from "next/server";
import RoomServices from "@/lib/services/roomservices/roomservices";
import { errorResponse } from '@/lib/apiResponse';

const roomServices = new RoomServices();

export async function PUT(request) {
    const auth = await requireAuth();
    if (!auth.success) return errorResponse(auth.error, auth.status);

    try {
        const body = await request.json();
        const { id, ...data } = body;

        if (!id) return NextResponse.json({ error: "ID is required", success: false }, { status: 400 });

        const record = await roomServices.updateLaundryLog(id, data);

        return NextResponse.json({
            message: "Laundry log updated successfully",
            data: record,
            success: true
        });
    } catch (error) {
        console.error("Update Laundry Error:", error);
        return NextResponse.json({
            error: "Failed to update laundry log",
            success: false
        }, { status: 500 });
    }
}
