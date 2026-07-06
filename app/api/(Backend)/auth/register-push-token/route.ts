import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function POST(req: NextRequest) {
    try {
        const guard = await requireAuth();
        if (!guard.ok) return guard.response;
        
        const userId = guard.user.id;
        const body = await req.json();
        const { pushToken } = body;

        if (!pushToken) {
            return errorResponse("Push token is required", 400);
        }

        await prisma.user.update({
            where: { id: userId },
            data: { pushToken }
        });

        return successResponse({
            message: "Push token registered successfully",
        });
    } catch (err: any) {
        console.error("[register-push-token] Error:", err);
        return errorResponse("Internal server error", 500);
    }
}
