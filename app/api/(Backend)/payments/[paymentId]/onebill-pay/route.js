export const dynamic = 'force-dynamic';
import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { sendEmail } from "@/lib/utils/sendmail";
import { paymentApprovedEmail } from "@/lib/utils/emailTemplates";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getBranding } from "@/lib/permissions";
import { logNotificationDelivery } from "@/lib/notificationTelemetry";

const paymentServices = new PaymentServices();

// ── Config validation (runs when LIVE MODE is on) ─────────────────────────────
function validateLiveConfig() {
    const errors = [];
    if (!process.env.ONEBILL_API_USERNAME)
        errors.push("ONEBILL_API_USERNAME is not set in .env");
    if (!process.env.ONEBILL_API_PASSWORD)
        errors.push("ONEBILL_API_PASSWORD is not set in .env");
    if (!process.env.ONEBILL_API_URL)
        errors.push("ONEBILL_API_URL is not set in .env");
    if (!process.env.ONEBILL_PREFIX)
        errors.push("ONEBILL_PREFIX is not set in .env");
    return errors;
}

export async function POST(request, { params }) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    const isLiveMode = process.env.ONEBILL_LIVE_MODE === "true";

    // ── LIVE MODE: validate config first before doing anything ────────────────
    if (isLiveMode) {
        const configErrors = validateLiveConfig();
        if (configErrors.length > 0) {
            console.error("[1Bill] ❌ Live mode enabled but config is incomplete:", configErrors);
            return errorResponse(
                `1Bill configuration incomplete. Fix these in your .env:\n• ${configErrors.join("\n• ")}`,
                503
            );
        }
    }

    try {
        const { paymentId } = await params;
        const existingPayment = await prisma.payment.findUnique({
            where: { id: paymentId },
            select: {
                id: true,
                status: true,
                amount: true,
                userId: true,
                oneBillInvoiceId: true
            }
        });

        if (!existingPayment) {
            return errorResponse("Payment record not found", 404);
        }

        // Security check: Guest can only pay their own payments
        const isGuest = ['GUEST', 'RESIDENT'].includes(auth.user.role);
        if (isGuest) {
            const callerId = auth.user.userId || auth.user.id || auth.user.sub;
            if (existingPayment.userId !== callerId) {
                return errorResponse("Access Denied: You can only pay your own invoices.", 403);
            }
        }

        if (existingPayment.status === "PAID") {
            return errorResponse("This payment has already been paid.", 400);
        }

        if (!existingPayment.oneBillInvoiceId) {
            return errorResponse("This payment has no 1Bill invoice ID assigned yet.", 400);
        }

        // ── LIVE MODE: In real 1Link flow, payments come via banking apps ─────
        // The guest opens EasyPaisa/JazzCash and pays using the consumer number.
        // 1Link then calls our webhook. This endpoint is only for the simulation button.
        if (isLiveMode) {
            return errorResponse(
                "LIVE MODE is active. Payment must be made through your banking app (EasyPaisa, JazzCash, HBL) using the 18-digit invoice number. The system will auto-update when 1Link confirms your payment.",
                400
            );
        }

        // ── SIMULATION MODE: settle instantly (for dev/testing only) ──────────
        const mockTxId = `1BILL-SIM-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

        const updateData = {
            status: "PAID",
            method: "ONLINE",
            transactionId: mockTxId,
            notes: `[SIMULATED] Paid Online via 1Bill. Ref: ${existingPayment.oneBillInvoiceId}`,
            updatedAt: new Date()
        };

        const payment = await paymentServices.updatePayment(paymentId, updateData);
        const hostelName = payment.Booking?.Room?.Hostel?.name
            || payment.User?.Hostel_User_hostelIdToHostel?.name
            || "Hostel Branch";
        const branding = await getBranding();

        if (payment?.User?.email) {
            try {
                await sendEmail({
                    to: payment.User.email,
                    subject: `Payment Confirmed ✅ — ${branding.companyName}`,
                    html: paymentApprovedEmail({
                        name: payment.User.name,
                        paymentId: payment.uid || paymentId,
                        amount: payment.amount,
                        type: payment.type,
                        method: "1Bill Online (Simulated)",
                        hostelName,
                        date: payment.updatedAt,
                        branding
                    })
                });
                await logNotificationDelivery({
                    channel: "EMAIL",
                    event: "PAYMENT_APPROVED",
                    recipient: payment.User.email,
                    status: "DELIVERED",
                    actorId: auth.user?.id || auth.user?.userId || auth.user?.sub || null,
                    metadata: { paymentId: payment.uid || paymentId, source: "1BILL_SIMULATION" }
                });
            } catch (err) {
                console.error("[1Bill Sim] Confirmation email failed:", err);
            }
        }

        return successResponse({
            success: true,
            message: "Payment completed successfully (simulation)",
            payment,
            simulated: true
        });

    } catch (error) {
        console.error("1Bill Payment endpoint error:", error);
        return errorResponse(error.message, 500);
    }
}
