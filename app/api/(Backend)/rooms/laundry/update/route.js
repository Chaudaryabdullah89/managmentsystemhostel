import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import RoomServices from "@/lib/services/roomservices/roomservices";

const roomServices = new RoomServices();

export async function PUT(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

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
