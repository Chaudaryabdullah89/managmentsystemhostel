import { isServiceEnabled, hasPermission } from '@/lib/permissions';
import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { sendEmail } from "@/lib/utils/sendmail";
import { monthlyRentEmail, buildEmailTemplate, getBaseUrl } from "@/lib/utils/emailTemplates";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { getBranding } from "@/lib/permissions";

const paymentServices = new PaymentServices();

export async function POST(request) {
    if (!await isServiceEnabled('enablePaymentProcessing')) {
        return errorResponse('Payment processing is currently disabled.', 503);
    }

    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    const currentUserId = auth.user.userId || auth.user.id;

    try {
        const data = await request.json();

        // ── GRANULAR PERMISSION CHECK ─────────────────────────────────────
        // 1. If trying to create a payment for SOMEONE ELSE, require manage_payments
        if (data.userId && data.userId !== currentUserId) {
            if (!await hasPermission('manage_payments')) {
                return errorResponse("Forbidden: You cannot submit payments for other users without permission.", 403);
            }
        }
        
        // 2. If it's a general management action (like creating a deposit), also check
        // (but keep it simple: if they own the record, they can POST proof)

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
            if (data.userId) {
                const resident = await prisma.user.findUnique({
                    where: { id: data.userId },
                    select: { hostelId: true }
                });
                if (resident && resident.hostelId !== wardenHostelId) {
                    return errorResponse("Access Denied: You cannot manage residents of other hostels.", 403, { error: "Access Denied: You cannot manage residents of other hostels." });
                }
            }
        }

        const payment = await paymentServices.createPayment(data);

        // Fetch payment details to get hostelId safely
        const paymentDetail = await prisma.payment.findUnique({
            where: { id: payment.id },
            include: {
                Booking: { include: { Room: true } },
                User: true
            }
        });

        const paymentHostelId = paymentDetail?.Booking?.Room?.hostelId || paymentDetail?.User?.hostelId;

        // ── NOTIFY ADMIN & WARDENS: A new payment needs approval ─────────
        try {
            const baseUrl = getBaseUrl();
            const managersToNotify = await prisma.user.findMany({
                where: {
                    role: { in: ["ADMIN", "WARDEN"] },
                    isActive: true,
                    email: { not: null },
                    // Targeted Notifications: Admin sees all, Wardens see only their hostel
                    OR: [
                        { role: "ADMIN" },
                        { AND: [{ role: "WARDEN" }, { hostelId: paymentHostelId }] }
                    ]
                },
                select: { email: true, name: true, role: true }
            });

            const submitterName = paymentDetail?.User?.name || "A resident";

            if (await isServiceEnabled('enablePaymentEmails')) {
                const emailPromises = managersToNotify.map(manager => {
                    const isWarden = manager.role === "WARDEN";
                    const approvalLink = isWarden 
                        ? `${baseUrl}/warden/payments/${payment.id}` 
                        : `${baseUrl}/admin/payment-approvals/${payment.id}`;
                    return sendEmail({
                        to: manager.email,
                        subject: `💳 New Payment Submitted — Approval Required`,
                        html: buildEmailTemplate({
                            title: "New Payment Awaiting Approval",
                            subtitle: `Hello ${manager.name}, a new payment has been submitted and requires your review.`,
                            bodyHtml: `
                                <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:16px;">
                                    <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;">Submitted By</td><td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">${submitterName}</td></tr>
                                    <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;">Amount</td><td style="padding:6px 0;color:#111827;font-size:13px;font-weight:700;text-align:right;color:#2563eb;">PKR ${Number(data.amount).toLocaleString()}</td></tr>
                                    <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;">Type</td><td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">${data.type || "RENT"}</td></tr>
                                    <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;">Method</td><td style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;text-align:right;">${data.method || "CASH"}</td></tr>
                                </table>
                                <div style="text-align:center;margin:20px 0 4px;">
                                    <a href="${approvalLink}" style="display:inline-block;padding:11px 24px;border-radius:999px;background:#2563eb;color:#ffffff;font-size:13px;font-weight:600;text-decoration:none;">
                                        Review &amp; Approve Payment →
                                    </a>
                                </div>
                            `,
                        }),
                    });
                });
                
                Promise.allSettled(emailPromises)
                    .then(results => {
                        const failures = results.filter(r => r.status === 'rejected');
                        if (failures.length > 0) {
                            console.error(`[Email] ${failures.length} admin payment notifications failed.`);
                        }
                    });
            }
        } catch (notifyErr) {
            console.error("[Email] Error notifying admins of new payment:", notifyErr);
        }

        // ── NOTIFY RESIDENT: Rent invoice generated ──────────────────────
        if (data.type === "RENT" || data.type === "MONTHLY_RENT") {
            try {
                const userId = data.userId;
                if (userId) {
                    const user = await prisma.user.findUnique({
                        where: { id: userId },
                        select: { name: true, email: true },
                    });
                    const hostel = data.hostelId
                        ? await prisma.hostel.findUnique({ where: { id: data.hostelId }, select: { name: true } })
                        : null;

                    if (user?.email && await isServiceEnabled('enablePaymentEmails')) {
                        const now = new Date();
                        const monthName = now.toLocaleString("en-PK", { month: "long" });
                        const year = now.getFullYear();
                        const branding = await getBranding();

                        sendEmail({
                            to: user.email,
                            subject: `Monthly Rent Due — ${monthName} ${year} — ${branding.companyName}`,
                            html: monthlyRentEmail({
                                name: user.name,
                                amount: data.amount,
                                month: monthName,
                                year,
                                dueDate: data.dueDate || null,
                                hostelName: hostel?.name || null,
                                type: "RENT",
                                branding,
                            }),
                        }).catch(err => console.error("[Email] Monthly rent email failed:", err));
                    }
                }
            } catch (emailErr) {
                console.error("[Email] Error sending rent email:", emailErr);
            }
        }

        return successResponse({ payment });
    } catch (error) {
        return errorResponse(error.message, 500, { error: error.message });
    }
}

