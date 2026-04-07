import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function PATCH(request, { params }) {
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) return guard.response;
    try {
        // Await params object for Next.js 15+ compatibility
        const { id } = await params;
        const data = await request.json();

        const refundRequest = await prisma.$transaction(async (tx) => {
            const currentRequest = await tx.refundRequest.findUnique({
                where: { id },
                include: { Payment: true }
            });

            if (!currentRequest) return null;

            // Update Refund Request
            const updated = await tx.refundRequest.update({
                where: { id },
                data: {
                    status: data.status,
                    notes: data.notes,
                    updatedAt: new Date()
                }
            });

            // If COMPLETED, update the payment status to REFUNDED
            if (data.status === "COMPLETED") {
                await tx.payment.update({
                    where: { id: currentRequest.paymentId },
                    data: { status: "REFUNDED" }
                });
            }

            return updated;
        });
        if (!refundRequest) {
            return errorResponse("Refund request not found", 404, { error: "Refund request not found" });
        }

        return successResponse({ refundRequest });
    } catch (error) {
        return errorResponse(error.message, 500, { error: error.message });
    }
}
