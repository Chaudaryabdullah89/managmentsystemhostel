import ComplaintServices from "@/lib/services/complaintservices/complaintservices";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

const complaintServices = new ComplaintServices();

export async function POST(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;

    try {
        const body = await request.json();
        const { complaintId, message } = body;
        const activeUserId = guard.user.id || guard.user.userId;

        if (!complaintId || !activeUserId || !message) {
            return errorResponse("Missing required fields", 400);
        }

        const comment = await complaintServices.addComment({ complaintId, userId: activeUserId, message });
        return successResponse({ data: comment });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
