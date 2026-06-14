import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth();
        if (!authResult.success) {
            return errorResponse(authResult.error || "Unauthorized", authResult.status || 401);
        }

        const userId = authResult.user.id;

        // Disable 2FA
        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: false, twoFactorSecret: null }
        });

        return successResponse({
            message: "Two-Factor Authentication has been successfully disabled.",
        });

    } catch (error: any) {
        console.error("[API] POST /api/auth/2fa/disable - Error:", error);
        return errorResponse("Failed to disable 2FA.", 500);
    }
}
