export const dynamic = 'force-dynamic';
import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { sendEmail } from "@/lib/utils/sendmail";
import { paymentApprovedEmail, buildEmailTemplate } from "@/lib/utils/emailTemplates";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { logAuditEvent } from "@/lib/auditLogger";
import { createInAppNotification } from "@/lib/inAppNotifications";
import { logNotificationDelivery } from "@/lib/notificationTelemetry";
import { isValidPaymentTransition, normalizePaymentStatusInput } from "@/lib/statusTransitions";
import { getBranding } from "@/lib/permissions";

const paymentServices = new PaymentServices();

export async function GET(request, { params }) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const { paymentId } = await params;
        const payment = await paymentServices.getPaymentById(paymentId);
        if (!payment) return errorResponse("Payment node not found", 404, { error: "Payment node not found" });

        // Security: If warden, verify payment belongs to their hostel
        if (auth.user.role === 'WARDEN') {
            let wardenHostelId = auth.user.hostelId;
            if (!wardenHostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = wardenProfile?.hostelId;
            }

            const paymentHostelId = payment.Booking?.Room?.hostelId || payment.User?.hostelId;
            if (wardenHostelId && paymentHostelId && paymentHostelId !== wardenHostelId) {
                return errorResponse("Access Denied: Payment belongs to another hostel.", 403, { error: "Access Denied: Payment belongs to another hostel." });
            }
        }

        return successResponse({ payment });
    } catch (error) {
        return errorResponse(error.message, 500, { error: error.message });
    }
}

