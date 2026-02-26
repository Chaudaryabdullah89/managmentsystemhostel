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
