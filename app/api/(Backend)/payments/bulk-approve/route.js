import { checkRole } from '@/lib/checkRole';
import { NextResponse } from "next/server";
import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { prisma } from "@/lib/prisma";

const paymentServices = new PaymentServices();

export async function POST(request) {
    const auth = await checkRole(['ADMIN', 'SUPERADMIN', 'ACCOUNTANT']);
    if (!auth.success) return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });

    try {
        const body = await request.json();
        const { paymentIds } = body;

        if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
            return NextResponse.json({ success: false, error: "No payments selected" }, { status: 400 });
        }

        const adminId = "admin"; // In a real system, get this from auth context/session

        const results = await paymentServices.bulkApprovePayments(paymentIds, adminId);

        return NextResponse.json({ success: true, message: `Successfully approved ${results.count} payments.` });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
