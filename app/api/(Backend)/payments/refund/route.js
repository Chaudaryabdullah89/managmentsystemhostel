import { NextResponse } from "next/server";
import PaymentServices from "@/lib/services/paymentservices/paymentservices";

const paymentServices = new PaymentServices();

export async function POST(request) {
    try {
        const data = await request.json();

        if (!data.paymentId || !data.userId || !data.reason) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        const refundRequest = await paymentServices.requestRefund(data);

        return NextResponse.json({ success: true, refundRequest });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
