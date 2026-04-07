import { NextResponse } from "next/server";
import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { requireRoles } from "@/lib/apiAuth";

const paymentServices = new PaymentServices();

export async function POST(request) {
    const guard = await requireRoles(['ADMIN']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const body = await request.json();
        const { paymentIds } = body;

        if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
            return NextResponse.json({ success: false, error: "No payments selected" }, { status: 400 });
        }

        const adminId = auth.user?.id || auth.user?.userId || auth.user?.sub;

        const results = await paymentServices.bulkApprovePayments(paymentIds, adminId);

        return NextResponse.json({ success: true, message: `Successfully approved ${results.count} payments.` });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
