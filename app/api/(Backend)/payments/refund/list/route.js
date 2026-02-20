import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const userId = searchParams.get('userId');
        const paymentId = searchParams.get('paymentId');

        const where = {
            AND: [
                status ? { status } : {},
                userId ? { userId } : {},
                paymentId ? { paymentId } : {}
            ]
        };

        const refundRequests = await prisma.refundRequest.findMany({
            where,
            include: {
                User: { select: { name: true, email: true } },
                Payment: { include: { Booking: { include: { Room: { include: { Hostel: true } } } } } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ success: true, refundRequests });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
