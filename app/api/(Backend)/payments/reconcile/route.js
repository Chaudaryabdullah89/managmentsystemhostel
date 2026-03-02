import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import PaymentServices from "@/lib/services/paymentservices/paymentservices";

const paymentServices = new PaymentServices();

export async function POST(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { bookingId, amount, userId, method, notes } = await request.json();

        if (!bookingId || !amount || !userId) {
            return NextResponse.json({ success: false, error: "Missing required reconciliation parameters." }, { status: 400 });
        }

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
            const resident = await prisma.user.findUnique({
                where: { id: userId },
                select: { hostelId: true }
            });

            if (resident && resident.hostelId !== wardenHostelId) {
                return NextResponse.json({ success: false, error: "Access Denied: You cannot reconcile payments for residents of other hostels." }, { status: 403 });
            }
        }

        const result = await paymentServices.reconcileBookingPayments(
            bookingId,
            amount,
            userId,
            method,
            notes
        );

        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
