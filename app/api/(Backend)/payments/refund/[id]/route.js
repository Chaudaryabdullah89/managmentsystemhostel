import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        const data = await request.json();

        const refundRequest = await prisma.$transaction(async (tx) => {
            const currentRequest = await tx.refundRequest.findUnique({
                where: { id },
                include: { Payment: true }
            });

            if (!currentRequest) throw new Error("Refund request not found");

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

        return NextResponse.json({ success: true, refundRequest });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