export async function PATCH(request, { params }) {
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const { paymentId } = await params;
        const existingPayment = await prisma.payment.findUnique({
            where: { id: paymentId },
            select: {
                id: true,
                status: true,
                amount: true,
                userId: true,
                bookingId: true,
                Booking: { select: { Room: { select: { hostelId: true } } } },
                User: { select: { role: true } },
            },
        });
        if (!existingPayment) return errorResponse("Payment not found", 404, { error: "Payment not found" });

        // Security: If warden, verify payment belongs to their hostel before update
        if (auth.user.role === 'WARDEN') {
            const payment = await prisma.payment.findUnique({
                where: { id: paymentId },
                include: {
                    Booking: { include: { Room: true } },
                    User: true
                }
            });

            if (!payment) return errorResponse("Payment not found", 404, { error: "Payment not found" });

            let wardenHostelId = auth.user.hostelId;
            if (!wardenHostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = wardenProfile?.hostelId;
            }

            const paymentHostelId = payment.Booking?.Room?.hostelId || payment.User?.hostelId;
            if (wardenHostelId && paymentHostelId && paymentHostelId !== wardenHostelId) {
                return errorResponse("Access Denied: You cannot update payments from other hostels.", 403, { error: "Access Denied: You cannot update payments from other hostels." });
            }
        }

        const body = await request.json();
        const { status, notes, amount, type, method, receiptUrl } = body;
        const normalizedStatus = normalizePaymentStatusInput(status);
        if (normalizedStatus && !isValidPaymentTransition(existingPayment.status, normalizedStatus)) {
            return errorResponse(
                `Invalid payment status transition from ${existingPayment.status} to ${normalizedStatus}`,
                409,
                { error: "Invalid payment status transition" }
            );
        }

        // Build update data dynamically
        const updateData = {};
        if (normalizedStatus !== undefined) updateData.status = normalizedStatus;
        if (notes !== undefined) updateData.notes = notes;
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (type !== undefined) updateData.type = type;
        if (method !== undefined) updateData.method = method;
        if (receiptUrl !== undefined) updateData.receiptUrl = receiptUrl;
        updateData.updatedAt = new Date();

        const payment = await paymentServices.updatePayment(paymentId, updateData);
        const hostelName = payment.Booking?.Room?.Hostel?.name
            || payment.User?.Hostel_User_hostelIdToHostel?.name
            || "Hostel";
        const branding = await getBranding();

        // ── APPROVED: Email the resident ─────────────────────────────────
        if (normalizedStatus === "PAID") {
            if (payment?.User?.email) {
                try {
                    await sendEmail({
                        to: payment.User.email,
                        subject: `Payment Approved ✅ — ${branding.companyName}`,
                        html: paymentApprovedEmail({
                            name: payment.User.name,
                            paymentId: payment.uid || paymentId,
                            amount: payment.amount,
                            type: payment.type,
                            method: payment.method || method,
                            hostelName,
                            date: payment.updatedAt,
                            branding,
                        }),
                    });
                    await logNotificationDelivery({
                        channel: "EMAIL",
                        event: "PAYMENT_APPROVED",
                        recipient: payment.User.email,
                        status: "DELIVERED",
                        actorId: auth.user?.id || auth.user?.userId || auth.user?.sub || null,
                        metadata: { paymentId: payment.uid || paymentId },
                    });
                } catch (err) {
                    await logNotificationDelivery({
                        channel: "EMAIL",
                        event: "PAYMENT_APPROVED",
                        recipient: payment.User.email,
                        status: "FAILED",
                        actorId: auth.user?.id || auth.user?.userId || auth.user?.sub || null,
                        metadata: { paymentId: payment.uid || paymentId },
                        error: err,
                    });
                    console.error("[Email] Payment approved email failed:", err);
                }
            }
        }

        // ── REJECTED: Email the resident with reason ─────────────────────
        if (normalizedStatus === "REJECTED") {
            if (payment?.User?.email) {
                try {
                    await sendEmail({
                        to: payment.User.email,
                        subject: `Payment Rejected ❌ — ${branding.companyName}`,
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
                            branding,
                        }),
                    });
                    await logNotificationDelivery({
                        channel: "EMAIL",
                        event: "PAYMENT_REJECTED",
                        recipient: payment.User.email,
                        status: "DELIVERED",
                        actorId: auth.user?.id || auth.user?.userId || auth.user?.sub || null,
                        metadata: { paymentId: payment.uid || paymentId },
                    });
                } catch (err) {
                    await logNotificationDelivery({
                        channel: "EMAIL",
                        event: "PAYMENT_REJECTED",
                        recipient: payment.User.email,
                        status: "FAILED",
                        actorId: auth.user?.id || auth.user?.userId || auth.user?.sub || null,
                        metadata: { paymentId: payment.uid || paymentId },
                        error: err,
                    });
                    console.error("[Email] Payment rejection email failed:", err);
                }
            }
        }

        if (normalizedStatus && normalizedStatus !== existingPayment.status) {
            await logAuditEvent({
                action: "PAYMENT_STATUS_UPDATE",
                actorId: auth.user?.id || auth.user?.userId || auth.user?.sub,
                actorRole: auth.user?.role,
                targetType: "PAYMENT",
                targetId: paymentId,
                metadata: {
                    previousStatus: existingPayment.status,
                    newStatus: normalizedStatus,
                    amount: existingPayment.amount,
                    bookingId: existingPayment.bookingId,
                    userId: existingPayment.userId,
                },
            });

            if (normalizedStatus === "PAID" || normalizedStatus === "REJECTED") {
                await createInAppNotification({
                    title: normalizedStatus === "PAID" ? "Payment approved" : "Payment rejected",
                    content: normalizedStatus === "PAID"
                        ? "Your submitted payment has been approved."
                        : "Your submitted payment was rejected. Please review details and resubmit if needed.",
                    priority: normalizedStatus === "REJECTED" ? "HIGH" : "MEDIUM",
                    category: "PAYMENT",
                    targetRoles: existingPayment.User?.role ? [existingPayment.User.role] : ["RESIDENT", "GUEST"],
                    hostelId: existingPayment.Booking?.Room?.hostelId || null,
                    actorId: auth.user?.id || auth.user?.userId || auth.user?.sub || null,
                });
            }
        }

        return successResponse({ payment });
    } catch (error) {
        return errorResponse(error.message, 500, { error: error.message });
    }
}

export async function DELETE(request, { params }) {
    const guard = await requireRoles(['ADMIN']);
    if (!guard.ok) return guard.response;

    try {
        const { paymentId } = await params;
        await paymentServices.deletePayment(paymentId);
        return successResponse({ message: "Payment deleted successfully" });
    } catch (error) {
        return errorResponse(error.message, 500, { error: error.message });
    }
}