export async function GET(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    const currentUserId = auth.user.userId || auth.user.id;
    const isAdmin = auth.user.role === 'ADMIN';

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'stats' or 'all'
        const hostelIdInput = searchParams.get('hostelId');
        const requestedUserId = searchParams.get('userId');

        // ── GRANULAR PERMISSION CHECK ─────────────────────────────────────
        // If viewing stats or other users' records, require permission.
        // NOTE: `type` is a const — mutating searchParams does NOT affect it,
        // so we must use an early return instead of the old mutation-based approach.
        const isSelfViewingOnly = requestedUserId === currentUserId && !type;

        if (!isSelfViewingOnly && !isAdmin) {
            const requiredPerm = type === 'stats' ? 'view_analytics' : 'view_payments';
            if (!await hasPermission(requiredPerm)) {
                if (type === 'stats') {
                    return errorResponse("Forbidden: You do not have permission to view financial statistics.", 403);
                }
                // For non-stats: restrict to own records only (handled by userId filter below)
                searchParams.set('userId', currentUserId);
            }
        }

        const sanitize = (val) => (val === 'all' || val === 'null' || val === 'undefined' || !val) ? null : val;
        let hostelId = sanitize(hostelIdInput);

        // Security: Wardens can ONLY see their assigned hostel's payments
        if (auth.user.role === 'WARDEN') {
            let wardenHostelId = auth.user.hostelId;

            // Fallback: If missing in JWT, fetch from DB
            if (!wardenHostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                wardenHostelId = wardenProfile?.hostelId;
            }

            if (!hostelId) {
                hostelId = wardenHostelId;
            } else if (hostelId !== wardenHostelId) {
                hostelId = wardenHostelId;
            }
        }

        if (type === 'stats') {
            const stats = await paymentServices.getFinancialStats(hostelId);
            return successResponse({ stats });
        }

        const filters = {
            status: searchParams.get('status'),
            hostelId: hostelId,
            search: searchParams.get('search'),
            userId: searchParams.get('userId'),
            page: parseInt(searchParams.get('page')) || 1,
            limit: parseInt(searchParams.get('limit')) || 10
        };

        const result = await paymentServices.getAllPayments(filters);
        return successResponse({ ...result });

    } catch (error) {
        console.error("API Error in Payments GET:", error);
        return errorResponse(error.message, 500, { error: error.message });
    }
}
