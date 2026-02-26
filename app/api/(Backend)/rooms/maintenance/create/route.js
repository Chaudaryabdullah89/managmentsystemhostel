import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const { hostelId, roomId, title, description, priority, status } = body;

        const record = await prisma.maintanance.create({
            data: {
                hostelId,
                roomId,
                title,
                description,
                priority: priority || "MEDIUM",
                status: status || "PENDING"
            }
        });

        return NextResponse.json({
            message: "Maintenance record created successfully",
            data: record,
            success: true
        });
    } catch (error) {
        console.error("Create Maintenance Error:", error);
        return NextResponse.json({
            error: "Failed to create maintenance record",
            success: false
        }, { status: 500 });
    }
}
