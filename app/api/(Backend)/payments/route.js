import { NextResponse } from "next/server";
import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { sendEmail } from "@/lib/utils/sendmail";
import { monthlyRentEmail } from "@/lib/utils/emailTemplates";
import { prisma } from "@/lib/prisma";

const paymentServices = new PaymentServices();

export async function POST(request) {
    try {
        const data = await request.json();
        const payment = await paymentServices.createPayment(data);

        // Send email if this is a monthly rent payment
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
