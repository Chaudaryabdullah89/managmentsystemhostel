export const dynamic = 'force-dynamic';
import { prisma } from "@/lib/prisma";
import { requireRoles } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";

export async function GET(request) {
    const guard = await requireRoles(['ADMIN', 'WARDEN']);
    if (!guard.ok) return guard.response;
    const auth = { user: guard.user };

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const userId = searchParams.get('userId');
        const paymentId = searchParams.get('paymentId');

        let hostelId = null;

        // Security: Wardens can ONLY see their assigned hostel's refunds
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

        const where = {
            AND: [
                status ? { status } : {},
                userId ? { userId } : {},
                paymentId ? { paymentId } : {},
                hostelId ? { hostelId } : {}
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

        return successResponse({ refundRequests });
    } catch (error) {
        return errorResponse(error.message, 500, { error: error.message });
    }
}
