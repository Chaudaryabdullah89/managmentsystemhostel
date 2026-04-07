import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { withIdempotency } from "@/lib/idempotency";

const paymentServices = new PaymentServices();

export async function POST(request) {
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const { bookingId, amount, userId, method, notes } = await request.json();
        const idempotencyKey = request.headers.get("idempotency-key") || request.headers.get("x-idempotency-key");

        if (!bookingId || !amount || !userId) {
            return errorResponse("Missing required reconciliation parameters.", 400);
        }

        // Security: If warden, verify context
        if (auth.user.role === 'WARDEN') {
            let wardenHostelId = auth.user.hostelId;
            if (!wardenHostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = wardenProfile?.hostelId;
            }

            // Verify the resident belongs to warden's hostel
            const resident = await prisma.user.findUnique({
                where: { id: userId },
                select: { hostelId: true }
            });

            if (resident && resident.hostelId !== wardenHostelId) {
                return errorResponse("Access Denied: You cannot reconcile payments for residents of other hostels.", 403);
            }
        }

        const { result, replayed } = await withIdempotency({
            scope: "payments:reconcile",
            userId: auth.user.userId || auth.user.id || auth.user.sub,
            requestKey: idempotencyKey,
            action: async () => {
                return await paymentServices.reconcileBookingPayments(
                    bookingId,
                    amount,
                    userId,
                    method,
                    notes
                );
            },
        });

        return successResponse({ ...result, replayed });
    } catch (error) {
        return errorResponse(error.message, 500);
    }
}
