import { NextResponse } from "next/server";
import RoomServices from "@/lib/services/roomservices/roomservices";

const roomServices = new RoomServices();

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, ...data } = body;

        if (!id) return NextResponse.json({ error: "ID is required", success: false }, { status: 400 });

        const record = await roomServices.updateCleaningLog(id, data);

        return NextResponse.json({
            message: "Cleaning log updated successfully",
            data: record,
            success: true
        });
    } catch (error) {
        console.error("Update Cleaning Error:", error);
        return NextResponse.json({
            error: "Failed to update cleaning log",
            success: false
        }, { status: 500 });
    }
}
