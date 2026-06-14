import { requireAuth } from '@/lib/apiAuth';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse } from '@/lib/apiResponse';

export async function PUT(request) {
    const auth = await requireAuth();
    if (!auth.success) return errorResponse(auth.error, auth.status);

    try {
        const body = await request.json();
        const { id, status, resolutionNotes, partsUsed } = body;

        if (!id) return NextResponse.json({ error: "ID is required", success: false }, { status: 400 });

        const data = { status, resolutionNotes };
        if (status === 'RESOLVED') {
            data.resolvedAt = new Date();
            if (partsUsed && Array.isArray(partsUsed)) {
                data.partsUsed = partsUsed;
            }
        }

        // Prepare the maintenance update
        const updateMaintenance = prisma.maintenance.update({
            where: { id },
            data
        });

        const transactions = [updateMaintenance];

        // If resolved and parts were used, deduct them from inventory
        if (status === 'RESOLVED' && partsUsed && Array.isArray(partsUsed)) {
            for (const part of partsUsed) {
                if (part.itemId && part.quantity > 0) {
                    transactions.push(
                        prisma.inventoryItem.update({
                            where: { id: part.itemId },
                            data: { quantity: { decrement: part.quantity } }
                        })
                    );
                }
            }
        }

        // Execute all database operations atomically
        const results = await prisma.$transaction(transactions);
        const record = results[0]; // The maintenance record is the first query


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
