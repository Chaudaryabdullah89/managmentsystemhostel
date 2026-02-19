import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(request) {
    try {
        const body = await request.json();
        const { id, status, resolutionNotes } = body;

        if (!id) return NextResponse.json({ error: "ID is required", success: false }, { status: 400 });

        const data = { status, resolutionNotes };
        if (status === 'RESOLVED') {
            data.resolvedAt = new Date();
        }

        const record = await prisma.maintanance.update({
            where: { id },
            data
        });

        return NextResponse.json({
            message: "Maintenance record updated successfully",
            data: record,
            success: true
        });
    } catch (error) {
        console.error("Update Maintenance Error:", error);
        return NextResponse.json({
            error: "Failed to update maintenance record",
            success: false
        }, { status: 500 });
    }
}
