import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { withIdempotency } from "@/lib/idempotency";

const paymentServices = new PaymentServices();

export async function POST(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const data = await request.json();
        const idempotencyKey = request.headers.get("idempotency-key") || request.headers.get("x-idempotency-key");

        if (!data.paymentId || !data.userId || !data.reason) {
            return errorResponse("Missing required fields", 400, { error: "Missing required fields" });
        }
        const currentUserId = auth.user.userId || auth.user.id;
        const isAdmin = auth.user.role === "ADMIN";
        if (!isAdmin && data.userId !== currentUserId) {
            return errorResponse("Forbidden: You can only request refunds for your own account.", 403, {
                error: "Forbidden: You can only request refunds for your own account."
            });
        }

        const { result: refundRequest, replayed } = await withIdempotency({
            scope: "payments:refund-request",
            userId: auth.user.userId || auth.user.id || auth.user.sub,
            requestKey: idempotencyKey,
            action: async () => await paymentServices.requestRefund(data),
        });

        return successResponse({ refundRequest, replayed });
    } catch (error) {
        return errorResponse(error.message, 500, { error: error.message });
    }
}
