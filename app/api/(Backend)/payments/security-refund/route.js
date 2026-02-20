import { NextResponse } from "next/server";
import PaymentServices from "@/lib/services/paymentservices/paymentservices";

const paymentServices = new PaymentServices();

export async function POST(request) {
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
