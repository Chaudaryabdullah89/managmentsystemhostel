import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { sendEmail } from "@/lib/utils/sendmail";
import { paymentApprovedEmail } from "@/lib/utils/emailTemplates";
import { prisma } from "@/lib/prisma";

const paymentServices = new PaymentServices();

export async function GET(request, { params }) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { paymentId } = await params;
        const payment = await paymentServices.getPaymentById(paymentId);
        if (!payment) return NextResponse.json({ success: false, error: "Payment node not found" }, { status: 404 });
        return NextResponse.json({ success: true, payment });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(request, { params }) {
    try {
        const { paymentId } = await params;
        const body = await request.json();
        const { status, notes, amount, type, method } = body;

        // Build update data dynamically
        const updateData = {};
        if (status !== undefined) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (type !== undefined) updateData.type = type;
        if (method !== undefined) updateData.method = method;
        updateData.updatedAt = new Date();

        const payment = await paymentServices.updatePayment(paymentId, updateData);

        // Send email when payment is approved/paid
        if (status === "PAID" || status === "APPROVED" || status === "COMPLETED") {
            try {
                // Fetch user details for the email
                const fullPayment = await prisma.payment.findUnique({
                    where: { id: paymentId },
                    include: {
                        user: { select: { name: true, email: true } },
                        Hostel_Payment_hostelIdToHostel: { select: { name: true } },
                    },
                });

                if (fullPayment?.user?.email) {
                    sendEmail({
                        to: fullPayment.user.email,
                        subject: "Payment Approved — GreenView Hostels",
                        html: paymentApprovedEmail({
                            name: fullPayment.user.name,
                            paymentId: fullPayment.uid || paymentId,
                            amount: fullPayment.amount,
                            type: fullPayment.type,
                            method: fullPayment.method || method,
                            hostelName: fullPayment.Hostel_Payment_hostelIdToHostel?.name,
                            date: fullPayment.updatedAt,
                        }),
                    }).catch(err => console.error("[Email] Payment approved email failed:", err));
                }
            } catch (emailErr) {
                console.error("[Email] Error fetching payment details for email:", emailErr);
            }
        }

        return NextResponse.json({ success: true, payment });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { paymentId } = await params;
        await paymentServices.deletePayment(paymentId);
        return NextResponse.json({ success: true, message: "Payment deleted successfully" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
