import { requireAuth } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/apiResponse";

async function getWardenHostelId(userId) {
    const wardenProfile = await prisma.user.findUnique({
        where: { id: userId },
        select: { hostelId: true }
    });
    return wardenProfile?.hostelId;
}

export async function GET(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const userId = guard.user?.id || guard.user?.userId || guard.user?.sub;
    const role = guard.user?.role;

    if (role !== 'ADMIN' && role !== 'WARDEN') {
        return errorResponse("Forbidden", 403);
    }

    try {
        const { searchParams } = new URL(request.url);
        let hostelId = searchParams.get("hostelId");

        if (role === 'WARDEN') {
            const wardenHostelId = await getWardenHostelId(userId);
            if (!wardenHostelId) {
                return errorResponse("Warden has no hostel assigned.", 400);
            }
            hostelId = wardenHostelId;
        }

        if (!hostelId || hostelId === 'all') {
            return errorResponse("Missing required query param: hostelId", 400);
        }

        const inventory = await prisma.messInventory.findMany({
            where: { hostelId },
            orderBy: { itemName: "asc" }
        });

        return successResponse({ inventory });

    } catch (error) {
        console.error("GET /api/warden/mess/stock error:", error);
        return errorResponse("Failed to fetch mess stock", 500);
    }
}

export async function POST(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const userId = guard.user?.id || guard.user?.userId || guard.user?.sub;
    const role = guard.user?.role;

    if (role !== 'ADMIN' && role !== 'WARDEN') {
        return errorResponse("Forbidden", 403);
    }

    try {
        const body = await request.json();
        let { hostelId, itemName, quantity, unit, minThreshold, expiryDate } = body;

        if (role === 'WARDEN') {
            const wardenHostelId = await getWardenHostelId(userId);
            if (!wardenHostelId) {
                return errorResponse("Warden has no hostel assigned.", 400);
            }
            hostelId = wardenHostelId;
        }

        if (!hostelId || !itemName || quantity === undefined || !unit) {
            return errorResponse("Missing required fields: hostelId, itemName, quantity, unit", 400);
        }

        const inventoryItem = await prisma.messInventory.create({
            data: {
                hostelId,
                itemName: itemName.trim(),
                quantity: parseFloat(quantity),
                unit: unit.trim(),
                minThreshold: minThreshold !== undefined ? parseFloat(minThreshold) : 10,
                expiryDate: expiryDate ? new Date(expiryDate) : null
            }
        });

        return successResponse({
            message: "Stock item added successfully",
            inventoryItem
        });

    } catch (error) {
        console.error("POST /api/warden/mess/stock error:", error);
        return errorResponse("Failed to add stock item", 500);
    }
}

export async function PUT(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const role = guard.user?.role;

    if (role !== 'ADMIN' && role !== 'WARDEN') {
        return errorResponse("Forbidden", 403);
    }

    try {
        const body = await request.json();
        const { itemId, quantity, action, minThreshold, expiryDate } = body; // action: "ADD" or "CONSUME" or "UPDATE"

        if (!itemId) {
            return errorResponse("Item ID is required", 400);
        }

        const existing = await prisma.messInventory.findUnique({
            where: { id: itemId }
        });

        if (!existing) {
            return errorResponse("Stock item not found", 404);
        }

        let newQuantity = existing.quantity;

        if (action === "ADD") {
            newQuantity += parseFloat(quantity);
        } else if (action === "CONSUME") {
            newQuantity = Math.max(0, existing.quantity - parseFloat(quantity));
        } else if (action === "UPDATE") {
            newQuantity = parseFloat(quantity);
        }

        const updated = await prisma.messInventory.update({
            where: { id: itemId },
            data: {
                quantity: newQuantity,
                minThreshold: minThreshold !== undefined ? parseFloat(minThreshold) : undefined,
                expiryDate: expiryDate !== undefined ? (expiryDate ? new Date(expiryDate) : null) : undefined,
                updatedAt: new Date()
            }
        });

        return successResponse({
            message: "Stock updated successfully",
            inventoryItem: updated
        });

    } catch (error) {
        console.error("PUT /api/warden/mess/stock error:", error);
        return errorResponse("Failed to update stock", 500);
    }
}

export async function DELETE(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const role = guard.user?.role;

    if (role !== 'ADMIN' && role !== 'WARDEN') {
        return errorResponse("Forbidden", 403);
    }

    try {
        const { searchParams } = new URL(request.url);
        const itemId = searchParams.get("itemId");

        if (!itemId) {
            return errorResponse("Item ID is required", 400);
        }

        await prisma.messInventory.delete({
            where: { id: itemId }
        });

        return successResponse({
            message: "Stock item deleted successfully"
        });

    } catch (error) {
        console.error("DELETE /api/warden/mess/stock error:", error);
        return errorResponse("Failed to delete stock item", 500);
    }
}
