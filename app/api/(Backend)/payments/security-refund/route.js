import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { withIdempotency } from "@/lib/idempotency";

const paymentServices = new PaymentServices();

export async function POST(request) {
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const { bookingId, amount, notes } = await request.json();
        const idempotencyKey = request.headers.get("idempotency-key") || request.headers.get("x-idempotency-key");

        if (!bookingId || !amount) {
            return errorResponse("Missing required fields", 400);
        }

        const { result: payment, replayed } = await withIdempotency({
            scope: "payments:security-refund",
            userId: auth.user.userId || auth.user.id || auth.user.sub,
            requestKey: idempotencyKey,
            action: async () => await paymentServices.refundSecurity(bookingId, parseFloat(amount), notes),
        });

        return successResponse({ payment, replayed });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
