import { requireAuth } from '@/lib/apiAuth';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse } from '@/lib/apiResponse';

export async function POST(request) {
    const auth = await requireAuth();
    if (!auth.success) return errorResponse(auth.error, auth.status);

    try {
        const body = await request.json();
        const { hostelId, roomId, title, description, priority, status, userId, images } = body;

        const record = await prisma.maintenance.create({
            data: {
                hostelId,
                roomId,
                title,
                description,
                priority: priority || "MEDIUM",
                status: status || "PENDING",
                userId: userId || auth.user?.id,
                images: images || [],
                updatedAt: new Date()
            }
        });

        // Generate and assign UID
        const uid = `MNT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const updatedRecord = await prisma.maintenance.update({
            where: { id: record.id },
            data: { uid }
        });

        return NextResponse.json({
            message: "Maintenance record created successfully",
            data: updatedRecord,
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
