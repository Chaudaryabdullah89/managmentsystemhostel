import { checkRole } from '@/lib/checkRole';
import { isServiceEnabled, hasPermission } from '@/lib/permissions';
import { NextResponse } from "next/server";
import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { sendEmail } from "@/lib/utils/sendmail";
import { monthlyRentEmail, buildEmailTemplate } from "@/lib/utils/emailTemplates";
import { prisma } from "@/lib/prisma";

const paymentServices = new PaymentServices();

export async function POST(request) {
    if (!await isServiceEnabled('enablePaymentProcessing')) {
        return NextResponse.json({ success: false, message: 'Payment processing is currently disabled.' }, { status: 503 });
    }

    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const currentUserId = auth.user.userId || auth.user.id;
    const isWarden = auth.user.role === 'WARDEN';
    const isAdmin = auth.user.role === 'ADMIN';

    try {
        const data = await request.json();

        // ── GRANULAR PERMISSION CHECK ─────────────────────────────────────
        // 1. If trying to create a payment for SOMEONE ELSE, require manage_payments
        if (data.userId && data.userId !== currentUserId) {
            if (!await hasPermission('manage_payments')) {
                return NextResponse.json({ success: false, message: "Forbidden: You cannot submit payments for other users without permission." }, { status: 403 });
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
                    return NextResponse.json({ success: false, error: "Access Denied: You cannot manage residents of other hostels." }, { status: 403 });
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
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
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
                select: { email: true, name: true }
            });

            const submitterName = paymentDetail?.User?.name || "A resident";
            const approvalLink = `${baseUrl}/admin/payment-approvals/${payment.id}`;

            if (await isServiceEnabled('enablePaymentEmails')) {
                for (const manager of managersToNotify) {
                    sendEmail({
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
                    }).catch(err => console.error("[Email] Admin payment notification failed:", err));
                }
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

                        sendEmail({
                            to: user.email,
                            subject: `Monthly Rent Due — ${monthName} ${year} — Mubarak Group of Hostels`,
                            html: monthlyRentEmail({
                                name: user.name,
                                amount: data.amount,
                                month: monthName,
                                year,
                                dueDate: data.dueDate || null,
                                hostelName: hostel?.name || null,
                                type: "RENT",
                            }),
                        }).catch(err => console.error("[Email] Monthly rent email failed:", err));
                    }
                }
            } catch (emailErr) {
                console.error("[Email] Error sending rent email:", emailErr);
            }
        }

        return NextResponse.json({ success: true, payment });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    const currentUserId = auth.user.userId || auth.user.id;
    const isAdmin = auth.user.role === 'ADMIN';

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'stats' or 'all'
        const hostelIdInput = searchParams.get('hostelId');
        const requestedUserId = searchParams.get('userId');

        // ── GRANULAR PERMISSION CHECK ─────────────────────────────────────
        // If viewing stats or other users' records, require permission
        const isSelfViewingOnly = requestedUserId === currentUserId && !type;
        
        if (!isSelfViewingOnly && !isAdmin) {
             const requiredPerm = type === 'stats' ? 'view_analytics' : 'view_payments';
             if (!await hasPermission(requiredPerm)) {
                 // Force filter to just their own records 
                 searchParams.set('userId', currentUserId);
                 searchParams.delete('type'); 
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
            return NextResponse.json({ success: true, stats });
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
        return NextResponse.json({ success: true, ...result });

    } catch (error) {
        console.error("API Error in Payments GET:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
