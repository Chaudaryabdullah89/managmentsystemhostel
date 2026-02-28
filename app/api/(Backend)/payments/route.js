import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { sendEmail } from "@/lib/utils/sendmail";
import { monthlyRentEmail, buildEmailTemplate } from "@/lib/utils/emailTemplates";
import { prisma } from "@/lib/prisma";

const paymentServices = new PaymentServices();

export async function POST(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const data = await request.json();
        const payment = await paymentServices.createPayment(data);

        // ── NOTIFY ADMIN & WARDENS: A new payment needs approval ─────────
        try {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
            const managersToNotify = await prisma.user.findMany({
                where: {
                    role: { in: ["ADMIN", "WARDEN"] },
                    isActive: true,
                    email: { not: null }
                },
                select: { email: true, name: true }
            });

            const submitterUser = data.userId
                ? await prisma.user.findUnique({ where: { id: data.userId }, select: { name: true } })
                : null;

            const submitterName = submitterUser?.name || "A resident";
            const approvalLink = `${baseUrl}/admin/payment-approvals/${payment.id}`;

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

                    if (user?.email) {
                        const now = new Date();
                        const monthName = now.toLocaleString("en-PK", { month: "long" });
                        const year = now.getFullYear();

                        sendEmail({
                            to: user.email,
                            subject: `Monthly Rent Due — ${monthName} ${year} — GreenView Hostels`,
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

    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'stats' or 'all'

        if (type === 'stats') {
            const hostelId = searchParams.get('hostelId');
            const stats = await paymentServices.getFinancialStats(hostelId);
            return NextResponse.json({ success: true, stats });
        }

        const filters = {
            status: searchParams.get('status'),
            hostelId: searchParams.get('hostelId'),
            search: searchParams.get('search'),
            userId: searchParams.get('userId'),
            page: parseInt(searchParams.get('page')) || 1,
            limit: parseInt(searchParams.get('limit')) || 10
        };

        const result = await paymentServices.getAllPayments(filters);
        return NextResponse.json({ success: true, ...result });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
