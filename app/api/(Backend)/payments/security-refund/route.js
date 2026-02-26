import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import PaymentServices from "@/lib/services/paymentservices/paymentservices";

const paymentServices = new PaymentServices();

export async function POST(request) {
    const auth = await checkRole([]);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const { bookingId, amount, notes } = await request.json();

        if (!bookingId || !amount) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const payment = await paymentServices.refundSecurity(bookingId, parseFloat(amount), notes);

        return NextResponse.json({ success: true, payment });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
