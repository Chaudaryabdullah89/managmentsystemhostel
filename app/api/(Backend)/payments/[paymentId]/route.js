import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { sendEmail } from "@/lib/utils/sendmail";
import { paymentApprovedEmail, buildEmailTemplate } from "@/lib/utils/emailTemplates";
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
        const { status, notes, amount, type, method, receiptUrl } = body;

        // Build update data dynamically
        const updateData = {};
        if (status !== undefined) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (type !== undefined) updateData.type = type;
        if (method !== undefined) updateData.method = method;
        if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;
        updateData.updatedAt = new Date();

        const payment = await paymentServices.updatePayment(paymentId, updateData);
        const hostelName = payment.Booking?.Room?.Hostel?.name
            || payment.User?.Hostel_User_hostelIdToHostel?.name
            || "GreenView Hostels";

        // ── APPROVED: Email the resident ─────────────────────────────────
        if (status === "PAID" || status === "APPROVED" || status === "COMPLETED") {
            if (payment?.User?.email) {
                sendEmail({
                    to: payment.User.email,
                    subject: "Payment Approved ✅ — GreenView Hostels",
                    html: paymentApprovedEmail({
                        name: payment.User.name,
                        paymentId: payment.uid || paymentId,
                        amount: payment.amount,
                        type: payment.type,
                        method: payment.method || method,
                        hostelName,
                        date: payment.updatedAt,
                    }),
                }).catch(err => console.error("[Email] Payment approved email failed:", err));
            }
        }

        // ── REJECTED: Email the resident with reason ─────────────────────
        if (status === "REJECTED") {
            if (payment?.User?.email) {
                sendEmail({
                    to: payment.User.email,
                    subject: "Payment Rejected ❌ — GreenView Hostels",
                    html: buildEmailTemplate({
                        title: "Payment Not Approved",
                        subtitle: `Hello ${payment.User.name}, your payment submission was reviewed and could not be approved at this time.`,
                        bodyHtml: `
                            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
                                <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;">Payment Ref</td><td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">${(payment.uid || paymentId).toString().slice(-10).toUpperCase()}</td></tr>
                                <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;">Amount</td><td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">PKR ${Number(payment.amount).toLocaleString()}</td></tr>
                                <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;">Hostel</td><td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">${hostelName}</td></tr>
                            </table>
                            ${notes ? `<div style="background:#fff4f4;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;margin-top:8px;">
                                <p style="margin:0;font-size:12px;font-weight:600;color:#dc2626;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Rejection Reason</p>
                                <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">${notes}</p>
                            </div>` : ''}
                            <p style="margin-top:16px;font-size:12px;color:#6b7280;">Please resubmit with a correct payment receipt or contact your hostel management office for assistance.</p>
                        `,
                    }),
                }).catch(err => console.error("[Email] Payment rejection email failed:", err));
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
