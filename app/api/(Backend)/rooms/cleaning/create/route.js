import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import RoomServices from "@/lib/services/roomservices/roomservices";

export async function POST(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

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
