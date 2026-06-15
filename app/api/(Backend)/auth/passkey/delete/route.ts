import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

/**
 * DELETE /api/auth/passkey/delete
 * Remove a registered passkey by its DB id.
 * Only the owner can delete their own passkey.
 */
export async function DELETE(request: NextRequest) {
    try {
        const authResult = await requireAuth();
        if (!authResult.success) {
            return errorResponse(authResult.error || "Unauthorized", authResult.status || 401);
        }

        const userId = authResult.user.id;
        const body = await request.json();
        const { passkeyId } = body;

        if (!passkeyId) return errorResponse("Passkey ID is required.", 400);

        // Verify ownership before deleting
        const passkey = await prisma.webAuthnCredential.findUnique({
            where: { id: passkeyId },
        });

        if (!passkey || passkey.userId !== userId) {
            return errorResponse("Passkey not found.", 404);
        }

        await prisma.webAuthnCredential.delete({ where: { id: passkeyId } });

        return successResponse({ message: "Passkey removed successfully." });
    } catch (error: any) {
        console.error("[API] DELETE /api/auth/passkey/delete - Error:", error);
        return errorResponse("Failed to remove passkey.", 500);
    }
}
