export const dynamic = 'force-dynamic';
import { requireAuth } from "@/lib/apiAuth";
import { errorResponse, successResponse } from "@/lib/apiResponse";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/bookings/calendar
 * Query params:
 *   hostelId  - required (admin can pass any, warden auto-scoped to their hostel)
 *   startDate - ISO date string (defaults to today)
 *   endDate   - ISO date string (defaults to startDate + 13 days)
 */
export async function GET(request) {
    const guard = await requireAuth();
    if (!guard.ok) return guard.response;
    const { user } = guard;

    try {
        const { searchParams } = new URL(request.url);
        let hostelId = searchParams.get("hostelId");
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");

        // ── Date range ──────────────────────────────────────────────────────
        const startDate = startDateParam
            ? new Date(startDateParam)
            : (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
        const endDate = endDateParam
            ? new Date(endDateParam)
            : new Date(startDate.getTime() + 13 * 24 * 60 * 60 * 1000);
        endDate.setHours(23, 59, 59, 999);

        // ── Hostel scoping ───────────────────────────────────────────────────
        if (user.role === 'WARDEN') {
            // Wardens can only see their assigned hostel
            let wardenHostelId = user.hostelId;
            if (!wardenHostelId) {
                const profile = await prisma.user.findUnique({
                    where: { id: user.userId || user.id },
                    select: { hostelId: true },
                });
                wardenHostelId = profile?.hostelId;
            }
            hostelId = wardenHostelId;
        }

        if (!hostelId) {
            return errorResponse("hostelId is required", 400);
        }

        // ── Fetch rooms with bookings that overlap date range or checked out recently ────────────
        const lookbackStart = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        const rooms = await prisma.room.findMany({
            where: { hostelId },
            orderBy: [{ type: 'asc' }, { roomNumber: 'asc' }],
            include: {
                Booking: {
                    where: {
                        AND: [
                            { checkIn: { lt: endDate } },
                            {
                                OR: [
                                    { checkOut: { gt: lookbackStart } },
                                    { checkOut: null },
                                ],
                            },
                            {
                                status: {
                                    notIn: ['CANCELLED', 'REJECTED'],
                                },
                            },
                        ],
                    },
                    include: {
                        User: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                phone: true,
                                cnic: true,
                            },
                        },
                        Payment: {
                            select: {
                                id: true,
                                status: true,
                                amount: true,
                                dueDate: true,
                            },
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                    orderBy: { checkIn: 'asc' },
                },
            },
        });

        // ── Shape response ───────────────────────────────────────────────────
        const shaped = rooms.map((room) => ({
            id: room.id,
            roomNumber: room.roomNumber,
            floor: room.floor,
            type: room.type,
            capacity: room.capacity,
            status: room.status,
            monthlyRent: room.montlyrent,
            bookings: room.Booking.map((b) => ({
                id: b.id,
                uid: b.uid,
                checkIn: b.checkIn,
                checkOut: b.checkOut,
                status: b.status,
                totalAmount: b.totalAmount,
                monthlyRent: b.monthlyRent,
                user: b.User,
                latestPayment: b.Payment?.[0] ?? null,
            })),
        }));

        return successResponse({
            message: "Calendar data fetched successfully",
            data: shaped,
            meta: {
                hostelId,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
        });
    } catch (error) {
        console.error("[Calendar API]", error);
        return errorResponse(error.message, 500);
    }
}
