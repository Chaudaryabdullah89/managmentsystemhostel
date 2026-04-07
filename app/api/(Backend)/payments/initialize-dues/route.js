import { NextResponse } from "next/server";
import PaymentServices from "@/lib/services/paymentservices/paymentservices";
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";

const paymentServices = new PaymentServices();

export async function POST(request) {
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        let hostelId = null;
        if (auth.user.role === 'WARDEN') {
            hostelId = auth.user.hostelId;
            if (!hostelId) {
                const wardenProfile = await prisma.user.findUnique({
                    where: { id: auth.user.userId || auth.user.id },
                    select: { hostelId: true }
                });
                hostelId = wardenProfile?.hostelId;
            }
        }

        const results = await paymentServices.initializeDuePayments(hostelId);
        return NextResponse.json({
            success: true,
            message: `Successfully initialized ${results.length} pending rent records ${hostelId ? "for your hostel" : "globally"}.`,
            count: results.length
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
